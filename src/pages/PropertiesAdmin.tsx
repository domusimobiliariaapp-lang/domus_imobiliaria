import { CRUDPage } from '@/components/CRUDPage'
import { Home, AlertCircle, Share2, Edit2, Trash2, Printer, Globe, FileSpreadsheet, Download } from 'lucide-react'
import { useProperties, useCreateEntity, useUpdateEntity } from '@/hooks/useSupabase'
import { useAuth } from '@/hooks/useAuth'
import type { Property } from '@/types'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { PropertyModal } from '@/components/PropertyModal'
import { PropertyImportModal } from '@/components/PropertyImportModal'
import { PortalIntegrationsTab } from '@/components/PortalIntegrationsTab'
import { SharePropertyModal } from '@/components/properties/SharePropertyModal'
import { exportPropertiesCsv } from '@/lib/exportCsv'
import { PropertyCard3D } from '@/components/ui/PropertyCard3D'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

type PropertyType = Property['type']
type PropertyStatus = Property['status']

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'studio', label: 'Kitnet / Studio' },
  { value: 'sobrado', label: 'Sobrado' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'sala', label: 'Sala' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'loja', label: 'Loja' },
  { value: 'chacara', label: 'Chácara' },
  { value: 'sitio', label: 'Sítio' },
]

const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'alugado', label: 'Alugado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'indisponivel', label: 'Indisponível' },
]

const FILTER_STATUS = PROPERTY_STATUSES
const FILTER_TYPE = PROPERTY_TYPES
const FILTER_PURPOSE = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'venda', label: 'Venda' },
  { value: 'temporada', label: 'Temporada' },
  { value: 'ambos', label: 'Ambos' },
]

