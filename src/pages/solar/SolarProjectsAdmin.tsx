import { useState } from 'react'
import { 
  Sun, 
  Zap, 
  Plus, 
  Search, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Wrench, 
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface SolarProjectKanbanItem {
  id: string
  clientName: string
  powerKwp: number
  city: string
  concessionaire: string
  status: 'DOCUMENTACAO' | 'HOMOLOGACAO' | 'INSTALACAO' | 'VISTORIA' | 'CONEXAO' | 'CONCLUIDO'
  estimatedCompletion: string
  technicianName?: string
}

const STAGES = [
  { id: 'DOCUMENTACAO', label: '1. Documentação', icon: FileCheck, color: 'border-blue-500/40 text-blue-500' },
  { id: 'HOMOLOGACAO', label: '2. Homologação', icon: AlertCircle, color: 'border-purple-500/40 text-purple-500' },
  { id: 'INSTALACAO', label: '3. Instalação', icon: Wrench, color: 'border-amber-500/40 text-amber-500' },
  { id: 'VISTORIA', label: '4. Vistoria', icon: Eye, color: 'border-indigo-500/40 text-indigo-500' },
  { id: 'CONEXAO', label: '5. Conexão à Rede', icon: Zap, color: 'border-emerald-500/40 text-emerald-500' },
]

export function SolarProjectsAdmin() {
  const [searchTerm, setSearchTerm] = useState('')

  // Mock inicial para visualização do fluxo kanban
  const [projects] = useState<SolarProjectKanbanItem[]>([
    {
      id: 'proj-1',
      clientName: 'Residencial Oliveira',
      powerKwp: 7.15,
      city: 'São Paulo - SP',
      concessionaire: 'Enel SP',
      status: 'DOCUMENTACAO',
      estimatedCompletion: '15/11/2026',
      technicianName: 'Carlos Engenharia'
    },
    {
      id: 'proj-2',
      clientName: 'Supermercado Progresso',
      powerKwp: 32.50,
      city: 'Campinas - SP',
      concessionaire: 'CPFL Paulista',
      status: 'HOMOLOGACAO',
      estimatedCompletion: '28/11/2026',
      technicianName: 'Eng. Roberto'
    },
    {
      id: 'proj-3',
      clientName: 'Chácara Solar Boa Vista',
      powerKwp: 12.80,
      city: 'Sorocaba - SP',
      concessionaire: 'CPFL Piratininga',
      status: 'INSTALACAO',
      estimatedCompletion: '05/11/2026',
      technicianName: 'Equipe Alfa'
    },
  ])

  const filteredProjects = projects.filter((p) =>
    p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container-domus py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
              <Sun className="w-3.5 h-3.5 mr-1" /> Módulo Solar
            </Badge>
            <span className="text-xs text-muted-foreground">Esteira de Homologação</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mt-1">
            Projetos & Usinas em Campo
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o funil de engenharia desde a entrada dos documentos até a troca do medidor bidirecional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button className="bg-[#17323D] hover:bg-[#17323D]/90 text-white gap-2">
            <Plus className="w-4 h-4" />
            Novo Projeto Solar
          </Button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou cidade..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Kanban de Etapas do Setor Solar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const StageIcon = stage.icon
          const stageProjects = filteredProjects.filter((p) => p.status === stage.id)

          return (
            <div key={stage.id} className="flex flex-col rounded-xl bg-muted/30 border p-3 min-w-[240px]">
              {/* Topo da Coluna */}
              <div className="flex items-center justify-between pb-3 border-b mb-3">
                <div className="flex items-center gap-2">
                  <StageIcon className={`w-4 h-4 ${stage.color}`} />
                  <span className="text-xs font-semibold text-foreground truncate">{stage.label}</span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs px-1.5 py-0">
                  {stageProjects.length}
                </Badge>
              </div>

              {/* Cards do Kanban */}
              <div className="space-y-3 flex-1 min-h-[300px]">
                {stageProjects.length === 0 ? (
                  <div className="h-28 flex items-center justify-center border border-dashed rounded-lg text-xs text-muted-foreground/60">
                    Nenhum projeto
                  </div>
                ) : (
                  stageProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer bg-card">
                      <CardContent className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-xs text-foreground line-clamp-1">
                            {project.clientName}
                          </h4>
                          <span className="text-[11px] font-mono font-bold text-amber-500 whitespace-nowrap">
                            {project.powerKwp} kWp
                          </span>
                        </div>

                        <div className="text-[11px] text-muted-foreground space-y-1">
                          <p className="truncate">📍 {project.city}</p>
                          <p className="truncate">⚡ {project.concessionaire}</p>
                        </div>

                        <div className="pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {project.estimatedCompletion}
                          </span>
                          {project.technicianName && (
                            <span className="truncate max-w-[90px] font-medium text-foreground/80">
                              {project.technicianName}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default SolarProjectsAdmin
