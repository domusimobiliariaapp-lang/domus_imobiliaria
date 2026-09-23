import { CRUDPage } from '@/components/CRUDPage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { User, AlertCircle } from 'lucide-react'
import { useClients, useCreateEntity, useUpdateEntity, useDeleteEntity } from '@/hooks/useSupabase'
import type { Client } from '@/types'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'

type TipoRelacao = NonNullable<Client['tipo_relacao']>
type Categoria = NonNullable<Client['categoria']>
type StatusCliente = NonNullable<Client['status']>

const formatCpfCnpj = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (numbers.startsWith('55')) {
    const local = numbers.slice(2)
    if (local.length === 10) {
      return local.replace(/(\d{2})(\d{4})(\d{4})/, '+55 ($1) $2-$3')
    }
    return local.replace(/(\d{2})(\d{5})(\d{4})/, '+55 ($1) $2-$3')
  }
  return value
}

const toE164 = (phone: string) => {
  const numbers = phone.replace(/\D/g, '')
  if (numbers.startsWith('55')) return numbers
  return '55' + numbers
}

const RELATION_TYPES: { value: TipoRelacao; label: string }[] = [
  { value: 'locatario', label: 'Locatário' },
  { value: 'locador', label: 'Locador' },
  { value: 'comprador', label: 'Comprador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'fiador', label: 'Fiador' },
]

const CATEGORIES: { value: Categoria; label: string }[] = [
  { value: 'pf', label: 'Pessoa Física' },
  { value: 'pj', label: 'Pessoa Jurídica' },
]

const STATUSES: { value: StatusCliente; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
]

const FILTER_STATUS = STATUSES.map(s => ({ value: s.value, label: s.label }))
const FILTER_TYPE = RELATION_TYPES.map(t => ({ value: t.value, label: t.label }))
const FILTER_CATEGORY = CATEGORIES.map(c => ({ value: c.value, label: c.label }))

export function ClientsAdmin() {
  const { data: clients, error, refetch } = useClients()
  const { create } = useCreateEntity('profiles')
  const { update } = useUpdateEntity('profiles')
  const { remove } = useDeleteEntity('profiles')

  const columns: Array<{ key: string; header: string; render: (c: Client) => React.ReactNode }> = [
    { key: 'full_name', header: 'Nome / Razão Social', render: (c: Client) => <span className="font-medium">{c.full_name}</span> },
    { key: 'cpf_cnpj_limpo', header: 'CPF/CNPJ', render: (c: Client) => <span className="font-mono text-sm">{c.cpf_cnpj_limpo ? formatCpfCnpj(c.cpf_cnpj_limpo) : '-'}</span> },
    { key: 'telefone_e164', header: 'Telefone', render: (c: Client) => <span>{c.telefone_e164 ? formatPhone(c.telefone_e164) : '-'}</span> },
    { key: 'tipo_relacao', header: 'Relação', render: (c: Client) => <span className="text-sm capitalize">{c.tipo_relacao ? c.tipo_relacao.replace('_', ' ') : '-'}</span> },
    { key: 'email', header: 'E-mail', render: (c: Client) => c.email ? <span className="font-mono text-sm">{c.email}</span> : <span className="text-muted-foreground">-</span> },
    { key: 'status', header: 'Status', render: (c: Client) => <StatusBadge type="document" value={c.status === 'ativo' ? 'concluido' : 'suspenso'} /> },
  ]

  const handleCreate = async (data: Partial<Client>) => {
    const { data: result, error } = await create({
      ...data,
      role: 'cliente',
      telefone_e164: data.telefone_e164 ? toE164(data.telefone_e164) : null,
      cpf_cnpj_limpo: data.cpf_cnpj_limpo?.replace(/\D/g, '') || null,
    })
    if (error) throw error
    return result
  }

  const handleUpdate = async (id: string, data: Partial<Client>) => {
    const { data: result, error } = await update(id, {
      ...data,
      telefone_e164: data.telefone_e164 ? toE164(data.telefone_e164) : undefined,
      cpf_cnpj_limpo: data.cpf_cnpj_limpo?.replace(/\D/g, '') || null,
    })
    if (error) throw error
    return result
  }

  const handleDelete = async (id: string) => {
    const { error } = await remove(id)
    if (error) throw error
  }

  const renderForm = ({
    item,
    formData,
    setFormData,
    onSubmit,
    isEditing,
  }: {
    item: Client | null
    formData: Partial<Client>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Client>>>
    onSubmit: (e: React.FormEvent) => void
    isEditing: boolean
  }) => {
    const formatCpfCnpjInput = (value: string) => {
      const numbers = value.replace(/\D/g, '')
      if (numbers.length <= 11) {
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) => `${a}.${b}.${c}${d ? '-' + d : ''}`)
      }
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, d, e) => `${a}.${b}.${c}/${d}${e ? '-' + e : ''}`)
    }

    const formatPhoneInput = (value: string) => {
      const numbers = value.replace(/\D/g, '')
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}${c ? '-' + c : ''}`)
      }
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}${c ? '-' + c : ''}`)
    }

    // Use item to show client name in title when editing
    const formTitle = isEditing && item ? `Editar ${item.full_name}` : 'Novo Cliente'

    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">{formTitle}</h3>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Nome / Razão Social</Label>
              <Input
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nome completo ou razão social"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Tipo de Relação</Label>
              <Select
                value={formData.tipo_relacao || 'locatario'}
                onValueChange={(v) => setFormData({ ...formData, tipo_relacao: v as TipoRelacao })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select
                value={formData.categoria || 'pf'}
                onValueChange={(v) => setFormData({ ...formData, categoria: v as Categoria })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>CPF / CNPJ</Label>
              <Input
                value={formData.cpf_cnpj_limpo || ''}
                onChange={(e) => setFormData({ ...formData, cpf_cnpj_limpo: formatCpfCnpjInput(e.target.value) })}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                maxLength={18}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input
                value={formData.telefone_e164 || ''}
                onChange={(e) => setFormData({ ...formData, telefone_e164: formatPhoneInput(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Endereço</Label>
              <Textarea
                value={formData.endereco || ''}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={formData.status || 'ativo'}
                onValueChange={(v) => setFormData({ ...formData, status: v as StatusCliente })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações internas"
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
          <p className="font-medium">Erro ao carregar clientes</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <CRUDPage<Client>
      title="Clientes"
      subtitle="Gerencie os clientes da imobiliária"
      columns={columns}
      fetchData={async () => {
        await refetch()
        return clients || []
      }}
      createItem={handleCreate}
      updateItem={handleUpdate}
      deleteItem={handleDelete}
      getItemId={(c) => c.id}
      filters={{
        status: FILTER_STATUS,
        type: FILTER_TYPE,
        category: FILTER_CATEGORY,
      }}
      renderForm={renderForm}
      emptyStateIcon={
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
      }
      emptyStateMessage="Nenhum cliente cadastrado"
    />
  )
}