export function PropertiesAdmin() {
  const { organization } = useAuth()
  const { data: properties = [], error, refetch } = useProperties()
  const { create } = useCreateEntity('properties')
  const { update } = useUpdateEntity('properties')
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') || 'lista'
  const [tab, setTab] = React.useState(tabFromUrl)

  React.useEffect(() => {
    const current = searchParams.get('tab') || 'lista'
    setTab(current)
  }, [searchParams])

  const handleTabChange = (newTab: string) => {
    setTab(newTab)
    if (newTab === 'lista') {
      searchParams.delete('tab')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ tab: newTab }, { replace: true })
    }
  }
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [sharingProperty, setSharingProperty] = useState<Property | null>(null)
  const [editingItem, setEditingItem] = useState<Property | null>(null)
  const [saving, setSaving] = useState(false)
  const [listVersion, setListVersion] = useState(0)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() =>
    localStorage.getItem('domus-properties-view') === 'cards' ? 'cards' : 'list'
  )
  const { addToast } = useToast()

  const columns: Array<{ key: string; header: string; render: (p: Property) => React.ReactNode }> = [
    { key: 'title', header: 'Título', render: (p: Property) => <span className="font-medium">{p.title}</span> },
    { key: 'type', header: 'Tipo', render: (p: Property) => <span className="text-sm text-muted-foreground capitalize">{PROPERTY_TYPES.find(t => t.value === p.type)?.label}</span> },
    { key: 'status', header: 'Status', render: (p: Property) => <StatusBadge type="property" value={p.status} /> },
    { key: 'city', header: 'Cidade', render: (p: Property) => <span className="text-sm">{p.city} - {p.state}</span> },
    { key: 'rent_price', header: 'Aluguel (R$)', render: (p: Property) => p.rent_price > 0
        ? <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.rent_price)}</span>
        : <span className="text-muted-foreground">—</span>
    },
    { key: 'sale_price', header: 'Venda (R$)', render: (p: Property) => p.sale_price > 0
        ? <span className="font-medium text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.sale_price)}</span>
        : <span className="text-muted-foreground">—</span>
    },
  ]

  const handleCreate = async (data: Partial<Property>) => {
    const result = await create({
      ...data,
      reference_code: data.reference_code?.trim() || null,
      available_from: data.available_from || null,
      images: data.images || [],
      videos: data.videos || [],
      features: data.features || [],
      rent_price: Number(data.rent_price) || 0,
      sale_price: Number(data.sale_price) || 0,
      iptu: Number(data.iptu) || 0,
      condo_fee: Number(data.condo_fee) || 0,
      gas_fee: Number(data.gas_fee) || 0,
      water_fee: Number(data.water_fee) || 0,
      electricity_fee: Number(data.electricity_fee) || 0,
      other_fees: Number(data.other_fees) || 0,
    })
    if (result.error) throw result.error
    return result.data
  }

  const handleUpdate = async (id: string, data: Partial<Property>) => {
    const result = await update(id, {
      ...data,
      reference_code: data.reference_code?.trim() || null,
      available_from: data.available_from || null,
    })
    if (result.error) throw result.error
    return result.data
  }

  const handleDelete = async (id: string) => {
    const result = await remove(id)
    if (result.error) throw result.error
  }

  const handleDeleteClick = async (property: Property) => {
    if (!window.confirm(`Excluir o imóvel "${property.title}"? Esta ação não pode ser desfeita.`)) return
    try {
      await handleDelete(property.id)
      addToast('Imóvel excluído com sucesso!', 'success')
      await refetch()
      setListVersion(version => version + 1)
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Erro ao excluir imóvel', 'error')
    }
  }

  const handleSave = async (data: Partial<Property>): Promise<boolean> => {
    setSaving(true)
    try {
      if (editingItem) {
        await handleUpdate(editingItem.id, data)
        addToast('Imóvel atualizado com sucesso!', 'success')
      } else {
        await handleCreate(data)
        addToast('Imóvel cadastrado com sucesso!', 'success')
      }
      setModalOpen(false)
      setEditingItem(null)
      await refetch()
      setListVersion(version => version + 1)
      return true
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Erro ao salvar imóvel', 'error')
      return false
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (item: Property) => {
    setEditingItem(item)
    setModalOpen(true)
  }

  const handleShare = (property: Property) => {
    setSharingProperty(property)
  }

  const changeViewMode = (mode: 'list' | 'cards') => {
    setViewMode(mode)
    localStorage.setItem('domus-properties-view', mode)
  }

  const propertyActions = (item: Property) => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Editar imóvel" aria-label={`Editar ${item.title}`}><Edit2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => void handleDeleteClick(item)} title="Excluir imóvel" aria-label={`Excluir ${item.title}`}><Trash2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => void handleShare(item)} title="Copiar link público" aria-label={`Compartilhar ${item.title}`}><Share2 className="h-4 w-4" /></Button>
    </div>
  )

  const propertyCard = (item: Property) => (
    <PropertyCard3D
      key={item.id}
      property={item}
      onEdit={openEdit}
      onDelete={handleDeleteClick}
      onShare={handleShare}
    />
  )

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center gap-4 text-destructive bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Erro ao carregar imóveis</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com Tabs e Ação de Importar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="portais" className="gap-2">
              <Globe className="h-4 w-4" />
              Portais & Feed XML
            </TabsTrigger>
            <TabsTrigger value="relatorio">Relatório</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'lista' && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPropertiesCsv(properties, organization?.slug || 'domus')}
              className="text-xs h-9 gap-1.5 cursor-pointer shadow-xs border-emerald-600/40 text-emerald-700 hover:bg-emerald-50"
              title="Exportar planilha de imóveis em formato Excel/CSV"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Excel</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="text-xs h-9 gap-1.5 cursor-pointer shadow-xs border-[#AD7B3B]/40 text-[#AD7B3B] hover:bg-[#AD7B3B]/10"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar CSV</span>
            </Button>
          </div>
        )}
      </div>

      {tab === 'lista' ? (
        <div className="space-y-6">
          <CRUDPage<Property>
            key={listVersion}
            persistState={false}
            viewMode={viewMode}
            onViewModeChange={changeViewMode}
            renderCard={propertyCard}
            title=""
            subtitle=""
            columns={columns}
            fetchData={async () => {
              const { data, error } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false })
              if (error) throw new Error(error.message)
              return data || []
            }}
            createItem={handleCreate}
            updateItem={handleUpdate}
            deleteItem={handleDelete}
            getItemId={(p) => p.id}
            onCreate={() => { setEditingItem(null); setModalOpen(true) }}
            filters={{
              status: FILTER_STATUS,
              type: FILTER_TYPE,
              category: FILTER_PURPOSE,
            }}
            emptyStateIcon={
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
            }
            emptyStateMessage="Nenhum imóvel cadastrado"
            renderActions={propertyActions}
          />
        </div>
      ) : tab === 'portais' ? (
        <PortalIntegrationsTab properties={properties || []} />
      ) : (
        <PropertiesReportView />
      )}

      {/* Property Modal */}
      <PropertyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={editingItem}
        onSave={handleSave}
        saving={saving}
      />

      {/* Property Import Modal */}
      <PropertyImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={() => {
          refetch()
          setListVersion((v) => v + 1)
        }}
      />

      {/* Share Property Modal */}
      {sharingProperty && (
        <SharePropertyModal
          open={!!sharingProperty}
          onOpenChange={(open) => !open && setSharingProperty(null)}
          property={sharingProperty}
          slug={organization?.slug || 'domus'}
          orgName={organization?.name}
        />
      )}
    </div>
  )
}

