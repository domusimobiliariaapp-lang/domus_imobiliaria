import { useState, useEffect } from 'react'
import {
  Sun,
  Kanban,
  List,
  Search,
  Calendar,
  Building,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { solarService, type SolarProject } from '@/modules/solar/services/solarService'

const STAGES = [
  { key: 'DOCUMENTACAO', label: '1. Documentação & ART', color: 'bg-slate-500/10 text-slate-700 border-slate-300' },
  { key: 'HOMOLOGACAO', label: '2. Homologação Concessionária', color: 'bg-amber-500/10 text-amber-700 border-amber-300' },
  { key: 'INSTALACAO', label: '3. Instalação & Montagem', color: 'bg-blue-500/10 text-blue-700 border-blue-300' },
  { key: 'VISTORIA', label: '4. Pedido de Vistoria', color: 'bg-purple-500/10 text-purple-700 border-purple-300' },
  { key: 'CONEXAO', label: '5. Troca do Medidor', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-300' },
  { key: 'CONCLUIDO', label: '6. Usina Conectada', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-300' },
]

export function SolarProjectsAdmin() {
  const { organization } = useAuth()
  const orgId = organization?.id

  const [projects, setProjects] = useState<SolarProject[]>([])
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      if (!orgId) return
      const data = await solarService.getProjects(orgId)
      setProjects(data)
    }
    load()
  }, [orgId])

  const handleAdvanceStatus = async (projectId: string, currentStatus: SolarProject['status']) => {
    if (!orgId) return
    const currentIndex = STAGES.findIndex(s => s.key === currentStatus)
    if (currentIndex >= 0 && currentIndex < STAGES.length - 1) {
      const nextStatus = STAGES[currentIndex + 1].key as SolarProject['status']
      await solarService.updateProjectStatus(projectId, nextStatus, orgId)
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: nextStatus } : p))
    }
  }

  const filtered = projects.filter(p =>
    (p.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.concessionaire || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Sun className="h-4 w-4" /> Módulo de Energia Solar
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Esteira de Projetos & Usinas Solares
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o fluxo de homologação junto às concessionárias até a conexão à rede.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-muted p-1 rounded-lg flex items-center gap-1 border border-border/50">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="text-xs font-semibold"
            >
              <Kanban className="h-3.5 w-3.5 mr-1.5" /> Esteira Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="text-xs font-semibold"
            >
              <List className="h-3.5 w-3.5 mr-1.5" /> Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou concessionária..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Total de Usinas em Andamento: <strong>{projects.length}</strong></span>
          <span>•</span>
          <span>Potência Total Gerada: <strong>{projects.reduce((acc, p) => acc + (p.power_kwp || 0), 0).toFixed(1)} kWp</strong></span>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Modo Kanban */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageProjects = filtered.filter(p => p.status === stage.key)
            return (
              <div key={stage.key} className="flex flex-col bg-muted/30 p-3 rounded-xl border border-border/50 min-w-[240px]">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
                  <span className="text-xs font-bold text-foreground truncate">{stage.label}</span>
                  <Badge variant="secondary" className="text-xs font-bold px-1.5 py-0.5">
                    {stageProjects.length}
                  </Badge>
                </div>

                <div className="space-y-3 flex-1">
                  {stageProjects.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground/60 border border-dashed border-border/40 rounded-lg">
                      Nenhuma usina nesta etapa
                    </div>
                  ) : (
                    stageProjects.map((p) => (
                      <Card key={p.id} className="shadow-xs border-border/60 hover:border-amber-500/40 transition-all bg-card">
                        <CardContent className="p-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-sm text-foreground leading-tight">{p.client_name}</span>
                            <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[11px] shrink-0 font-bold">
                              {p.power_kwp} kWp
                            </Badge>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" /> Concessionária: {p.concessionaire || 'Enel SP'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Previsão: {p.estimated_end_date ? new Date(p.estimated_end_date).toLocaleDateString('pt-BR') : 'A definir'}
                            </div>
                          </div>

                          {p.notes && (
                            <p className="text-[11px] text-muted-foreground bg-muted/40 p-1.5 rounded text-left">
                              {p.notes}
                            </p>
                          )}

                          {stage.key !== 'CONCLUIDO' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdvanceStatus(p.id, p.status)}
                              className="w-full text-xs h-7 border-border/60 hover:bg-amber-500/10 hover:text-amber-600"
                            >
                              Avançar Etapa <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Modo Lista */
        <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border/60 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="p-3.5">Cliente / Usina</th>
                <th className="p-3.5">Potência</th>
                <th className="p-3.5">Concessionária</th>
                <th className="p-3.5">Etapa Atual</th>
                <th className="p-3.5">Prazo Previsto</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((p) => {
                const currentStage = STAGES.find(s => s.key === p.status)
                return (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="p-3.5 font-bold text-foreground">{p.client_name}</td>
                    <td className="p-3.5 text-amber-600 font-bold">{p.power_kwp} kWp</td>
                    <td className="p-3.5 text-muted-foreground">{p.concessionaire || 'CPFL Paulista'}</td>
                    <td className="p-3.5">
                      <Badge variant="outline" className={currentStage?.color}>
                        {currentStage?.label}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-muted-foreground text-xs">
                      {p.estimated_end_date ? new Date(p.estimated_end_date).toLocaleDateString('pt-BR') : 'A definir'}
                    </td>
                    <td className="p-3.5 text-right">
                      {p.status !== 'CONCLUIDO' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAdvanceStatus(p.id, p.status)}
                          className="text-xs text-amber-600 hover:text-amber-700"
                        >
                          Avançar Etapa →
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
export default SolarProjectsAdmin
