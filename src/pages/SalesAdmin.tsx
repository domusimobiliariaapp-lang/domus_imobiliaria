import { CRUDPage } from '@/components/CRUDPage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Briefcase, AlertCircle, Printer } from 'lucide-react'
import { useSales, useCreateEntity, useUpdateEntity, useDeleteEntity, useProperties, useProfiles } from '@/hooks/useSupabase'
import type { Sale, Property } from '@/types'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import * as React from 'react'
import { useState } from 'react'

type SaleStatus = Sale['status']

const SALE_STATUSES: { value: SaleStatus; label: string }[] = [
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'pendente', label: 'Pendente' },
]

const FILTER_STATUS = SALE_STATUSES

export function SalesAdmin() {
  const { data: sales, error, refetch } = useSales()
  const { data: properties } = useProperties()
  const { data: profiles } = useProfiles()
  const { create } = useCreateEntity('sales')
  const { update } = useUpdateEntity('sales')
  const { remove } = useDeleteEntity('sales')
  const [tab, setTab] = useState('lista')

  const availableProperties = (properties || []).filter(p => p.status !== 'vendido')
  const buyers = (profiles || []).filter(p => p.role === 'cliente')
  const sellers = (profiles || []).filter(p => p.role === 'cliente')

  const columns: Array<{ key: string; header: string; render: (s: Sale & { property?: Property }) => React.ReactNode }> = [
    {
      key: 'property',
      header: 'Imóvel',
      render: (s: any) => <span className="font-medium">{s.property?.title || 'Carregando...'}</span>
    },
    {
      key: 'price',
      header: 'Valor (R$)',
      render: (s: Sale) => <span className="font-medium text-emerald-600">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.price)}
      </span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Sale) => <StatusBadge type="document" value={s.status === 'concluido' ? 'concluido' : s.status === 'cancelado' ? 'suspenso' : 'em_andamento'} />
    },
    {
      key: 'buyer',
      header: 'Comprador',
      render: (s: any) => <span>{s.buyer?.full_name || 'N/A'}</span>
    },
    {
      key: 'contract_date',
      header: 'Data Contrato',
      render: (s: Sale) => s.contract_date
        ? new Date(s.contract_date).toLocaleDateString('pt-BR')
        : '-'
    },
  ]

  const handleCreate = async (data: Partial<Sale>) => {
    const { data: result, error } = await create(data)
    if (error) throw error
    return result
  }

  const handleUpdate = async (id: string, data: Partial<Sale>) => {
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
    item: Sale | null
    formData: Partial<Sale>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Sale>>>
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
                  {availableProperties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.title} - {prop.city}/{prop.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Comprador</Label>
              <Select
                value={formData.buyer_id || ''}
                onValueChange={(v) => setFormData({ ...formData, buyer_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o comprador" />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map((buyer) => (
                    <SelectItem key={buyer.id} value={buyer.id}>
                      {buyer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Vendedor</Label>
              <Select
                value={formData.seller_id || ''}
                onValueChange={(v) => setFormData({ ...formData, seller_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Valor da Venda (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                required
                min={0}
              />
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={formData.status || 'pendente'}
                onValueChange={(v) => setFormData({ ...formData, status: v as SaleStatus })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {SALE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Data do Contrato</Label>
              <Input
                type="date"
                value={formData.contract_date || ''}
                onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre a venda"
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
          <p className="font-medium">Erro ao carregar vendas</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'lista' ? (
        <CRUDPage<Sale & { property?: Property }>
          title=""
          subtitle=""
          columns={columns}
          fetchData={async () => {
            await refetch()
            const enriched = (sales || []).map(sale => ({
              ...sale,
              property: properties?.find(p => p.id === sale.property_id),
              buyer: profiles?.find(p => p.id === sale.buyer_id),
              seller: profiles?.find(p => p.id === sale.seller_id),
            }))
            return enriched
          }}
          createItem={handleCreate}
          updateItem={handleUpdate}
          deleteItem={handleDelete}
          getItemId={(s) => s.id}
          filters={{ status: FILTER_STATUS }}
          renderForm={renderForm}
          formSize="2xl"
          emptyStateIcon={
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          }
          emptyStateMessage="Nenhuma venda cadastrada"
          renderActions={(item: any) => (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="icon"
                onClick={() => {
                  const methods = (globalThis as any).__crudPageMethods
                  if (methods?.openEdit) methods.openEdit(item)
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
                variant="ghost" size="icon"
                onClick={() => {
                  const methods = (globalThis as any).__crudPageMethods
                  if (methods?.deleteItem) methods.deleteItem(item.id)
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
      ) : (
        <SalesReportView />
      )}
    </div>
  )
}

function SalesReportView() {
  const { data: sales, loading, error } = useSales()
  const { data: properties } = useProperties()
  const { data: profiles } = useProfiles()
  const [filters, setFilters] = useState({ status: '', search: '' })

  const enrichedSales = (sales || []).map(sale => ({
    ...sale,
    property: properties?.find(p => p.id === sale.property_id),
    buyer: profiles?.find(p => p.id === sale.buyer_id),
    seller: profiles?.find(p => p.id === sale.seller_id),
  }))

  const filtered = enrichedSales.filter(s => {
    const ms = !filters.status || s.status === filters.status
    const msearch = !filters.search ||
      s.property?.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.buyer?.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.seller?.full_name.toLowerCase().includes(filters.search.toLowerCase())
    return ms && msearch
  })

  const handlePrint = () => window.print()

  if (error) {
    return (
      <div className="p-6 text-destructive bg-destructive/10 rounded-lg">
        <p className="font-medium">Erro ao carregar dados</p>
        <p className="text-sm">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Print header - visible only when printing */}
      <div className="print-header">
        <h1 className="text-2xl font-serif font-medium">Relatório de Vendas</h1>
        <p className="text-sm text-muted-foreground">
          Gerado em {new Date().toLocaleDateString('pt-BR')} • {filtered.length} registros
        </p>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-serif font-medium text-primary">Relatório de Vendas</h1>
          <p className="text-muted-foreground mt-1">Filtre e imprima o relatório de vendas</p>
        </div>
        <Button onClick={handlePrint} className="gap-2 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      <Card className="print:hidden">
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Buscar</Label>
              <Input placeholder="Imóvel, comprador, vendedor..." value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {SALE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Vendas ({filtered.length} registros)</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma venda encontrada com os filtros selecionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Imóvel</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Comprador</th>
                    <th className="text-left p-3 font-medium">Vendedor</th>
                    <th className="text-right p-3 font-medium">Valor (R$)</th>
                    <th className="text-left p-3 font-medium">Data Contrato</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{s.property?.title || '-'}</td>
                      <td className="p-3"><StatusBadge type="document" value={s.status === 'concluido' ? 'concluido' : s.status === 'cancelado' ? 'suspenso' : 'em_andamento'} /></td>
                      <td className="p-3">{s.buyer?.full_name || '-'}</td>
                      <td className="p-3">{s.seller?.full_name || '-'}</td>
                      <td className="p-3 text-right font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.price)}
                      </td>
                      <td className="p-3">{s.contract_date ? new Date(s.contract_date).toLocaleDateString('pt-BR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