function PropertiesReportView() {
  const { data: props, loading, error } = useProperties()
  const [filters, setFilters] = useState({ status: '', type: '', search: '' })

  const filtered = (props || []).filter(p => {
    const ms = !filters.status || p.status === filters.status
    const mt = !filters.type || p.type === filters.type
    const msearch = !filters.search ||
      p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.address.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.city.toLowerCase().includes(filters.search.toLowerCase())
    return ms && mt && msearch
  })

  const handlePrint = () => window.print()

  if (error) {
    return (
      <div className="p-6 text-destructive bg-destructive/10 rounded-lg">
        <p className="font-medium">Erro ao carregar dados para relatório</p>
        <p className="text-sm">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Print header - visible only when printing */}
      <div className="print-header">
        <h1 className="text-2xl font-serif font-medium">Relatório de Imóveis</h1>
        <p className="text-sm text-muted-foreground">
          Gerado em {new Date().toLocaleDateString('pt-BR')} • {filtered.length} registros
        </p>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-serif font-medium text-primary">Relatório de Imóveis</h1>
          <p className="text-muted-foreground mt-1">Filtre e imprima o relatório completo</p>
        </div>
        <Button onClick={handlePrint} className="gap-2 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Buscar</label>
              <input
                type="text"
                placeholder="Título, endereço, cidade..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {PROPERTY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardHeader><CardTitle>Relatório de Imóveis ({filtered.length} registros)</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum imóvel encontrado com os filtros selecionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Título</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Endereço</th>
                    <th className="text-left p-3 font-medium">Cidade</th>
                    <th className="text-right p-3 font-medium">Área (m²)</th>
                    <th className="text-right p-3 font-medium">Aluguel</th>
                    <th className="text-right p-3 font-medium">Venda</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{p.title}</td>
                      <td className="p-3 capitalize">{PROPERTY_TYPES.find(t => t.value === p.type)?.label}</td>
                      <td className="p-3"><StatusBadge type="property" value={p.status} /></td>
                      <td className="p-3">{p.address}{p.address_number ? `, ${p.address_number}` : ''}</td>
                      <td className="p-3">{p.city} - {p.state}</td>
                      <td className="p-3 text-right">{p.area_m2}</td>
                      <td className="p-3 text-right">
                        {p.rent_price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.rent_price) : '—'}
                      </td>
                      <td className="p-3 text-right">
                        {p.sale_price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.sale_price) : '—'}
                      </td>
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
