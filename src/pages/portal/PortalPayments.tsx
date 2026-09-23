import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { usePayments } from '@/hooks/useSupabase'
import { useLeases } from '@/hooks/useSupabase'
import { useProfiles } from '@/hooks/useSupabase'
import { useUpdateEntity } from '@/hooks/useSupabase'

type PaymentStatus = 'pendente' | 'pago' | 'atrasado'

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
}

export function PortalPayments() {
  const { data: payments, loading, refetch } = usePayments()
  const { data: leases } = useLeases()
  const { data: profiles } = useProfiles()
  const { update } = useUpdateEntity('payments')

  const handleMarkAsPaid = async (payment: any) => {
    try {
      await update(payment.id, {
        status: 'pago',
        paid_date: new Date().toISOString().split('T')[0],
      })
      await refetch()
    } catch (err) {
      console.error('Erro ao marcar como pago:', err)
    }
  }

  const enrichedPayments = (payments || []).map(payment => ({
    ...payment,
    lease: leases?.find(l => l.id === payment.lease_id),
    tenant: profiles?.find(p => p.id === payment.tenant_id),
  }))

  const stats = {
    total: payments?.length || 0,
    pending: payments?.filter(p => p.status === 'pendente').length || 0,
    paid: payments?.filter(p => p.status === 'pago').length || 0,
    overdue: payments?.filter(p => p.status === 'atrasado').length || 0,
    totalAmount: payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    paidAmount: payments?.filter(p => p.status === 'pago').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-medium text-primary">Pagamentos</h1>
        <p className="text-muted-foreground mt-1">Acompanhe seus pagamentos de aluguel</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
            <p className="text-sm font-medium text-yellow-600 mt-2">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                payments?.filter(p => p.status === 'pendente').reduce((sum, p) => sum + Number(p.amount), 0) || 0
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.paid}</p>
                <p className="text-xs text-muted-foreground">Pagos</p>
              </div>
            </div>
            <p className="text-sm font-medium text-emerald-600 mt-2">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.paidAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">Atrasados</p>
              </div>
            </div>
            <p className="text-sm font-medium text-red-600 mt-2">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                payments?.filter(p => p.status === 'atrasado').reduce((sum, p) => sum + Number(p.amount), 0) || 0
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(stats.totalAmount)}
                </p>
                <p className="text-xs text-muted-foreground">Total Geral</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : enrichedPayments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum pagamento registrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrichedPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      payment.status === 'pago' ? 'bg-emerald-100' :
                      payment.status === 'atrasado' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {payment.status === 'pago' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : payment.status === 'atrasado' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Calendar className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                        </span>
                        <Badge variant={payment.status === 'pago' ? 'default' : payment.status === 'atrasado' ? 'destructive' : 'secondary'}>
                          {STATUS_LABELS[payment.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                        {payment.paid_date && ` • Pago em: ${new Date(payment.paid_date).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </div>

                  {payment.status !== 'pago' && (
                    <Button
                      onClick={() => handleMarkAsPaid(payment)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Pagamento
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
