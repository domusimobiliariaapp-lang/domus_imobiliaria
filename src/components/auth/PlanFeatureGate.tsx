import React from 'react'
import { Sparkles, Lock, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import type { SaasPlanFeatures } from '@/types'

interface PlanFeatureGateProps {
  feature: keyof SaasPlanFeatures
  title: string
  description: string
  benefits: string[]
  children: React.ReactNode
}

export function PlanFeatureGate({
  feature,
  title,
  description,
  benefits,
  children,
}: PlanFeatureGateProps) {
  const info = usePlanLimits()

  if (info.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AD7B3B]" />
      </div>
    )
  }

  const isEnabled = info.features?.[feature] ?? true

  if (isEnabled) {
    return <>{children}</>
  }

  // Se o recurso estiver bloqueado no plano atual (ex: Starter tentando usar CRM ou Vistorias)
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Card className="border-border bg-gradient-to-b from-card to-card/60 shadow-xl overflow-hidden rounded-2xl">
        <div className="p-8 sm:p-12 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#AD7B3B]/10 border border-[#AD7B3B]/20 text-[#AD7B3B] flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Disponível nos Planos Profissional e Enterprise</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#17323D] dark:text-[#EEECE5]">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-muted/40 border border-border text-left space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              O que você ganha com o upgrade:
            </p>
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              asChild
              className="w-full sm:w-auto h-11 px-6 bg-[#17323D] hover:bg-[#17323D]/90 text-white font-medium flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-md"
            >
              <Link to="/admin/upgrade">
                <Sparkles className="w-4 h-4 text-[#AD7B3B]" />
                <span>Fazer Upgrade para Liberar</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto h-11 px-5 cursor-pointer rounded-xl"
            >
              <Link to="/admin/dashboard">
                Voltar ao Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
