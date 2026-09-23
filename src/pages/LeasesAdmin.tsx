import { CRUDPage } from '@/components/CRUDPage'
import { Button } from '@/components/ui/button'
import { FileText, AlertCircle } from 'lucide-react'
import { useLeases, useUpdateEntity } from '@/hooks/useSupabase'
import { useProperties } from '@/hooks/useSupabase'
import { useProfiles } from '@/hooks/useSupabase'
import { StatusBadge } from '@/components/ui/status-badge'
import type { Lease, Property, Profile } from '@/types'
import * as React from 'react'

type LeaseStatus = Lease['status']

const LEASE_STATUSES: { value: LeaseStatus; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'vencido', label: 'Vencido' },
]

export function LeasesAdmin() {
  const { data: leases, error, refetch } = useLeases()
  const { data: properties } = useProperties()
  const { data: profiles } = useProfiles()
  const { update } = useUpdateEntity('leases')

  const handleUpdate = async (id: string, data: Partial<Lease>) => {
    const { data: result, error } = await update(id, data)
    if (error) throw error
    return result
  }

  const columns: Array<{ key: string; header: string; render: (l: Lease & { property?: Property; tenant?: Profile; landlord?: Profile }) => React.ReactNode }> = [
    {
      key: 'property',
      header: 'Imóvel',
      render: (l: any) => <span className="font-medium">{l.property?.title || 'Carregando...'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (l: Lease) => <StatusBadge type="lease" value={l.status} />
    },
    {
      key: 'tenant',
      header: 'Locatário',
      render: (l: any) => <span>{l.tenant?.full_name || 'N/A'}</span>
    },
    {
      key: 'monthly_rent',
      header: 'Aluguel (R$)',
      render: (l: Lease) => <span className="font-medium">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.monthly_rent)}
      </span>
    },
    {
      key: 'start_date',
      header: 'Início',
      render: (l: Lease) => new Date(l.start_date).toLocaleDateString('pt-BR')
    },
    {
      key: 'end_date',
      header: 'Término',
      render: (l: Lease) => new Date(l.end_date).toLocaleDateString('pt-BR')
    },
  ]

  // Enrich leases with related data
  const enrichedLeases = (leases || []).map(lease => ({
    ...lease,
    property: properties?.find(p => p.id === lease.property_id),
    tenant: profiles?.find(p => p.id === lease.tenant_id),
    landlord: profiles?.find(p => p.id === lease.landlord_id),
  }))

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center gap-4 text-destructive bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Erro ao carregar locações</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <CRUDPage<Lease & { property?: Property; tenant?: Profile; landlord?: Profile }>
      title="Locações"
      subtitle="Listagem das locações ativas e histórico"
      columns={columns}
      fetchData={async () => {
        await refetch()
        return enrichedLeases
      }}
      createItem={async () => ({} as Lease)}
      updateItem={handleUpdate}
      deleteItem={async () => {}}
      getItemId={(l) => l.id}
      filters={{
        status: LEASE_STATUSES,
      }}
      formSize="lg"
      emptyStateIcon={
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
      }
      emptyStateMessage="Nenhuma locação encontrada"
    />
  )
}
