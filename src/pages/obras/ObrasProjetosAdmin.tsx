import { useState } from 'react'
import { 
  HardHat, 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ObraItem {
  id: string
  numero: string
  nome: string
  cliente: string
  localizacao: string
  status: 'planejamento' | 'em_andamento' | 'pausada' | 'concluida'
  orcamento: number
  valorExecutado: number
  progresso: number
  previsaoTermino: string
  engenheiroResponsavel: string
}

export function ObrasProjetosAdmin() {
  const [searchTerm, setSearchTerm] = useState('')

  const [obras] = useState<ObraItem[]>([
    {
      id: 'obra-1',
      numero: 'OBR-2026-001',
      nome: 'Residencial Alphaville Lote 14',
      cliente: 'Eduardo Martins',
      localizacao: 'Barueri - SP',
      status: 'em_andamento',
      orcamento: 1450000,
      valorExecutado: 620000,
      progresso: 43,
      previsaoTermino: '15/12/2026',
      engenheiroResponsavel: 'Eng. Lucas Ferraz'
    },
    {
      id: 'obra-2',
      numero: 'OBR-2026-002',
      nome: 'Edifício Comercial Corporate Tower',
      cliente: 'Holding Sul Participações',
      localizacao: 'São Paulo - SP',
      status: 'em_andamento',
      orcamento: 8900000,
      valorExecutado: 2450000,
      progresso: 28,
      previsaoTermino: '30/08/2027',
      engenheiroResponsavel: 'Engª. Marcela Silva'
    },
    {
      id: 'obra-3',
      numero: 'OBR-2026-003',
      nome: 'Galpão Logístico Rodoanel km 22',
      cliente: 'Translog Logística S/A',
      localizacao: 'Osasco - SP',
      status: 'planejamento',
      orcamento: 3200000,
      valorExecutado: 0,
      progresso: 5,
      previsaoTermino: '20/04/2027',
      engenheiroResponsavel: 'Eng. Roberto Dias'
    },
  ])

  const filteredObras = obras.filter(
    (o) =>
      o.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.numero.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: ObraItem['status']) => {
    switch (status) {
      case 'em_andamento':
        return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Em Andamento</Badge>
      case 'planejamento':
        return <Badge variant="secondary">Planejamento</Badge>
      case 'pausada':
        return <Badge variant="destructive">Pausada</Badge>
      case 'concluida':
        return <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30">Concluída</Badge>
    }
  }

  return (
    <div className="container-domus py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-600/10 text-amber-600 border-amber-600/30">
              <HardHat className="w-3.5 h-3.5 mr-1" /> Módulo Engenharia & Obras
            </Badge>
            <span className="text-xs text-muted-foreground">Gestão de Construção</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mt-1">
            Obras & Empreendimentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle orçamentos, avanço físico-financeiro, diários de obra e medições de construção civil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button className="bg-[#17323D] hover:bg-[#17323D]/90 text-white gap-2">
            <Plus className="w-4 h-4" />
            Cadastrar Nova Obra
          </Button>
        </div>
      </div>

      {/* Indicadores Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Obras em Andamento</span>
              <span className="text-xl font-bold font-mono">2 obras ativas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Total Orçado</span>
              <span className="text-xl font-bold font-mono text-emerald-600">R$ 13.550.000</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Valor Executado</span>
              <span className="text-xl font-bold font-mono text-foreground">R$ 3.070.000</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por obra, número ou cliente..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Obras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredObras.map((obra) => (
          <Card key={obra.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono text-muted-foreground">{obra.numero}</span>
                {getStatusBadge(obra.status)}
              </div>
              <CardTitle className="text-base font-semibold leading-snug line-clamp-1 mt-1">
                {obra.nome}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{obra.localizacao}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>Avanço Físico</span>
                  <span className="font-semibold text-foreground">{obra.progresso}%</span>
                </div>
                {/* Barra de Progresso Customizada */}
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#AD7B3B] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${obra.progresso}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Orçamento Total</span>
                  <span className="font-semibold text-foreground">
                    R$ {obra.orcamento.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Executado</span>
                  <span className="font-semibold text-emerald-600">
                    R$ {obra.valorExecutado.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {obra.previsaoTermino}
                </span>
                <span className="font-medium text-foreground">{obra.engenheiroResponsavel}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
export default ObrasProjetosAdmin
