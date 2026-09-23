import { CRUDPage } from '@/components/CRUDPage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileText, AlertCircle } from 'lucide-react'
import { useLeases, useCreateEntity, useUpdateEntity, useDeleteEntity, useProperties, useProfiles } from '@/hooks/useSupabase'
import type { Lease, Property } from '@/types'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import * as React from 'react'

type LeaseStatus = Lease['status']

const LEASE_STATUSES: { value: LeaseStatus; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'vencido', label: 'Vencido' },
]

const FILTER_STATUS = LEASE_STATUSES

export function ContractsAdmin() {
  const { data: leases, error, refetch } = useLeases()
  const { data: properties } = useProperties()
  const { data: profiles } = useProfiles()
  const { create } = useCreateEntity('leases')
  const { update } = useUpdateEntity('leases')
  const { remove } = useDeleteEntity('leases')

  const tenants = (profiles || []).filter(p => p.role === 'cliente')
  const landlords = (profiles || []).filter(p => p.role === 'cliente')

  const columns: Array<{ key: string; header: string; render: (l: Lease & { property?: Property }) => React.ReactNode }> = [
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

  const handleCreate = async (data: Partial<Lease>) => {
    const { data: result, error } = await create(data)
    if (error) throw error
    return result
  }

  const handleUpdate = async (id: string, data: Partial<Lease>) => {
    const { data: result, error } = await update(id, data)
    if (error) throw error
    return result
  }

  const handleDelete = async (id: string) => {
    const { error } = await remove(id)
    if (error) throw error
  }

  const renderForm = ({
    formData,
    setFormData,
  }: {
    item: Lease | null
    formData: Partial<Lease>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Lease>>>
    onSubmit: (e: React.FormEvent) => void
    saving: boolean
    isEditing: boolean
  }) => {
    return (
      <div>
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Imóvel</Label>
              <Select
                value={formData.property_id || ''}
                onValueChange={(v) => setFormData({ ...formData, property_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.title} - {prop.city}/{prop.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Locatário</Label>
              <Select
                value={formData.tenant_id || ''}
                onValueChange={(v) => setFormData({ ...formData, tenant_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o locatário" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Locador</Label>
              <Select
                value={formData.landlord_id || ''}
                onValueChange={(v) => setFormData({ ...formData, landlord_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o locador" />
                </SelectTrigger>
                <SelectContent>
                  {landlords.map((landlord) => (
                    <SelectItem key={landlord.id} value={landlord.id}>
                      {landlord.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Aluguel Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.monthly_rent || ''}
                onChange={(e) => setFormData({ ...formData, monthly_rent: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                required
                min={0}
              />
            </div>

            <div className="space-y-1">
              <Label>Dia de Vencimento</Label>
              <Input
                type="number"
                value={formData.payment_day || ''}
                onChange={(e) => setFormData({ ...formData, payment_day: parseInt(e.target.value) || 1 })}
                placeholder="1-31"
                min={1}
                max={31}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Valor do Depósito (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.deposit || ''}
                onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                min={0}
              />
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={formData.status || 'pendente'}
                onValueChange={(v) => setFormData({ ...formData, status: v as LeaseStatus })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {LEASE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Data Término</Label>
              <Input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o contrato"
                rows={3}
              />
            </div>
          </div>
        </form>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center gap-4 text-destructive bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Erro ao carregar contratos</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <CRUDPage<Lease & { property?: Property }>
      title="Contratos"
      subtitle="Cadastre e gerencie os contratos de locação"
      columns={columns}
      fetchData={async () => {
        await refetch()
        const enriched = (leases || []).map(lease => ({
          ...lease,
          property: properties?.find(p => p.id === lease.property_id),
          tenant: profiles?.find(p => p.id === lease.tenant_id),
          landlord: profiles?.find(p => p.id === lease.landlord_id),
        }))
        return enriched
      }}
      createItem={handleCreate}
      updateItem={handleUpdate}
      deleteItem={handleDelete}
      getItemId={(l) => l.id}
      filters={{
        status: FILTER_STATUS,
      }}
      renderForm={renderForm}
      formSize="2xl"
      emptyStateIcon={
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
      }
      emptyStateMessage="Nenhum contrato cadastrado"
      renderActions={(item: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const methods = (globalThis as any).__crudPageMethods
              if (methods?.openEdit) {
                methods.openEdit(item)
              }
            }}
            className="text-muted-foreground hover:text-primary transition-transform hover:scale-110 active:scale-95"
            title="Editar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const methods = (globalThis as any).__crudPageMethods
              if (methods?.deleteItem) {
                methods.deleteItem(item.id)
              }
            }}
            className="text-muted-foreground hover:text-destructive transition-transform hover:scale-110 active:scale-95"
            title="Excluir"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </Button>
        </div>
      )}
    />
  )
}
