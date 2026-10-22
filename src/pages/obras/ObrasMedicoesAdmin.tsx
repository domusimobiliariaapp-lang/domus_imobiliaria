import { useState, useEffect } from 'react'
import {
  HardHat
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { obrasService, type ObraMedicao, type ObraProjeto } from '@/modules/obras/services/obrasService'

const STATUS_MEDICAO = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-500/10 text-slate-700 border-slate-300' },
  enviada: { label: 'Em Análise pelo Cliente', color: 'bg-amber-500/10 text-amber-700 border-amber-300' },
  aprovada: { label: 'Aprovada para Faturamento', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-300' },
  faturada: { label: 'Faturada', color: 'bg-primary/10 text-primary border-primary/30' },
  cancelada: { label: 'Cancelada', color: 'bg-rose-500/10 text-rose-700 border-rose-300' }
}

export function ObrasMedicoesAdmin() {
  const { organization } = useAuth()
  const orgId = organization?.id

  const [obras, setObras] = useState<ObraProjeto[]>([])
  const [selectedObraId, setSelectedObraId] = useState<string>('')
  const [medicoes, setMedicoes] = useState<ObraMedicao[]>([])

  useEffect(() => {
    async function load() {
      if (!orgId) return
      const obrasData = await obrasService.getObras(orgId)
      setObras(obrasData)
      const defaultObraId = obrasData[0]?.id || ''
      setSelectedObraId(defaultObraId)
      const medData = await obrasService.getMedicoes(defaultObraId, orgId)
      setMedicoes(medData)
    }
    load()
  }, [orgId])

  const handleSelectObra = async (obraId: string) => {
    setSelectedObraId(obraId)
    if (!orgId) return
    const medData = await obrasService.getMedicoes(obraId, orgId)
    setMedicoes(medData)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <HardHat className="h-4 w-4" /> Módulo de Engenharia & Obras
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Boletins de Medição de Obras
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe as medições físicas acumuladas por etapa de serviço e liberação financeira.
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
        <div className="text-xs text-muted-foreground">
          <strong>{medicoes.length}</strong> boletins emitidos para este contrato
        </div>
      </div>

      <div className="space-y-5">
        {medicoes.map((med) => {
          const statusConfig = STATUS_MEDICAO[med.status] || STATUS_MEDICAO.rascunho
          return (
            <Card key={med.id} className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40 py-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground text-lg">{med.numero}</span>
                    <Badge variant="outline" className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Valor Medido no Período</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(med.valor_total)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Período apurado: {new Date(med.periodo_inicio).toLocaleDateString('pt-BR')} até {new Date(med.periodo_fim).toLocaleDateString('pt-BR')}
                </p>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {med.observacoes && (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded-lg border border-border/40">
                    "{med.observacoes}"
                  </p>
                )}

                {med.itens && med.itens.length > 0 && (
                  <div className="border border-border/50 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 border-b border-border/50 font-semibold text-muted-foreground uppercase">
                        <tr>
                          <th className="p-2.5">Etapa / Serviço</th>
                          <th className="p-2.5">Unidade</th>
                          <th className="p-2.5">Qtd Prevista</th>
                          <th className="p-2.5">Qtd Medida</th>
                          <th className="p-2.5">Avanço %</th>
                          <th className="p-2.5 text-right">Valor Acumulado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {med.itens.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/20">
                            <td className="p-2.5 font-semibold text-foreground">{item.etapa}</td>
                            <td className="p-2.5 text-muted-foreground">{item.unidade}</td>
                            <td className="p-2.5">{item.quantidade_prevista}</td>
                            <td className="p-2.5 font-bold text-foreground">{item.quantidade_medida}</td>
                            <td className="p-2.5 text-primary font-bold">{item.percentual_acumulado}%</td>
                            <td className="p-2.5 text-right font-bold text-foreground">{formatCurrency(item.valor_acumulado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
export default ObrasMedicoesAdmin
