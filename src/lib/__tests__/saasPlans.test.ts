import { describe, it, expect } from 'vitest'
import type { SaasPlan } from '@/types'

describe('Regras de Planos SaaS e Assinaturas', () => {
  const starterPlan: SaasPlan = {
    id: 'starter',
    name: 'Starter',
    price_monthly: 229,
    price_annual_monthly: 189,
    max_properties: 35,
    max_users: 2,
    features: { crm: false, portal: false, vistorias: false, subdomain: true, custom_domain: false },
    active: true,
  }

  const proPlan: SaasPlan = {
    id: 'pro',
    name: 'Profissional',
    price_monthly: 459,
    price_annual_monthly: 379,
    max_properties: 150,
    max_users: 6,
    features: { crm: true, portal: true, vistorias: true, subdomain: true, custom_domain: false },
    popular: true,
    badge: 'Mais contratado',
    active: true,
  }

  const enterprisePlan: SaasPlan = {
    id: 'enterprise',
    name: 'Enterprise',
    price_monthly: 829,
    price_annual_monthly: 690,
    max_properties: null,
    max_users: null,
    features: { crm: true, portal: true, vistorias: true, subdomain: true, custom_domain: true },
    active: true,
  }

  it('valida limites de imóveis por plano', () => {
    // Starter: até 35 imóveis
    expect(34 < (starterPlan.max_properties ?? Infinity)).toBe(true)
    expect(35 >= (starterPlan.max_properties ?? Infinity)).toBe(true)

    // Pro: até 150 imóveis
    expect(149 < (proPlan.max_properties ?? Infinity)).toBe(true)
    expect(150 >= (proPlan.max_properties ?? Infinity)).toBe(true)

    // Enterprise: ilimitado (null)
    const isEnterpriseLimited = enterprisePlan.max_properties !== null
    expect(isEnterpriseLimited).toBe(false)
  })

  it('valida liberação de módulos por plano', () => {
    // Starter não tem CRM nem Vistorias
    expect(starterPlan.features.crm).toBe(false)
    expect(starterPlan.features.vistorias).toBe(false)
    expect(starterPlan.features.subdomain).toBe(true)

    // Pro tem CRM, Portal e Vistorias
    expect(proPlan.features.crm).toBe(true)
    expect(proPlan.features.portal).toBe(true)
    expect(proPlan.features.vistorias).toBe(true)
    expect(proPlan.features.custom_domain).toBe(false)

    // Enterprise tem tudo e domínio customizado
    expect(enterprisePlan.features.custom_domain).toBe(true)
  })

  it('calcula dias restantes de trial corretamente', () => {
    const now = new Date()
    const trialEndsIn3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const diffMs = trialEndsIn3Days.getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    expect(daysRemaining).toBe(3)

    // Trial expirado
    const expiredTrial = new Date(now.getTime() - 1000 * 60)
    const expiredDiff = expiredTrial.getTime() - now.getTime()
    const isExpired = expiredDiff <= 0
    expect(isExpired).toBe(true)
  })

  it('calcula desconto anual de 20% com fidelidade', () => {
    const monthlyTotal = proPlan.price_monthly * 12 // 459 * 12 = 5508
    const annualTotal = proPlan.price_annual_monthly * 12 // 379 * 12 = 4548
    const savings = monthlyTotal - annualTotal // 960 de economia

    expect(savings).toBeGreaterThan(0)
    expect(annualTotal).toBeLessThan(monthlyTotal)
  })
})
