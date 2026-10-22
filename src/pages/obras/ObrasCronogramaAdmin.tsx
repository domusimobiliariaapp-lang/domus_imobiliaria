import { useState, useEffect } from 'react'
import {
  HardHat,
  Layers
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { obrasService, type ObraCronogramaEtapa, type ObraProjeto } from '@/modules/obras/services/obrasService'

export function ObrasCronogramaAdmin() {
  const { organization } = useAuth()
  const orgId = organization?.id

  const [obras, setObras] = useState<ObraProjeto[]>([])
  const [selectedObraId, setSelectedObraId] = useState<string>('')
  const [etapas, setEtapas] = useState<ObraCronogramaEtapa[]>([])

  useEffect(() => {
    async function load() {
      if (!orgId) return
      const obrasData = await obrasService.getObras(orgId)
      setObras(obrasData)
      const defaultObraId = obrasData[0]?.id || ''
      setSelectedObraId(defaultObraId)
      const etapasData = await obrasService.getCronograma(defaultObraId, orgId)
      setEtapas(etapasData)
    }
    load()
  }, [orgId])

  const handleSelectObra = async (obraId: string) => {
    setSelectedObraId(obraId)
    if (!orgId) return
    const etapasData = await obrasService.getCronograma(obraId, orgId)
    setEtapas(etapasData)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <HardHat className="h-4 w-4" /> Módulo de Engenharia & Obras
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Cronograma Físico-Financeiro
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o planejamento de etapas, peso percentual de cada fase e avanço físico das obras.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Label className="text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">Obra Selecionada:</Label>
          <Select value={selectedObraId} onValueChange={handleSelectObra}>
            <SelectTrigger className="w-full sm:w-[320px] font-semibold">
              <SelectValue placeholder="Selecione o canteiro de obra" />
            </SelectTrigger>
            <SelectContent>
              {obras.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.numero} - {o.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="p-4 bg-muted/40 border-b border-border/60 flex items-center justify-between">
          <span className="font-bold text-sm text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Etapas Construtivas Programadas
          </span>
          <span className="text-xs text-muted-foreground">
            Pesos somam 100% do contrato
          </span>
        </div>

        <div className="divide-y divide-border/40">
          {etapas.map((etapa) => (
            <div key={etapa.id} className="p-4 hover:bg-muted/10 transition-colors space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground text-sm">{etapa.etapa_nome}</span>
                  <Badge
                    variant="outline"
                    className={
                      etapa.status === 'concluida'
                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
                        : etapa.status === 'em_andamento'
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {etapa.status === 'concluida' ? 'Concluída' : etapa.status === 'em_andamento' ? 'Em Execução' : 'Não Iniciada'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Peso: <strong>{etapa.peso_percentual}%</strong></span>
                  <span>Período: {new Date(etapa.data_inicio).toLocaleDateString('pt-BR')} até {new Date(etapa.data_fim).toLocaleDateString('pt-BR')}</span>
                  <span className="font-bold text-foreground">{etapa.progresso}%</span>
                </div>
              </div>

              {/* Barra de Progresso da Etapa */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    etapa.status === 'concluida' ? 'bg-emerald-600' : 'bg-primary'
                  }`}
                  style={{ width: `${etapa.progresso}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default ObrasCronogramaAdmin
