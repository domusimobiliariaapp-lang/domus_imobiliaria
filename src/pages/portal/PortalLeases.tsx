import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, DollarSign, User } from 'lucide-react'
import { useLeases } from '@/hooks/useSupabase'
import { useProperties } from '@/hooks/useSupabase'
import { useProfiles } from '@/hooks/useSupabase'

type LeaseStatus = 'ativo' | 'pendente' | 'cancelado' | 'vencido'

const STATUS_LABELS: Record<LeaseStatus, string> = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
  vencido: 'Vencido',
}

export function PortalLeases() {
  const { data: leases, loading } = useLeases()
  const { data: properties } = useProperties()
  const { data: profiles } = useProfiles()

  const enrichedLeases = (leases || []).map(lease => ({
    ...lease,
    property: properties?.find(p => p.id === lease.property_id),
    tenant: profiles?.find(p => p.id === lease.tenant_id),
    landlord: profiles?.find(p => p.id === lease.landlord_id),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-medium text-primary">Minhas Locações</h1>
        <p className="text-muted-foreground mt-1">Acompanhe o status dos seus contratos</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : enrichedLeases.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Você não possui locações cadastradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrichedLeases.map((lease) => (
            <Card key={lease.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {lease.property?.title || 'Imóvel não encontrado'}
                  </CardTitle>
                  <Badge variant={lease.status === 'ativo' ? 'default' : lease.status === 'cancelado' ? 'destructive' : 'secondary'}>
                    {STATUS_LABELS[lease.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Início</p>
                      <p className="font-medium">
                        {new Date(lease.start_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Término</p>
                      <p className="font-medium">
                        {new Date(lease.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Aluguel Mensal</p>
                      <p className="font-medium text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lease.monthly_rent)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Vencimento</p>
                      <p className="font-medium">Dia {lease.payment_day}</p>
                    </div>
                  </div>
                </div>

                {lease.property && (
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{lease.property.address}, {lease.property.neighborhood} - {lease.property.city}/{lease.property.state}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
