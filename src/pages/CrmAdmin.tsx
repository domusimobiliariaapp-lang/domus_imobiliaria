import * as React from 'react'
import {
  Plus,
  Search,
  MessageCircle,
  Sparkles,
  DollarSign,
  MapPin,
  Clock,
  Filter,
} from 'lucide-react'
import { useCrmLeads, useProperties, useCreateEntity, useUpdateEntity } from '@/hooks/useSupabase'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { findPropertiesForLead, type SmartMatchResult } from '@/lib/smartMatch'
import { formatBRL } from '@/lib/repasse'
import { onlyDigits } from '@/lib/inputMasks'
import type { CrmLead, CrmLeadStage, CrmInteraction } from '@/types'

const STAGES: { id: CrmLeadStage; label: string; color: string; badge: string }[] = [
  { id: 'novo', label: 'Novo Lead', color: 'border-t-blue-500 bg-blue-50/20', badge: 'bg-blue-100 text-blue-700' },
  { id: 'contato', label: 'Em Contato', color: 'border-t-amber-500 bg-amber-50/20', badge: 'bg-amber-100 text-amber-700' },
  { id: 'visita', label: 'Visita Agendada', color: 'border-t-purple-500 bg-purple-50/20', badge: 'bg-purple-100 text-purple-700' },
  { id: 'proposta', label: 'Proposta em Análise', color: 'border-t-indigo-500 bg-indigo-50/20', badge: 'bg-indigo-100 text-indigo-700' },
  { id: 'fechado', label: 'Fechado / Ganho', color: 'border-t-emerald-500 bg-emerald-50/20', badge: 'bg-emerald-100 text-emerald-700' },
  { id: 'perdido', label: 'Perdido', color: 'border-t-gray-400 bg-gray-50/20', badge: 'bg-gray-100 text-gray-700' },
]

