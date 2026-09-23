import { CRUDPage } from '@/components/CRUDPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, AlertCircle, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { usePayments, useUpdateEntity, useLeases, useProfiles } from '@/hooks/useSupabase'
import type { Payment, Lease, Profile } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import * as React from 'react'

type PaymentStatus = Payment['status']

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'atrasado', label: 'Atrasado' },
]

const FILTER_STATUS = PAYMENT_STATUSES

export function FinancialAdmin() {
  const { data: payments, error, refetch } = usePayments()
  const { data: leases } = useLeases()
  const { data: profiles } = useProfiles()
  const { update } = useUpdateEntity('payments')

  // Calculate stats
  const stats = React.useMemo(() => {
    const pending = payments?.filter(p => p.status === 'pendente') || []
    const collected = payments?.filter(p => p.status === 'pago') || []
    const overdue = payments?.filter(p => p.status === 'atrasado') || []

    return {
      totalPending: pending.reduce((sum, p) => sum + Number(p.amount), 0),
      totalCollected: collected.reduce((sum, p) => sum + Number(p.amount), 0),
      totalOverdue: overdue.reduce((sum, p) => sum + Number(p.amount), 0),
      pendingCount: pending.length,
      collectedCount: collected.length,
      overdueCount: overdue.length,
    }
  }, [payments])

  // Enrich payments with lease and tenant info
  const enrichedPayments = (payments || []).map(payment => ({
    ...payment,
    lease: leases?.find(l => l.id === payment.lease_id),
    tenant: profiles?.find(p => p.id === payment.tenant_id),
  }))

  const handleUpdate = async (id: string, data: Partial<Payment>) => {
    const { data: result, error } = await update(id, data)
    if (error) throw error
    return result
  }

  const handleMarkAsPaid = async (payment: Payment) => {
    await handleUpdate(payment.id, {
      status: 'pago',
      paid_date: new Date().toISOString().split('T')[0],
    })
    await refetch()
  }

  const columns: Array<{ key: string; header: string; render: (p: Payment & { lease?: Lease; tenant?: Profile }) => React.ReactNode }> = [
    {
      key: 'lease',
      header: 'Contrato',
      render: (p: any) => <span className="font-medium">{p.lease ? `#${p.lease.id.slice(0, 8)}` : 'N/A'}</span>
    },
    {
      key: 'tenant',
      header: 'Inquilino',
      render: (p: any) => <span>{p.tenant?.full_name || 'N/A'}</span>
    },
    {
      key: 'amount',
      header: 'Valor (R$)',
      render: (p: Payment) => <span className="font-medium">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
      </span>
    },
    {
      key: 'due_date',
      header: 'Vencimento',
      render: (p: Payment) => new Date(p.due_date).toLocaleDateString('pt-BR')
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Payment) => <StatusBadge type="payment" value={p.status} />
    },
  ]

  const handleCreate = async () => {
    return {} as Payment
  }

  const handleDelete = async () => {
    return Promise.resolve()
  }

  const renderForm = (_props: {
    item: Payment | null
    formData: Partial<Payment>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Payment>>>
    saving: boolean
    isEditing: boolean
  }) => {
    // This form is simplified since payments are mostly auto-generated
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Pagamentos são gerados automaticamente a partir dos contratos de locação.</p>
        <p className="text-sm mt-2">Utilize o botão "Marcar como Pago" para registrar o recebimento.</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center gap-4 text-destructive bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Erro ao carregar pagamentos</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
            <div className="mt-2 text-sm font-medium text-yellow-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPending)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.collectedCount}</p>
                <p className="text-xs text-muted-foreground">Recebidos</p>
              </div>
            </div>
            <div className="mt-2 text-sm font-medium text-emerald-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCollected)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.overdueCount}</p>
                <p className="text-xs text-muted-foreground">Atrasados</p>
              </div>
            </div>
            <div className="mt-2 text-sm font-medium text-red-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalOverdue)}
            </div>
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
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(
                    stats.totalCollected + stats.totalPending
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Total previsto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <CRUDPage<Payment & { lease?: Lease; tenant?: Profile }>
        title="Pagamentos"
        subtitle="Gerencie os pagamentos de aluguéis"
        columns={columns}
        fetchData={async () => {
          await refetch()
          return enrichedPayments
        }}
        createItem={handleCreate}
        updateItem={handleUpdate}
        deleteItem={handleDelete}
        getItemId={(p) => p.id}
        filters={{
          status: FILTER_STATUS,
        }}
        renderForm={renderForm}
        formSize="lg"
        emptyStateIcon={
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        }
        emptyStateMessage="Nenhum pagamento registrado"
        renderActions={(item: any) => (
          <div className="flex items-center gap-1">
            {item.status !== 'pago' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMarkAsPaid(item)}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                title="Marcar como Pago"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </Button>
            )}
          </div>
        )}
      />
    </div>
  )
}
