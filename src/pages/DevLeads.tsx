import { useEffect, useState } from 'react'
import {
  Users,
  MessageCircle,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/integrations/supabase/client'
import type { SaasLead, LeadStatus } from '@/types'

export function DevLeads() {
  const { addToast } = useToast()
  const [leads, setLeads] = useState<SaasLead[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [search, setSearch] = useState('')

  // Modal para converter lead em imobiliária ativa
  const [convertingLead, setConvertingLead] = useState<SaasLead | null>(null)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [planId, setPlanId] = useState('pro')
  const [converting, setConverting] = useState(false)

  const loadLeads = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('saas_leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads((data as SaasLead[]) || [])
    } catch (err: any) {
      console.error('Erro ao carregar leads:', err)
      addToast('Aviso: Tabela de leads ainda não possui registros ou migração não foi rodada localmente.', 'info')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [])

  const updateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const { error } = await supabase
        .from('saas_leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId)

      if (error) throw error

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      )
      addToast('Status atualizado com sucesso.', 'success')
    } catch (err: any) {
      addToast(`Erro ao atualizar status: ${err.message}`, 'error')
    }
  }

  const deleteLead = async (leadId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este lead?')) return
    try {
      const { error } = await supabase.from('saas_leads').delete().eq('id', leadId)
      if (error) throw error
      setLeads((prev) => prev.filter((l) => l.id !== leadId))
      addToast('Lead removido com sucesso.', 'success')
    } catch (err: any) {
      addToast(`Erro ao remover lead: ${err.message}`, 'error')
    }
  }

  const openWhatsApp = (lead: SaasLead) => {
    const cleanPhone = lead.phone.replace(/\D/g, '')
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    const text = encodeURIComponent(
      `Olá ${lead.name}, tudo bem? Sou da equipe do Domus Imobiliária!\n\n` +
      `Vi seu interesse em testar o Domus por 3 dias para a *${lead.agency_name}* (subdomínio *${lead.subdomain}.domus.com.br*).\n\n` +
      `Você gostaria que eu libere o seu ambiente agora para você experimentar a emissão de boletos e gestão de imóveis?`
    )
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank')
    if (lead.status === 'novo') {
      updateStatus(lead.id, 'contatado')
    }
  }

  const openConvertModal = (lead: SaasLead) => {
    setConvertingLead(lead)
    setAdminName(lead.name)
    setAdminEmail(lead.email)
    setAdminPassword('')
    setOrgSlug(lead.subdomain)
    setPlanId(lead.plan_id || 'pro')
  }

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!convertingLead) return

    setConverting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        addToast('Sessão expirada. Entre novamente.', 'error')
        return
      }

      // Chama a edge function dev-create-organization com a service role
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dev-create-organization`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            name: convertingLead.agency_name,
            slug: orgSlug,
            admin_name: adminName,
            admin_email: adminEmail,
            admin_password: adminPassword,
            plan_id: planId,
            subscription_status: 'trial',
          }),
        }
      )

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detail = payload.error ?? `Erro ${response.status} ao criar imobiliária`
        addToast(detail, 'error')
        return
      }

      // Marca o lead como convertido
      await updateStatus(convertingLead.id, 'convertido')

      addToast(
        `Imobiliária criada com sucesso! Ambiente ativado para ${convertingLead.agency_name} no plano ${planId.toUpperCase()} com 3 dias de teste.`,
        'success'
      )

      setConvertingLead(null)
    } catch (err: any) {
      console.error(err)
      addToast(`Erro na conversão: ${err.message || 'Falha ao converter lead'}`, 'error')
    } finally {
      setConverting(false)
    }
  }

  // Filtragem
  const filteredLeads = leads.filter((l) => {
    const matchesStatus = filterStatus === 'todos' || l.status === filterStatus
    const term = search.toLowerCase()
    const matchesSearch =
      !term ||
      l.name.toLowerCase().includes(term) ||
      l.agency_name.toLowerCase().includes(term) ||
      l.email.toLowerCase().includes(term) ||
      l.subdomain.toLowerCase().includes(term)
    return matchesStatus && matchesSearch
  })

  const countNew = leads.filter((l) => l.status === 'novo').length
  const countConverted = leads.filter((l) => l.status === 'convertido').length

  return (
    <div className="space-y-6">
      {/* Topo / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
            Leads da Landing Page
          </h1>
          <p className="text-sm text-muted-foreground">
            Solicitações de teste grátis de 3 dias geradas pelos visitantes do site.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadLeads}
          disabled={loading}
          className="flex items-center gap-2 cursor-pointer w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Cadastros</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span>{leads.length}</span>
              <Users className="w-5 h-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Solicitações registradas na Landing Page
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aguardando Contato</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>{countNew}</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Leads novos para chamar no WhatsApp
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Imobiliárias Convertidas</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{countConverted}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {leads.length > 0
              ? `${Math.round((countConverted / leads.length) * 100)}% de taxa de conversão`
              : 'Nenhum lead ainda'}
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Buscar por nome, imobiliária ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filtrar por status"
              className="h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer w-full sm:w-auto"
            >
              <option value="todos">Todos os status</option>
              <option value="novo">Novos ({leads.filter((l) => l.status === 'novo').length})</option>
              <option value="contatado">Contatados ({leads.filter((l) => l.status === 'contatado').length})</option>
              <option value="convertido">Convertidos ({leads.filter((l) => l.status === 'convertido').length})</option>
              <option value="descartado">Descartados ({leads.filter((l) => l.status === 'descartado').length})</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fila de Atendimento</CardTitle>
          <CardDescription>
            Converse diretamente pelo WhatsApp ou crie o ambiente de teste com 1 clique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Carregando leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <Users className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-medium">Nenhum lead encontrado com os filtros atuais.</p>
              <p className="text-xs">
                Quando alguém solicitar teste na Landing Page, o registro aparecerá aqui instantaneamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b border-border bg-muted/40">
                  <tr>
                    <th className="py-3 px-4">Imobiliária & Contato</th>
                    <th className="py-3 px-4">Subdomínio Desejado</th>
                    <th className="py-3 px-4">Carteira / Plano</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLeads.map((lead) => {
                    const statusBadgeClass =
                      lead.status === 'novo'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                        : lead.status === 'convertido'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                        : lead.status === 'contatado'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200'
                        : 'bg-muted text-muted-foreground'

                    return (
                      <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-[#AD7B3B]" />
                            <span>{lead.agency_name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {lead.name} • {lead.email}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground mt-0.5">
                            {lead.phone}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs">
                          <span className="px-2 py-0.5 rounded bg-muted text-foreground">
                            {lead.subdomain}.domus.com.br
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-medium">{lead.portfolio_size} imóveis</div>
                          <Badge variant="outline" className="mt-1 text-[11px] uppercase">
                            {lead.plan_id}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                            aria-label={`Status do lead ${lead.agency_name}`}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer ${statusBadgeClass}`}
                          >
                            <option value="novo">Novo</option>
                            <option value="contatado">Contatado</option>
                            <option value="convertido">Convertido</option>
                            <option value="descartado">Descartado</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openWhatsApp(lead)}
                              className="h-8 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 flex items-center gap-1 cursor-pointer"
                              title="Abrir conversa no WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </Button>

                            {lead.status !== 'convertido' && (
                              <Button
                                size="sm"
                                onClick={() => openConvertModal(lead)}
                                className="h-8 px-2.5 text-xs bg-[#17323D] hover:bg-[#17323D]/90 text-white flex items-center gap-1 cursor-pointer"
                                title="Criar imobiliária no sistema"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Ativar</span>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteLead(lead.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 cursor-pointer"
                              title="Remover lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Conversão de Lead em Imobiliária */}
      <Dialog open={!!convertingLead} onOpenChange={(open) => (!open ? setConvertingLead(null) : undefined)}>
        <DialogContent className="max-w-md bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#AD7B3B]" />
              <span>Ativar Imobiliária a partir do Lead</span>
            </DialogTitle>
            <DialogDescription>
              Cria o ambiente completo no subdomínio com 3 dias de teste grátis pré-configurado.
            </DialogDescription>
          </DialogHeader>

          {convertingLead && (
            <form onSubmit={handleConvertLead} className="space-y-4 mt-2">
              <div className="p-3 rounded-lg bg-muted/60 text-xs space-y-1">
                <p><strong>Imobiliária:</strong> {convertingLead.agency_name}</p>
                <p><strong>Subdomínio:</strong> {orgSlug}.domus.com.br</p>
                <p><strong>Carteira informada:</strong> {convertingLead.portfolio_size} imóveis</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="conv-admin-name" className="text-xs">Nome do Administrador</Label>
                <Input
                  id="conv-admin-name"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="conv-admin-email" className="text-xs">E-mail de Acesso</Label>
                <Input
                  id="conv-admin-email"
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="conv-admin-pwd" className="text-xs">Senha Temporária Inicial</Label>
                <Input
                  id="conv-admin-pwd"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="conv-slug" className="text-xs">Subdomínio (slug)</Label>
                  <Input
                    id="conv-slug"
                    required
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="h-9 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="conv-plan" className="text-xs">Plano de Teste</Label>
                  <select
                    id="conv-plan"
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full h-9 px-2 text-xs rounded-lg border border-input bg-background"
                  >
                    <option value="starter">Starter (35 imóveis)</option>
                    <option value="pro">Profissional (150)</option>
                    <option value="enterprise">Enterprise (Ilimitado)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConvertingLead(null)}
                  disabled={converting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={converting}
                  className="bg-[#17323D] hover:bg-[#17323D]/90 text-white flex items-center gap-1.5"
                >
                  {converting ? (
                    'Criando...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar e Criar Acesso</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
