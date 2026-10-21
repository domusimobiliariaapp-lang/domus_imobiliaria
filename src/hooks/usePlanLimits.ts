import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { SaasPlan, SubscriptionStatus } from '@/types'

export interface OrgSubscriptionInfo {
  planId: string
  planName: string
  status: SubscriptionStatus
  trialEndsAt: string | null
  trialDaysRemaining: number | null
  isTrialExpired: boolean
  maxProperties: number | null
  maxUsers: number | null
  features: Record<string, boolean>
  currentPropertiesCount: number
  isAtPropertyLimit: boolean
  loading: boolean
  reload: () => Promise<void>
}

export function usePlanLimits(): OrgSubscriptionInfo {
  const { profile } = useAuth()
  const currentOrgId = profile?.org_id
  const isDev = profile?.role === 'dev'
  const [info, setInfo] = useState<OrgSubscriptionInfo>({
    planId: 'pro',
    planName: 'Profissional',
    status: 'active',
    trialEndsAt: null,
    trialDaysRemaining: null,
    isTrialExpired: false,
    maxProperties: 150,
    maxUsers: 6,
    features: { crm: true, portal: true, vistorias: true, subdomain: true },
    currentPropertiesCount: 0,
    isAtPropertyLimit: false,
    loading: true,
    reload: async () => {},
  })

  useEffect(() => {
    if (!currentOrgId && !isDev) {
      setInfo((prev) => ({ ...prev, loading: false }))
      return
    }

    const loadSubscription = async () => {
      try {
        // Se for DEV, tem acesso irrestrito
        if (isDev) {
          setInfo({
            planId: 'enterprise',
            planName: 'Enterprise (DEV)',
            status: 'active',
            trialEndsAt: null,
            trialDaysRemaining: null,
            isTrialExpired: false,
            maxProperties: null,
            maxUsers: null,
            features: { crm: true, portal: true, vistorias: true, subdomain: true, custom_domain: true },
            currentPropertiesCount: 0,
            isAtPropertyLimit: false,
            loading: false,
            reload: loadSubscription,
          })
          return
        }

        // Busca dados da organização atual e do plano
        const [orgRes, propCountRes] = await Promise.all([
          supabase
            .from('organizations')
            .select('plan_id, subscription_status, trial_ends_at, saas_plans(name, max_properties, max_users, features)')
            .eq('id', currentOrgId!)
            .single(),
          supabase
            .from('properties')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', currentOrgId!),
        ])

        if (orgRes.data) {
          const orgData: any = orgRes.data
          const planData = orgData.saas_plans as SaasPlan | null
          const status = (orgData.subscription_status || 'trial') as SubscriptionStatus
          const trialEnds = orgData.trial_ends_at ? new Date(orgData.trial_ends_at) : null
          const now = new Date()

          let daysRemaining: number | null = null
          let expired = false

          if (status === 'trial' && trialEnds) {
            const diffMs = trialEnds.getTime() - now.getTime()
            daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
            expired = diffMs <= 0
          }

          const propCount = propCountRes.count ?? 0
          const maxProps = planData?.max_properties ?? null
          const atLimit = maxProps !== null ? propCount >= maxProps : false

          const localSimulatedPlan = localStorage.getItem(`domus_simulated_plan_${currentOrgId}`)
          const localSimulatedStatus = (localStorage.getItem(`domus_simulated_status_${currentOrgId}`) as SubscriptionStatus) || status

          setInfo({
            planId: localSimulatedPlan || orgData.plan_id || 'pro',
            planName: localSimulatedPlan === 'enterprise' ? 'Enterprise' : localSimulatedPlan === 'starter' ? 'Starter' : planData?.name || 'Profissional',
            status: localSimulatedStatus,
            trialEndsAt: orgData.trial_ends_at,
            trialDaysRemaining: daysRemaining,
            isTrialExpired: expired,
            maxProperties: maxProps,
            maxUsers: planData?.max_users ?? null,
            features: (planData?.features as any) || { crm: true, portal: true, vistorias: true, subdomain: true },
            currentPropertiesCount: propCount,
            isAtPropertyLimit: atLimit,
            loading: false,
            reload: loadSubscription,
          })
        } else {
          setInfo((prev) => ({ ...prev, loading: false, reload: loadSubscription }))
        }
      } catch {
        const localSimulatedPlan = currentOrgId ? localStorage.getItem(`domus_simulated_plan_${currentOrgId}`) : null
        setInfo((prev) => ({
          ...prev,
          planId: localSimulatedPlan || prev.planId,
          planName: localSimulatedPlan === 'enterprise' ? 'Enterprise' : localSimulatedPlan === 'starter' ? 'Starter' : prev.planName,
          status: 'active',
          loading: false,
          reload: loadSubscription,
        }))
      }
    }

    loadSubscription()

    const handlePlanUpdated = () => {
      loadSubscription()
    }
    window.addEventListener('domus:plan-updated', handlePlanUpdated)
    return () => {
      window.removeEventListener('domus:plan-updated', handlePlanUpdated)
    }
  }, [currentOrgId, isDev])

  return info
}