export function CrmAdmin() {
  const { data: leads, refetch } = useCrmLeads()
  const { data: properties } = useProperties()
  const { addToast } = useToast()

  const { create: createLead } = useCreateEntity('crm_leads')
  const { update: updateLead } = useUpdateEntity('crm_leads')

  const [search, setSearch] = React.useState('')
  const [interestFilter, setInterestFilter] = React.useState<string>('todos')

  // Modais
  const [newLeadOpen, setNewLeadOpen] = React.useState(false)
  const [matchModalOpen, setMatchModalOpen] = React.useState(false)
  const [historyModalOpen, setHistoryModalOpen] = React.useState(false)

  const [selectedLead, setSelectedLead] = React.useState<CrmLead | null>(null)
  const [matchedProperties, setMatchedProperties] = React.useState<SmartMatchResult[]>([])

  // Formulário de Lead
  const [formData, setFormData] = React.useState<Partial<CrmLead>>({
    name: '',
    phone: '',
    email: '',
    interest_type: 'locacao',
    property_type: 'apartamento',
    max_budget: undefined,
    min_bedrooms: 2,
    preferred_neighborhoods: [],
    stage: 'novo',
    notes: '',
  })
  const [neighborhoodInput, setNeighborhoodInput] = React.useState('')

  // Histórico de Interações
  const [interactions, setInteractions] = React.useState<CrmInteraction[]>([])
  const [newNote, setNewNote] = React.useState('')
  const [newNoteType, setNewNoteType] = React.useState<'whatsapp' | 'ligacao' | 'visita' | 'email' | 'nota'>('whatsapp')

  // Filtragem de leads
  const filteredLeads = (leads || []).filter((lead) => {
    const matchesSearch =
      !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
      (lead.phone && lead.phone.includes(search))
    const matchesInterest = interestFilter === 'todos' || lead.interest_type === interestFilter
    return matchesSearch && matchesInterest
  })

  // Abertura do modal de Smart Match
  const handleOpenSmartMatch = (lead: CrmLead) => {
    setSelectedLead(lead)
    const matches = findPropertiesForLead(lead, properties || [], 40)
    setMatchedProperties(matches)
    setMatchModalOpen(true)
  }

  // Abertura do histórico de interações
  const handleOpenHistory = async (lead: CrmLead) => {
    setSelectedLead(lead)
    setHistoryModalOpen(true)
    const { data } = await supabase
      .from('crm_interactions')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
    setInteractions((data as CrmInteraction[]) || [])
  }

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead || !newNote.trim()) return

    const { error } = await supabase.from('crm_interactions').insert({
      lead_id: selectedLead.id,
      type: newNoteType,
      notes: newNote.trim(),
    })

    if (!error) {
      setNewNote('')
      const { data } = await supabase
        .from('crm_interactions')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: false })
      setInteractions((data as CrmInteraction[]) || [])
      addToast('Interação registrada!', 'success')
    }
  }

  // Mudar estágio do lead
  const handleStageChange = async (leadId: string, nextStage: CrmLeadStage) => {
    const { error } = await updateLead(leadId, { stage: nextStage })
    if (!error) {
      addToast('Estágio atualizado!', 'success')
      void refetch()
    }
  }

  // Enviar WhatsApp
  const handleSendWhatsApp = (lead: CrmLead, propertyTitle?: string) => {
    const digits = onlyDigits(lead.phone || '')
    if (!digits) {
      addToast('Telefone do lead não informado.', 'error')
      return
    }
    const phone = digits.startsWith('55') ? digits : `55${digits}`
    const text = propertyTitle
      ? `Olá ${lead.name}! Sou da Domus Imobiliária e selecionei uma ótima opção de imóvel que combina com o que você procura: ${propertyTitle}. Podemos conversar?`
      : `Olá ${lead.name}! Sou da Domus Imobiliária. Estou acompanhando seu interesse em imóveis e gostaria de apresentar algumas opções exclusivas.`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Salvar novo lead
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name?.trim()) {
      addToast('Nome do lead é obrigatório.', 'error')
      return
    }

    const { error } = await createLead({
      ...formData,
      preferred_neighborhoods: neighborhoodInput
        ? neighborhoodInput.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    })

    if (!error) {
      addToast('Lead cadastrado com sucesso!', 'success')
      setNewLeadOpen(false)
      setFormData({
        name: '',
        phone: '',
        email: '',
        interest_type: 'locacao',
        property_type: 'apartamento',
        max_budget: undefined,
        min_bedrooms: 2,
        stage: 'novo',
        notes: '',
      })
      setNeighborhoodInput('')
      void refetch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium tracking-tight text-primary">
            CRM & Radar de Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão do funil de atendimento e cruzamento inteligente de clientes com imóveis disponíveis.
          </p>
        </div>

        <Button
          onClick={() => setNewLeadOpen(true)}
          className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-md border shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={interestFilter} onValueChange={setInterestFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Finalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Interesses</SelectItem>
              <SelectItem value="locacao">Locação</SelectItem>
              <SelectItem value="venda">Compra / Venda</SelectItem>
              <SelectItem value="ambos">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground ml-auto font-medium">
          {filteredLeads.length} lead{filteredLeads.length === 1 ? '' : 's'} no pipeline
        </div>
      </div>

      {/* Funil Visual Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((col) => {
          const colLeads = filteredLeads.filter((l) => l.stage === col.id)
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-lg border bg-card/60 p-3 shadow-xs border-t-4 ${col.color} w-[280px] min-w-[280px] shrink-0`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground tracking-tight">
                  {col.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-muted text-muted-foreground">
                  {colLeads.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {colLeads.map((lead) => (
                  <Card key={lead.id} className="p-3 shadow-sm hover:shadow-md transition-shadow relative group bg-card">
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="font-semibold text-sm text-primary truncate" title={lead.name}>
                        {lead.name}
                      </span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${col.badge}`}>
                        {lead.interest_type}
                      </Badge>
                    </div>

                    {lead.max_budget && (
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Teto: {formatBRL(lead.max_budget)}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                      {lead.phone && <div className="truncate">📞 {lead.phone}</div>}
                      {lead.property_type && <div className="capitalize">🏠 {lead.property_type}</div>}
                    </div>

                    {/* Botões de Ação Rápida */}
                    <div className="flex items-center gap-1.5 pt-2 border-t mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        title="Falar no WhatsApp"
                        onClick={() => handleSendWhatsApp(lead)}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[#AD7B3B] hover:text-[#AD7B3B]/90 hover:bg-amber-50"
                        title="Radar de Imóveis Compatíveis"
                        onClick={() => handleOpenSmartMatch(lead)}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-muted-foreground hover:bg-muted"
                        title="Histórico de Atendimento"
                        onClick={() => handleOpenHistory(lead)}
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </Button>

                      {/* Seletor rápido de estágio */}
                      <div className="ml-auto">
                        <Select
                          value={lead.stage}
                          onValueChange={(val) => handleStageChange(lead.id, val as CrmLeadStage)}
                        >
                          <SelectTrigger className="h-7 text-[11px] px-1.5 w-[75px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="end">
                            {STAGES.map((s) => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}

                {colLeads.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground/60 border border-dashed rounded-md">
                    Nenhum lead
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: Radar de Cruzamento (Smart Match) */}
      <Dialog open={matchModalOpen} onOpenChange={setMatchModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-serif">
              <Sparkles className="h-5 w-5 text-[#AD7B3B]" />
              Radar Smart Match — {selectedLead?.name}
            </DialogTitle>
            <DialogDescription>
              Imóveis da carteira com maior índice de afinidade para as preferências deste cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {matchedProperties.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                Nenhum imóvel disponível atende aos critérios mínimos deste lead no momento.
              </div>
            ) : (
              matchedProperties.map(({ property, score, reasons }) => (
                <Card key={property.id} className="p-4 border shadow-xs hover:border-[#AD7B3B] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-semibold text-base text-primary">{property.title}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {property.neighborhood}, {property.city}
                      </p>
                    </div>

                    {/* Score Bar */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#AD7B3B]">{score}% Match</span>
                      </div>
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#AD7B3B] rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 bg-muted/30 rounded p-2 mb-3">
                    <div>
                      <span className="text-muted-foreground block">Aluguel:</span>
                      <strong className="text-foreground">{formatBRL(property.rent_price)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Venda:</span>
                      <strong className="text-foreground">{formatBRL(property.sale_price)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Quartos:</span>
                      <strong>{property.bedrooms || 0}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Área:</span>
                      <strong>{property.area_m2} m²</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {reasons.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px] font-normal">
                        ✓ {r}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1.5"
                      onClick={() => selectedLead && handleSendWhatsApp(selectedLead, property.title)}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Enviar Opção no WhatsApp
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Histórico de Interações */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif">Histórico — {selectedLead?.name}</DialogTitle>
            <DialogDescription>Anotações e registros de contato com o lead.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddInteraction} className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Select value={newNoteType} onValueChange={(v: any) => setNewNoteType(v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="ligacao">Ligação</SelectItem>
                  <SelectItem value="visita">Visita</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="nota">Nota</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Detalhes do contato..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" size="sm" className="bg-[#AD7B3B] text-white">
                Salvar
              </Button>
            </div>
          </form>

          <div className="space-y-2 mt-4 flex-1 overflow-y-auto pr-1">
            {interactions.map((it) => (
              <div key={it.id} className="p-2.5 rounded bg-muted/40 border text-xs space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-primary">
                    {it.type}
                  </span>
                  <span>{new Date(it.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-foreground">{it.notes}</p>
              </div>
            ))}
            {interactions.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Nenhuma interação registrada ainda.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Cadastro de Novo Lead */}
      <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Novo Lead</DialogTitle>
            <DialogDescription>Cadastre um novo contato interessado em locação ou compra.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveLead} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Carlos Eduardo"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>WhatsApp / Telefone</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 98888-7777"
                />
              </div>

              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Finalidade</Label>
                <Select
                  value={formData.interest_type}
                  onValueChange={(val: any) => setFormData({ ...formData, interest_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="venda">Compra</SelectItem>
                    <SelectItem value="ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Tipo de Imóvel</Label>
                <Select
                  value={formData.property_type || 'apartamento'}
                  onValueChange={(val: any) => setFormData({ ...formData, property_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="studio">Kitnet / Studio</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Orçamento Máximo (R$)</Label>
                <Input
                  type="number"
                  value={formData.max_budget || ''}
                  onChange={(e) => setFormData({ ...formData, max_budget: Number(e.target.value) || undefined })}
                  placeholder="Ex: 3500"
                />
              </div>

              <div className="space-y-1">
                <Label>Mínimo de Quartos</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.min_bedrooms || 1}
                  onChange={(e) => setFormData({ ...formData, min_bedrooms: Number(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Bairros Preferidos (separados por vírgula)</Label>
              <Input
                value={neighborhoodInput}
                onChange={(e) => setNeighborhoodInput(e.target.value)}
                placeholder="Ex: Pinheiros, Jardins, Moema"
              />
            </div>

            <div className="space-y-1">
              <Label>Anotações</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Preferências especiais, animais, garagem..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setNewLeadOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white">
                Salvar Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
