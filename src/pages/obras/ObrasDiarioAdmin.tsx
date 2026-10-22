import { useState, useEffect } from 'react'
import {
  HardHat,
  Calendar,
  Users,
  Image as ImageIcon,
  AlertTriangle,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { obrasService, type ObraDiario, type ObraProjeto } from '@/modules/obras/services/obrasService'

export function ObrasDiarioAdmin() {
  const { organization } = useAuth()
  const orgId = organization?.id

  const [obras, setObras] = useState<ObraProjeto[]>([])
  const [selectedObraId, setSelectedObraId] = useState<string>('')
  const [diarios, setDiarios] = useState<ObraDiario[]>([])

  // Novo RDO Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [dataRdo, setDataRdo] = useState(new Date().toISOString().split('T')[0])
  const [clima, setClima] = useState('Ensolarado')
  const [temperatura, setTemperatura] = useState('27')
  const [atividades, setAtividades] = useState('')
  const [ocorrencias, setOcorrencias] = useState('')

  useEffect(() => {
    async function load() {
      if (!orgId) return
      const obrasData = await obrasService.getObras(orgId)
      setObras(obrasData)
      const defaultObraId = obrasData[0]?.id || ''
      setSelectedObraId(defaultObraId)
      const rdoData = await obrasService.getDiarios(defaultObraId, orgId)
      setDiarios(rdoData)
    }
    load()
  }, [orgId])

  const handleSelectObra = async (obraId: string) => {
    setSelectedObraId(obraId)
    if (!orgId) return
    const rdoData = await obrasService.getDiarios(obraId, orgId)
    setDiarios(rdoData)
  }

  const handleSaveRdo = async () => {
    if (!orgId || !selectedObraId || !atividades.trim()) return
    const currentObra = obras.find(o => o.id === selectedObraId)
    const novoRdo: Partial<ObraDiario> = {
      obra_id: selectedObraId,
      obra_nome: currentObra?.nome || 'Obra Ativa',
      data: dataRdo,
      clima,
      temperatura: parseFloat(temperatura) || 25,
      atividades: atividades.trim(),
      ocorrencias: ocorrencias.trim() || undefined,
      efetivo: [
        { funcao: 'Engenheiro Residente', quantidade: 1 },
        { funcao: 'Mestre de Obras', quantidade: 1 },
        { funcao: 'Pedreiros', quantidade: 4 },
        { funcao: 'Serventes de Obra', quantidade: 6 }
      ]
    }
    const saved = await obrasService.saveDiario(novoRdo, orgId)
    setDiarios([saved, ...diarios])
    setAtividades('')
    setOcorrencias('')
    setModalOpen(false)
  }

  const selectedObra = obras.find(o => o.id === selectedObraId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <HardHat className="h-4 w-4" /> Módulo de Engenharia & Obras
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Diário de Obra Digital (RDO)
          </h1>
          <p className="text-sm text-muted-foreground">
            Registro diário de efetivo, clima, avanços físicos e fotos comprobatórias do canteiro.
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Plus className="h-4 w-4 mr-2" /> Novo RDO do Dia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Preencher Diário de Obra (RDO)</DialogTitle>
              <DialogDescription>
                Registre o progresso diário da equipe técnica e condições de trabalho.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Data do RDO</Label>
                  <Input type="date" value={dataRdo} onChange={(e) => setDataRdo(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Condições do Clima</Label>
                  <Select value={clima} onValueChange={setClima}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ensolarado">Ensolarado (Praticável)</SelectItem>
                      <SelectItem value="Nublado">Nublado (Praticável)</SelectItem>
                      <SelectItem value="Chuvoso">Chuvoso (Parcial)</SelectItem>
                      <SelectItem value="Impraticável">Chuva Forte (Impraticável)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Temperatura (°C)</Label>
                  <Input type="number" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Atividades Executadas no Dia *</Label>
                <Textarea
                  rows={4}
                  placeholder="Ex: Execução da concretagem dos pilares do térreo; montagem de fôrmas da viga V-102; passagem de eletrodutos..."
                  value={atividades}
                  onChange={(e) => setAtividades(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Ocorrências / Acidentes / Paralisações</Label>
                <Input
                  placeholder="Ex: Sem intercorrências / Entrega de brita com atraso de 1 hora"
                  value={ocorrencias}
                  onChange={(e) => setOcorrencias(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveRdo} className="bg-primary text-primary-foreground">Gravar RDO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seletor de Obra Ativa */}
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
          {selectedObra ? `${selectedObra.cidade} - ${selectedObra.uf} • Progresso: ${selectedObra.progresso}%` : ''}
        </div>
      </div>

      {/* Linha do Tempo dos Diários de Obra */}
      <div className="space-y-5">
        {diarios.map((rdo) => (
          <Card key={rdo.id} className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 py-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-bold text-foreground text-base">
                    RDO do dia {new Date(rdo.data).toLocaleDateString('pt-BR')}
                  </span>
                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs font-semibold">
                    {rdo.clima} • {rdo.temperatura}°C
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {rdo.obra_nome}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Efetivo de Mão de Obra */}
              <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-2">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Efetivo Presente no Canteiro ({rdo.efetivo.reduce((acc, e) => acc + e.quantidade, 0)} profissionais)
                </div>
                <div className="flex flex-wrap gap-2">
                  {rdo.efetivo.map((ef, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs font-medium py-1 px-2.5">
                      <strong>{ef.quantidade}x</strong> {ef.funcao}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Atividades Executadas */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Atividades Executadas</h4>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {rdo.atividades}
                </p>
              </div>

              {/* Ocorrências */}
              {rdo.ocorrencias && (
                <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong>Ocorrência / Observação:</strong> {rdo.ocorrencias}
                  </div>
                </div>
              )}

              {/* Fotos Comprobatórias */}
              {rdo.fotos && rdo.fotos.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    Registros Fotográficos do Canteiro ({rdo.fotos.length})
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {rdo.fotos.map((foto) => (
                      <div key={foto.id} className="group relative rounded-lg overflow-hidden border border-border/60 aspect-video bg-muted">
                        <img
                          src={foto.url}
                          alt={foto.descricao || 'Foto do Canteiro'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-[10px] text-white truncate">
                          {foto.descricao || 'Foto de Acompanhamento'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
export default ObrasDiarioAdmin
