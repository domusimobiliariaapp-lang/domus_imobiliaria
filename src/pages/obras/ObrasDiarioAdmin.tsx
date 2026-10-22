import { useState } from 'react'
import { 
  FileText, 
  Calendar, 
  Sun, 
  CloudRain, 
  Users, 
  Camera, 
  Plus, 
  Search, 
  AlertTriangle, 
  HardHat, 
  CheckCircle2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface DiarioItem {
  id: string
  obraNome: string
  data: string
  clima: 'Ensolarado' | 'Nublado' | 'Chuvoso'
  temperatura: number
  efetivoTotal: number
  atividades: string
  ocorrencias?: string
  fotosCount: number
  autor: string
}

export function ObrasDiarioAdmin() {
  const [searchTerm, setSearchTerm] = useState('')
  const [novoDiarioOpen, setNovoDiarioOpen] = useState(false)

  const [diarios] = useState<DiarioItem[]>([
    {
      id: 'rdo-1',
      obraNome: 'Residencial Alphaville Lote 14',
      data: '22/10/2026',
      clima: 'Ensolarado',
      temperatura: 28,
      efetivoTotal: 14,
      atividades: 'Concretagem da laje do 1º pavimento. Concluída armação das vigas V101 e V102.',
      ocorrencias: 'Atraso de 40 minutos na chegada do segundo caminhão betoneira.',
      fotosCount: 6,
      autor: 'Mestre Joaquim'
    },
    {
      id: 'rdo-2',
      obraNome: 'Edifício Comercial Corporate Tower',
      data: '22/10/2026',
      clima: 'Nublado',
      temperatura: 24,
      efetivoTotal: 32,
      atividades: 'Instalação das esquadrias de alumínio no 4º andar. Passagem de cabos da prumada elétrica.',
      fotosCount: 12,
      autor: 'Eng. Lucas Ferraz'
    },
    {
      id: 'rdo-3',
      obraNome: 'Residencial Alphaville Lote 14',
      data: '21/10/2026',
      clima: 'Ensolarado',
      temperatura: 29,
      efetivoTotal: 12,
      atividades: 'Montagem de formas e escoramento metálico. Inspeção do engenheiro estrutural aprovada.',
      fotosCount: 4,
      autor: 'Mestre Joaquim'
    },
  ])

  const filtered = diarios.filter(
    (d) =>
      d.obraNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.atividades.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container-domus py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-600/10 text-amber-600 border-amber-600/30">
              <HardHat className="w-3.5 h-3.5 mr-1" /> Módulo Engenharia & Obras
            </Badge>
            <span className="text-xs text-muted-foreground">RDO - Relatório Diário de Obra</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mt-1">
            Diário de Obra Digital
          </h1>
          <p className="text-sm text-muted-foreground">
            Registro diário de efetivo, condições climáticas, atividades executadas e fotos do canteiro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setNovoDiarioOpen(!novoDiarioOpen)}
            className="bg-[#17323D] hover:bg-[#17323D]/90 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            {novoDiarioOpen ? 'Fechar Formulário' : 'Novo Registro Diário'}
          </Button>
        </div>
      </div>

      {/* Formulário Rápido de Novo Diário */}
      {novoDiarioOpen && (
        <Card className="border-[#AD7B3B]/40 bg-[#AD7B3B]/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#AD7B3B]" />
              <span>Novo Diário de Obra (RDO)</span>
            </CardTitle>
            <CardDescription>
              Preencha o registro do dia para manter o histórico legal e técnico da obra.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Data do Relatório</Label>
                <Input type="date" defaultValue="2026-10-22" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Condição do Clima</Label>
                <Input placeholder="Ex: Ensolarado (28°C)" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Efetivo Total no Canteiro</Label>
                <Input type="number" placeholder="Ex: 15 trabalhadores" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Atividades Realizadas no Dia</Label>
              <Textarea placeholder="Descreva os serviços executados pela equipe..." rows={3} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Ocorrências / Imprevistos (Opcional)</Label>
              <Input placeholder="Atrasos de materiais, acidentes ou paralisações por chuva..." />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNovoDiarioOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-[#17323D] hover:bg-[#17323D]/90 text-white gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Salvar Diário
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por obra ou atividades..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Registros RDO */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <Card key={item.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-foreground">{item.obraNome}</h3>
                  <Badge variant="outline" className="font-mono text-xs">
                    <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                    {item.data}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {item.clima === 'Chuvoso' ? (
                      <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    {item.clima} ({item.temperatura}°C)
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    {item.efetivoTotal} operários
                  </span>
                  <span className="flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                    {item.fotosCount} fotos
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-1.5">
                <p className="text-foreground leading-relaxed">
                  <span className="font-semibold text-muted-foreground">Serviços executados: </span>
                  {item.atividades}
                </p>

                {item.ocorrencias && (
                  <p className="text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.ocorrencias}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Registrado por: <strong>{item.autor}</strong></span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#AD7B3B] hover:text-[#AD7B3B]/80">
                  Ver Fotos & Imprimir PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
export default ObrasDiarioAdmin
