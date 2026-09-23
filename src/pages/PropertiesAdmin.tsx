import { CRUDPage } from '@/components/CRUDPage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Home, AlertCircle, Share2, Edit2, Trash2, Printer } from 'lucide-react'
import { useProperties, useCreateEntity, useUpdateEntity, useDeleteEntity } from '@/hooks/useSupabase'
import type { Property } from '@/types'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { ImageGalleryUploader } from '@/components/ImageGalleryUploader'
import * as React from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useState } from 'react'

type PropertyType = Property['type']
type PropertyStatus = Property['status']

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'sala', label: 'Sala' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'loja', label: 'Loja' },
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
  { value: 'ambos', label: 'Ambos' },
]

// CEP mask: 00000-000
const formatCep = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 8)
  if (numbers.length <= 5) return numbers
  return numbers.slice(0, 5) + '-' + numbers.slice(5)
}

export function PropertiesAdmin() {
  const { error, refetch } = useProperties()
  const { create } = useCreateEntity('properties')
  const { update } = useUpdateEntity('properties')
  const { remove } = useDeleteEntity('properties')
  const [tab, setTab] = useState('lista')

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
    const { data: result, error } = await create({
      ...data,
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
    if (error) throw error
    return result
  }

  const handleUpdate = async (id: string, data: Partial<Property>) => {
    const { data: result, error } = await update(id, data)
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
    item: Property | null
    formData: Partial<Property>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Property>>>
    onSubmit: (e: React.FormEvent) => void
    isEditing: boolean
  }) => {
    const formTitle = isEditing && item ? `Editar ${item.title}` : 'Novo Imóvel'

    const handleCepChange = async (cep: string) => {
      const numbers = cep.replace(/\D/g, '')
      if (numbers.length !== 8) {
        setFormData({ ...formData, zip_code: cep })
        return
      }
      try {
        const res = await fetch(`https://viacep.com.br/ws/${numbers}/json/`)
        const data = await res.json()
        if (data.erro) {
          setFormData({ ...formData, zip_code: cep })
          return
        }
        setFormData({
          ...formData,
          zip_code: cep,
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf?.toUpperCase() || '',
        })
      } catch {
        setFormData({ ...formData, zip_code: cep })
      }
    }

    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">{formTitle}</h3>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Identificação */}
            <div className="space-y-1 sm:col-span-2">
              <Label>Título / Referência</Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Casa 3 quartos no centro"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Tipo de Imóvel</Label>
              <Select
                value={formData.type || 'apartamento'}
                onValueChange={(v) => setFormData({ ...formData, type: v as PropertyType })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={formData.status || 'disponivel'}
                onValueChange={(v) => setFormData({ ...formData, status: v as PropertyStatus })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Localização */}
            <div className="space-y-1 sm:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Número</Label>
              <Input
                value={formData.address_number || ''}
                onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                placeholder="Nº"
              />
            </div>

            <div className="space-y-1">
              <Label>Complemento</Label>
              <Input
                value={formData.address_complement || ''}
                onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                placeholder="Apto, Bloco, etc."
              />
            </div>

            <div className="space-y-1">
              <Label>Bairro</Label>
              <Input
                value={formData.neighborhood || ''}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="Bairro"
              />
            </div>

            <div className="space-y-1">
              <Label>Cidade</Label>
              <Input
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Cidade"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Estado</Label>
              <Input
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="UF"
                maxLength={2}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>CEP</Label>
              <Input
                value={formData.zip_code || ''}
                onChange={(e) => handleCepChange(formatCep(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            {/* Características */}
            <div className="space-y-1 sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada do imóvel"
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <Label>Área (m²)</Label>
              <Input
                type="number"
                value={formData.area_m2 || ''}
                onChange={(e) => setFormData({ ...formData, area_m2: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                min={0}
                step={0.01}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Quartos</Label>
              <Input
                type="number"
                value={formData.bedrooms || ''}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min={0}
              />
            </div>

            <div className="space-y-1">
              <Label>Banheiros</Label>
              <Input
                type="number"
                value={formData.bathrooms || ''}
                onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min={0}
              />
            </div>

            <div className="space-y-1">
              <Label>Vagas de Garagem</Label>
              <Input
                type="number"
                value={formData.parking || ''}
                onChange={(e) => setFormData({ ...formData, parking: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min={0}
              />
            </div>

            {/* Valores de locação/venda */}
            <div className="space-y-1 sm:col-span-2">
              <Label>Valores</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Preço Aluguel (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.rent_price || ''}
                    onChange={(e) => setFormData({ ...formData, rent_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Preço Venda (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sale_price || ''}
                    onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Taxas e encargos */}
            <div className="space-y-1 sm:col-span-2">
              <Label>Taxas e Encargos Mensais (R$)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">IPTU</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.iptu ?? ''}
                    onChange={(e) => setFormData({ ...formData, iptu: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Condomínio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.condo_fee ?? ''}
                    onChange={(e) => setFormData({ ...formData, condo_fee: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Gás</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.gas_fee ?? ''}
                    onChange={(e) => setFormData({ ...formData, gas_fee: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Água</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.water_fee ?? ''}
                    onChange={(e) => setFormData({ ...formData, water_fee: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Energia</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.electricity_fee ?? ''}
                    onChange={(e) => setFormData({ ...formData, electricity_fee: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Outras Taxas</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.other_fees ?? ''}
                    onChange={(e) => setFormData({ ...formData, other_fees: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Upload de Imagens e Videos */}
            <div className="space-y-1 sm:col-span-2">
              <ImageGalleryUploader
                existingImages={item?.images || []}
                onImagesChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                onVideosChange={(urls) => setFormData(prev => ({ ...prev, videos: urls }))}
                maxImages={10}
                maxVideos={2}
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
          <p className="font-medium">Erro ao carregar imóveis</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  const { addToast } = useToast()

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
        <CRUDPage<Property>
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
          filters={{
            status: FILTER_STATUS,
            type: FILTER_TYPE,
            category: FILTER_PURPOSE,
          }}
          renderForm={renderForm}
          formSize="2xl"
          emptyStateIcon={
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
          }
          emptyStateMessage="Nenhum imóvel cadastrado"
          renderActions={(item: Property, handlers) => (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlers.edit(item)}
                className="text-muted-foreground hover:text-primary transition-transform hover:scale-110 active:scale-95"
                title="Editar"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlers.delete(item)}
                className="text-muted-foreground hover:text-destructive transition-transform hover:scale-110 active:scale-95"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  const shareUrl = `${window.location.origin}/portal/properties/${item.id}`
                  try {
                    await navigator.clipboard.writeText(shareUrl)
                    addToast('Link copiado com sucesso!', 'success')
                  } catch {
                    window.open(shareUrl, '_blank')
                  }
                }}
                title="Compartilhar"
                className="text-muted-foreground hover:text-primary transition-transform hover:scale-110 active:scale-95"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      ) : (
        <PropertiesReportView />
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
      <Card className="print:hidden">
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Buscar</Label>
              <Input placeholder="Título, endereço, cidade..." value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {PROPERTY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
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
