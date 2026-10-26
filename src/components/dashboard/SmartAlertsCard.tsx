import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowRight,
  MessageCircle,
  FileSignature,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import type { Lease, Payment } from '@/types'

interface SmartAlertsCardProps {
  leases: Lease[] | null
  payments: Payment[] | null
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export function SmartAlertsCard({ leases, payments }: SmartAlertsCardProps) {
  // 1. Aluguéis atrasados (Inadimplência)
  const overduePayments = useMemo(() => {
    if (!payments) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return payments.filter((p) => {
      if (p.status === 'pago') return false
      const due = new Date(p.due_date)
      return due < today || p.status === 'atrasado'
    })
  }, [payments])

  const totalOverdue = useMemo(() => {
    return overduePayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  }, [overduePayments])

  // 2. Contratos vencendo em até 45 dias
  const expiringContracts = useMemo(() => {
    if (!leases) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return leases.filter((l) => {
      if (l.status !== 'ativo' || !l.end_date) return false
      const end = new Date(l.end_date)
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 45
    })
  }, [leases])

  // 3. Contratos aguardando assinatura eletrônica
  const pendingSignatures = useMemo(() => {
    if (!leases) return []
    return leases.filter((l) => l.signature_status === 'aguardando_assinaturas')
  }, [leases])

  const hasAnyAlert =
    overduePayments.length > 0 || expiringContracts.length > 0 || pendingSignatures.length > 0

  if (!hasAnyAlert) {
    return (
      <Card className="border-emerald-200/60 bg-gradient-to-r from-emerald-50/50 via-card to-emerald-50/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Operação em Dia
              </p>
              <p className="text-xs text-muted-foreground">
                Nenhum pagamento em atraso ou contrato crítico vencendo no curto prazo.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-300">
            100% Regularizado
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Alertas Inteligentes Prioritários
        </h3>
        <span className="text-xs text-muted-foreground">Requer sua atenção hoje</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Alerta de Inadimplência */}
        {overduePayments.length > 0 && (
          <Card className="border-red-200 bg-red-50/40 dark:bg-red-950/20 hover:border-red-300 transition-colors shadow-2xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px]">
                  {overduePayments.length} atrasado{overduePayments.length > 1 ? 's' : ''}
                </Badge>
              </div>

              <div>
                <p className="text-xs font-semibold text-red-900 dark:text-red-300">
                  Inadimplência de Aluguéis
                </p>
                <p className="text-lg font-bold text-red-700 dark:text-red-400">
                  {formatCurrency(totalOverdue)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Atraso registrado aguardando liquidação ou cobrança.
                </p>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 bg-white border-red-200 hover:bg-red-100/50 text-red-700 justify-between"
              >
                <Link to="/admin/financial">
                  <span>Abrir Financeiro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Alerta de Contratos Vencendo */}
        {expiringContracts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-300 transition-colors shadow-2xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                  Próximos 45 dias
                </Badge>
              </div>

              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                  Renovação de Contratos
                </p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                  {expiringContracts.length} contrato{expiringContracts.length > 1 ? 's' : ''}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Tempo hábil para propor reajuste e evitar desocupação.
                </p>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 bg-white border-amber-200 hover:bg-amber-100/50 text-amber-700 justify-between"
              >
                <Link to="/admin/contracts">
                  <span>Ver Contratos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Alerta de Assinaturas Pendentes */}
        {pendingSignatures.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-300 transition-colors shadow-2xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <FileSignature className="w-4 h-4" />
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">
                  Eletrônica
                </Badge>
              </div>

              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                  Aguardando Assinatura
                </p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                  {pendingSignatures.length} pendente{pendingSignatures.length > 1 ? 's' : ''}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Locador ou inquilino ainda não assinaram o termo.
                </p>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 bg-white border-blue-200 hover:bg-blue-100/50 text-blue-700 justify-between"
              >
                <Link to="/admin/contracts">
                  <span>Enviar Lembrete</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
