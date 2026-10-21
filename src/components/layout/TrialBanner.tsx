import { Clock, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { usePlanLimits } from '@/hooks/usePlanLimits'

export function TrialBanner() {
  const {
    status,
    planName,
    trialDaysRemaining,
    isTrialExpired,
    currentPropertiesCount,
    maxProperties,
    isAtPropertyLimit,
    loading,
  } = usePlanLimits()

  if (loading) return null

  // 0. Caso de Inadimplência / Atraso com Tolerância de Carência (past_due)
  if (status === 'past_due') {
    return (
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-950 dark:text-amber-200 px-4 py-2.5 text-xs sm:text-sm">
        <div className="container-domus flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Fatura em aberto:</strong> Houve uma falha ou atraso na renovação do seu plano.
              Você possui <strong>5 dias de carência</strong> para regularizar sem suspensão das suas operações.
            </span>
          </div>
          <Button
            size="sm"
            asChild
            className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0 cursor-pointer rounded-lg shadow-sm"
          >
            <Link to="/admin/upgrade" className="flex items-center gap-1">
              <span>Regularizar Pagamento</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // 0.1 Caso de Assinatura Cancelada / Suspensa
  if (status === 'canceled') {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 text-red-900 dark:text-red-200 px-4 py-2.5 text-xs sm:text-sm">
        <div className="container-domus flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>
              <strong>Assinatura suspensa.</strong> O acesso aos recursos do sistema está restrito por pendência financeira.
            </span>
          </div>
          <Button
            size="sm"
            asChild
            className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white shrink-0 cursor-pointer rounded-lg shadow-sm"
          >
            <Link to="/admin/upgrade" className="flex items-center gap-1">
              <span>Reativar Agora</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // 1. Caso de Trial Expirado
  if (isTrialExpired) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 text-red-900 dark:text-red-200 px-4 py-2.5 text-xs sm:text-sm">
        <div className="container-domus flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>
              <strong>Período de teste encerrado.</strong> Seu teste grátis de 3 dias expirou.
              Escolha seu plano para continuar administrando seus imóveis e emitindo cobranças.
            </span>
          </div>
          <Button
            size="sm"
            asChild
            className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white shrink-0 cursor-pointer rounded-lg shadow-sm"
          >
            <Link to="/admin/upgrade" className="flex items-center gap-1">
              <span>Reativar Acesso</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // 2. Caso de Trial Ativo (com contagem regressiva)
  if (status === 'trial') {
    const isLastDay = trialDaysRemaining !== null && trialDaysRemaining <= 1
    const daysText =
      trialDaysRemaining === 0
        ? 'expira hoje'
        : trialDaysRemaining === 1
        ? 'resta 1 dia'
        : `restam ${trialDaysRemaining ?? 3} dias`

    return (
      <div className="bg-[#AD7B3B]/10 border-b border-[#AD7B3B]/20 text-[#17323D] dark:text-[#EEECE5] px-4 py-2.5 text-xs sm:text-sm">
        <div className="container-domus flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Clock className={`w-4 h-4 text-[#AD7B3B] shrink-0 ${isLastDay ? 'animate-pulse' : ''}`} />
            <span>
              Você está testando o <strong>Plano {planName}</strong> com acesso total: <strong>{daysText}</strong> de avaliação.
            </span>
          </div>
          <Button
            size="sm"
            asChild
            className="h-8 px-3 text-xs bg-[#17323D] hover:bg-[#17323D]/90 text-white shrink-0 cursor-pointer rounded-lg"
          >
            <Link to="/admin/upgrade" className="flex items-center gap-1">
              <span>Garantir Meu Plano</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // 3. Caso tenha atingido o teto de imóveis do plano
  if (isAtPropertyLimit && maxProperties !== null) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-950 dark:text-amber-200 px-4 py-2.5 text-xs sm:text-sm">
        <div className="container-domus flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Limite de imóveis atingido:</strong> Você está utilizando {currentPropertiesCount} de {maxProperties} imóveis do seu plano {planName}.
            </span>
          </div>
          <Button
            size="sm"
            asChild
            className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0 cursor-pointer rounded-lg"
          >
            <Link to="/admin/upgrade" className="flex items-center gap-1">
              <span>Aumentar Carteira</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return null
}
