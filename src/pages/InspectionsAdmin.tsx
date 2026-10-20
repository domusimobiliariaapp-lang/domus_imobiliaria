import * as React from 'react'
import {
  Plus,
  Search,
  CheckCircle2,
  Printer,
  Calendar,
  Eye,
} from 'lucide-react'
import { usePropertyInspections, useProperties, useLeases, useCreateEntity, useUpdateEntity } from '@/hooks/useSupabase'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { DEFAULT_INSPECTION_PRESETS } from '@/lib/inspectionReport'
import type { PropertyInspection, InspectionItem, Property, InspectionType, InspectionStatus, InspectionItemCondition } from '@/types'

const STATUS_BADGES: Record<InspectionStatus, { label: string; className: string }> = {
  pendente: { label: 'Aguardando Inquilino', className: 'bg-amber-100 text-amber-800 border-amber-300' },
  aprovada: { label: 'Aprovada', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  contestada: { label: 'Com Ressalvas', className: 'bg-red-100 text-red-800 border-red-300' },
  finalizada: { label: 'Finalizada', className: 'bg-gray-100 text-gray-800 border-gray-300' },
}

const TYPE_LABELS: Record<InspectionType, string> = {
  entrada: 'Vistoria de Entrada',
  saida: 'Vistoria de Saída',
  periodica: 'Vistoria Periódica',
}

export function InspectionsAdmin() {
  const { data: inspections, refetch } = usePropertyInspections()
  const { data: properties } = useProperties()
  const { data: leases } = useLeases()
  const { addToast } = useToast()

  const { create: createInspection } = useCreateEntity('property_inspections')
  const { update: updateInspection } = useUpdateEntity('property_inspections')

  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<string>('todos')
  const [statusFilter, setStatusFilter] = React.useState<string>('todos')

  // Modais
  const [newModalOpen, setNewModalOpen] = React.useState(false)
  const [viewModalOpen, setViewModalOpen] = React.useState(false)

  const [selectedInspection, setSelectedInspection] = React.useState<PropertyInspection | null>(null)
  const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null)
  const [inspectionItems, setInspectionItems] = React.useState<InspectionItem[]>([])

  // Formulário de Nova Vistoria
  const [newFormData, setNewFormData] = React.useState<{
    property_id: string
    lease_id: string
    type: InspectionType
    inspection_date: string
    general_notes: string
  }>({
    property_id: '',
    lease_id: '',
    type: 'entrada',
    inspection_date: new Date().toISOString().split('T')[0],
    general_notes: '',
  })

  // Itens em preenchimento durante a nova vistoria
  const [checklistItems, setChecklistItems] = React.useState<
    Array<{ room: string; item_name: string; condition: InspectionItemCondition; notes: string; photoUrl: string }>
  >([])

  // Inicializa checklist padrão ao escolher imóvel
  React.useEffect(() => {
    if (newModalOpen && checklistItems.length === 0) {
      const initial: Array<{ room: string; item_name: string; condition: InspectionItemCondition; notes: string; photoUrl: string }> = []
      DEFAULT_INSPECTION_PRESETS.forEach((preset) => {
        preset.items.forEach((item) => {
          initial.push({
            room: preset.room,
            item_name: item,
            condition: 'bom',
            notes: '',
            photoUrl: '',
          })
        })
      })
      setChecklistItems(initial)
    }
  }, [newModalOpen, checklistItems.length])

  // Filtragem
  const filtered = (inspections || []).filter((insp) => {
    const prop = (properties || []).find((p) => p.id === insp.property_id)
    const matchesSearch =
      !search ||
      (prop?.title && prop.title.toLowerCase().includes(search.toLowerCase())) ||
      (prop?.address && prop.address.toLowerCase().includes(search.toLowerCase()))
    const matchesType = typeFilter === 'todos' || insp.type === typeFilter
    const matchesStatus = statusFilter === 'todos' || insp.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const handleOpenReport = async (insp: PropertyInspection) => {
    setSelectedInspection(insp)
    const prop = (properties || []).find((p) => p.id === insp.property_id) || null
    setSelectedProperty(prop)
    setViewModalOpen(true)

    const { data } = await supabase
      .from('inspection_items')
      .select('*')
      .eq('inspection_id', insp.id)
      .order('room', { ascending: true })

    setInspectionItems((data as InspectionItem[]) || [])
  }

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFormData.property_id) {
      addToast('Selecione o imóvel para a vistoria.', 'error')
      return
    }

    try {
      const { data: created, error } = await createInspection({
        property_id: newFormData.property_id,
        lease_id: newFormData.lease_id || null,
        type: newFormData.type,
        inspection_date: newFormData.inspection_date,
        general_notes: newFormData.general_notes || null,
        status: 'pendente',
      })

      if (error || !created) throw error || new Error('Falha ao criar vistoria')

      // Insere os itens de checklist preenchidos (se houver)
      const itemsPayload = checklistItems.map((item) => ({
        inspection_id: (created as any).id,
        room: item.room,
        item_name: item.item_name,
        condition: item.condition,
        notes: item.notes || null,
        photos: item.photoUrl ? [item.photoUrl] : [],
      }))

      if (itemsPayload.length > 0) {
        const { error: itemsError } = await supabase.from('inspection_items').insert(itemsPayload)
        if (itemsError) {
          console.error('Erro ao inserir itens da vistoria:', itemsError)
        }
      }

      addToast('Vistoria registrada com sucesso!', 'success')
      setNewModalOpen(false)
      setChecklistItems([])
      void refetch()
    } catch (err) {
      console.error('Erro ao salvar vistoria:', err)
      addToast('Erro ao salvar vistoria.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium tracking-tight text-primary">
            Vistorias Fotográficas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Checklist digital por cômodo, fotos de conservação e aprovação integrada com o portal.
          </p>
        </div>

        <Button
          onClick={() => setNewModalOpen(true)}
          className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nova Vistoria
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-md border shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou endereço do imóvel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Tipo de Vistoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
            <SelectItem value="periodica">Periódica</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="pendente">Aguardando Inquilino</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="contestada">Com Ressalvas</SelectItem>
            <SelectItem value="finalizada">Finalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Vistorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((insp) => {
          const prop = (properties || []).find((p) => p.id === insp.property_id)
          const badge = STATUS_BADGES[insp.status] || STATUS_BADGES.pendente

          return (
            <Card key={insp.id} className="p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="outline" className={`text-xs ${badge.className}`}>
                  {badge.label}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(insp.inspection_date).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <h3 className="font-semibold text-base text-primary truncate mb-1">
                {prop?.title || 'Imóvel'}
              </h3>
              <p className="text-xs text-muted-foreground truncate mb-3">
                📍 {prop?.address ? `${prop.address}, ${prop.neighborhood}` : 'Endereço não informado'}
              </p>

              <div className="text-xs bg-muted/40 p-2 rounded mb-3 flex items-center justify-between">
                <span className="font-medium text-foreground">{TYPE_LABELS[insp.type]}</span>
                {insp.tenant_comments && (
                  <span className="text-amber-700 font-medium">Possui manifestação</span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenReport(insp)}
                  className="gap-1.5 text-xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Visualizar Laudo
                </Button>
              </div>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm text-muted-foreground border rounded-lg bg-card/40">
            Nenhuma vistoria encontrada.
          </div>
        )}
      </div>

      {/* Modal: Visualizar Laudo de Vistoria */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Laudo de Vistoria — {selectedProperty?.title || 'Imóvel'}
            </DialogTitle>
            <DialogDescription>
              Relatório detalhado de conservação dos cômodos e fotos registradas.
            </DialogDescription>
          </DialogHeader>

          {selectedInspection && selectedProperty && (
            <div className="space-y-6 pt-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-3 rounded text-xs border">
                <div>
                  <span className="text-muted-foreground block">Tipo:</span>
                  <strong className="text-foreground">{TYPE_LABELS[selectedInspection.type]}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Data:</span>
                  <strong>{new Date(selectedInspection.inspection_date).toLocaleDateString('pt-BR')}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status:</span>
                  <span className="font-medium uppercase">{selectedInspection.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Itens Avaliados:</span>
                  <strong>{inspectionItems.length}</strong>
                </div>
              </div>

              {selectedInspection.tenant_comments && (
                <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <strong>Manifestação do Inquilino:</strong>
                  <p className="mt-1">{selectedInspection.tenant_comments}</p>
                </div>
              )}

              {/* Itens por cômodo */}
              <div className="space-y-4">
                <h4 className="font-serif font-semibold text-base border-b pb-1">Checklist de Cômodos</h4>
                {inspectionItems.map((item) => (
                  <div key={item.id} className="p-3 border rounded-md text-xs space-y-1.5 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">{item.room} — {item.item_name}</span>
                      <Badge
                        variant="outline"
                        className={
                          item.condition === 'com_avarias'
                            ? 'bg-red-100 text-red-700'
                            : item.condition === 'novo'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-muted'
                        }
                      >
                        {item.condition}
                      </Badge>
                    </div>

                    {item.notes && <p className="text-muted-foreground">Nota: {item.notes}</p>}

                    {item.photos && item.photos.length > 0 && (
                      <div className="flex gap-2 pt-1 overflow-x-auto">
                        {item.photos.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded overflow-hidden border">
                            <img src={url} alt="Foto da vistoria" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir Laudo
                </Button>

                {selectedInspection.status === 'pendente' && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={async () => {
                      await updateInspection(selectedInspection.id, { status: 'finalizada' })
                      addToast('Vistoria finalizada com sucesso!', 'success')
                      setViewModalOpen(false)
                      void refetch()
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Finalizar Vistoria
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Nova Vistoria */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Nova Vistoria de Imóvel</DialogTitle>
            <DialogDescription>
              Selecione o imóvel e preencha o estado de conservação de cada cômodo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveInspection} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Imóvel *</Label>
                <Select
                  value={newFormData.property_id}
                  onValueChange={(val) => setNewFormData({ ...newFormData, property_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o imóvel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(properties || []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title} ({p.neighborhood})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Contrato de Locação (Opcional)</Label>
                <Select
                  value={newFormData.lease_id || 'nenhum'}
                  onValueChange={(val) => setNewFormData({ ...newFormData, lease_id: val === 'nenhum' ? '' : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vincular a contrato..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Sem contrato vinculado</SelectItem>
                    {(leases || [])
                      .filter((l) => !newFormData.property_id || l.property_id === newFormData.property_id)
                      .map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          Contrato #{l.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo de Vistoria</Label>
                <Select
                  value={newFormData.type}
                  onValueChange={(val: any) => setNewFormData({ ...newFormData, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Vistoria de Entrada</SelectItem>
                    <SelectItem value="saida">Vistoria de Saída</SelectItem>
                    <SelectItem value="periodica">Periódica / Preventiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Data da Inspeção</Label>
                <Input
                  type="date"
                  value={newFormData.inspection_date}
                  onChange={(e) => setNewFormData({ ...newFormData, inspection_date: e.target.value })}
                />
              </div>
            </div>

            {/* Checklist Dinâmico */}
            <div className="space-y-3 pt-2">
              <Label className="font-semibold text-sm">Checklist por Cômodo ({checklistItems.length} itens)</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {checklistItems.map((item, index) => (
                  <div key={index} className="p-2.5 border rounded text-xs bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-primary">
                        {item.room} — {item.item_name}
                      </span>
                      <Select
                        value={item.condition}
                        onValueChange={(val: any) => {
                          const copy = [...checklistItems]
                          copy[index].condition = val
                          setChecklistItems(copy)
                        }}
                      >
                        <SelectTrigger className="h-6 w-28 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="bom">Bom</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="com_avarias">Com Avarias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Observações do estado..."
                        value={item.notes}
                        onChange={(e) => {
                          const copy = [...checklistItems]
                          copy[index].notes = e.target.value
                          setChecklistItems(copy)
                        }}
                        className="h-7 text-xs"
                      />
                      <Input
                        placeholder="URL da foto (R2)..."
                        value={item.photoUrl}
                        onChange={(e) => {
                          const copy = [...checklistItems]
                          copy[index].photoUrl = e.target.value
                          setChecklistItems(copy)
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setNewModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white">
                Salvar Vistoria
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
