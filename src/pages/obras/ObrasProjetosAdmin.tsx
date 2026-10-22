import { useState, useEffect } from 'react'
import {
  HardHat,
  Plus,
  Search,
  Calendar,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { obrasService, type ObraProjeto } from '@/modules/obras/services/obrasService'

const STATUS_MAP = {
  planejamento: { label: 'Planejamento', color: 'bg-blue-500/10 text-blue-700 border-blue-300' },
  em_andamento: { label: 'Em Andamento', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-300' },
  pausada: { label: 'Pausada', color: 'bg-amber-500/10 text-amber-700 border-amber-300' },
  concluida: { label: 'Concluída', color: 'bg-purple-500/10 text-purple-700 border-purple-300' },
  cancelada: { label: 'Cancelada', color: 'bg-rose-500/10 text-rose-700 border-rose-300' }
}

export function ObrasProjetosAdmin() {
  const { organization } = useAuth()
  const orgId = organization?.id

  const [obras, setObras] = useState<ObraProjeto[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Estado para cadastro de nova obra
  const [modalOpen, setModalOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [orcamento, setOrcamento] = useState('850000')
  const [cidade, setCidade] = useState('Campinas')
  const [uf] = useState('SP')

  useEffect(() => {
    async function load() {
      if (!orgId) return
      const data = await obrasService.getObras(orgId)
      setObras(data)
    }
    load()
  }, [orgId])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
  }

  const handleCreateObra = async () => {
    if (!orgId || !nome.trim()) return
    const novaObra: Partial<ObraProjeto> = {
      numero: `OBR-2026-${String(obras.length + 1).padStart(3, '0')}`,
      nome: nome.trim(),
      cliente_nome: clienteNome.trim() || 'Cliente Geral',
      orcamento: parseFloat(orcamento) || 0,
      valor_executado: 0,
      progresso: 0,
      status: 'em_andamento',
      cidade,
      uf,
      data_inicio_prevista: new Date().toISOString().split('T')[0]
    }
    const saved = await obrasService.saveObra(novaObra, orgId)
    setObras([saved, ...obras])
    setNome('')
    setClienteNome('')
    setModalOpen(false)
  }

  const filtered = obras.filter(o => {
    const matchesSearch = o.nome.toLowerCase().includes(search.toLowerCase()) ||
                          (o.cliente_nome || '').toLowerCase().includes(search.toLowerCase()) ||
                          o.numero.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalOrcado = obras.reduce((acc, o) => acc + (o.orcamento || 0), 0)
  const totalExecutado = obras.reduce((acc, o) => acc + (o.valor_executado || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <HardHat className="h-4 w-4" /> Módulo de Engenharia & Obras
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Canteiros de Obras & Empreendimentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o orçamento previsto vs executado e o progresso físico de cada contrato.
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Plus className="h-4 w-4 mr-2" /> Nova Obra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Obra</DialogTitle>
              <DialogDescription>
                Abra um novo canteiro de obras com controle físico e financeiro integrado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome do Empreendimento / Obra</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Residencial Quinta da Baroneza Lote 12"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cliente">Cliente Contratante</Label>
                <Input
                  id="cliente"
                  placeholder="Ex: Dr. Fernando Guimarães"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="orcamento">Orçamento Previsto (R$)</Label>
                  <Input
                    id="orcamento"
                    type="number"
                    value={orcamento}
                    onChange={(e) => setOrcamento(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateObra} className="bg-primary text-primary-foreground">Salvar Obra</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Métricas Gerais de Obras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Obras em Andamento</div>
            <div className="text-2xl font-black text-foreground">{obras.length} canteiros</div>
            <div className="text-xs text-muted-foreground mt-1">Isoladas pelo multi-tenant da sua empresa</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Orçamento Contratado</div>
            <div className="text-2xl font-black text-foreground">{formatCurrency(totalOrcado)}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Total previsto em carteira</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Total Executado / Medido</div>
            <div className="text-2xl font-black text-primary">{formatCurrency(totalExecutado)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalOrcado > 0 ? ((totalExecutado / totalOrcado) * 100).toFixed(1) : 0}% de execução financeira
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por obra, número ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status da Obra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="planejamento">Planejamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de Obras */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((obra) => {
          const statusConfig = STATUS_MAP[obra.status] || STATUS_MAP.em_andamento
          return (
            <Card key={obra.id} className="border-border/60 hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-muted-foreground">{obra.numero}</span>
                    <CardTitle className="text-lg font-bold text-foreground leading-snug mt-0.5">{obra.nome}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Cliente: <strong>{obra.cliente_nome}</strong></p>
                  </div>
                  <Badge variant="outline" className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 flex-1">
                {/* Barra de Progresso Físico */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-foreground">Progresso Físico</span>
                    <span className="text-primary font-bold">{obra.progresso}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${obra.progresso}%` }}
                    />
                  </div>
                </div>

                {/* Valores Orçamento vs Executado */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Orçamento</span>
                    <strong className="text-foreground">{formatCurrency(obra.orcamento)}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Executado</span>
                    <strong className="text-primary">{formatCurrency(obra.valor_executado)}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{obra.cidade} - {obra.uf}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Início: {obra.data_inicio_prevista ? new Date(obra.data_inicio_prevista).toLocaleDateString('pt-BR') : 'A definir'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
export default ObrasProjetosAdmin
