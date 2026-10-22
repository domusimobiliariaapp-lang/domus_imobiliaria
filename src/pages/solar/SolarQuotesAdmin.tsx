import { useState, useMemo } from 'react'
import { 
  Sun, 
  Zap, 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  FileText, 
  Clock, 
  Sliders,
  ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// Irradiação média por região do Brasil (kWh/m²/dia)
const IRRADIATION_BY_REGION: Record<string, number> = {
  'Norte': 4.5,
  'Nordeste': 5.5,
  'Centro-Oeste': 5.2,
  'Sudeste': 4.8,
  'Sul': 4.3,
}

// Custo médio por kWp instalado no Brasil (R$)
const COST_PER_KWP = 4200

// Potência típica de módulo fotovoltaico Tier 1 (Wp)
const MODULE_POWER_W = 550

// Fator de desempenho típico de usina solar (Performance Ratio)
const PERFORMANCE_RATIO = 0.8

interface CalculationResult {
  recommendedPowerKwp: number
  modulesQuantity: number
  annualGenerationKwh: number
  monthlyGenerationKwh: number
  monthlySavings: number
  annualSavings: number
  estimatedCost: number
  paybackMonths: number
  roi25Years: number
}

export function SolarQuotesAdmin() {
  const [activeTab, setActiveTab] = useState<'calculadora' | 'propostas'>('calculadora')
  
  // Parâmetros da Calculadora
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(650)
  const [tariff, setTariff] = useState<number>(0.92)
  const [region, setRegion] = useState<string>('Sudeste')
  const [roofType, setRoofType] = useState<string>('CERAMICA')
  const [clientName, setClientName] = useState<string>('')
  const [clientPhone, setClientPhone] = useState<string>('')

  // Cálculo reativo
  const calculation: CalculationResult = useMemo(() => {
    const irradiation = IRRADIATION_BY_REGION[region] || 4.8
    // Potência necessária (kWp) = Consumo mensal / (Irradiação * 30 * PR)
    const rawPowerKwp = monthlyConsumption / (irradiation * 30 * PERFORMANCE_RATIO)
    const modulesQuantity = Math.max(1, Math.ceil((rawPowerKwp * 1000) / MODULE_POWER_W))
    const realPowerKwp = (modulesQuantity * MODULE_POWER_W) / 1000

    const annualGenerationKwh = realPowerKwp * irradiation * 365 * PERFORMANCE_RATIO
    const monthlyGenerationKwh = annualGenerationKwh / 12
    const monthlySavings = monthlyGenerationKwh * tariff
    const annualSavings = monthlySavings * 12
    const estimatedCost = realPowerKwp * COST_PER_KWP
    const paybackMonths = monthlySavings > 0 ? Math.ceil(estimatedCost / monthlySavings) : 0
    const roi25Years = (annualSavings * 25) - estimatedCost

    return {
      recommendedPowerKwp: Number(realPowerKwp.toFixed(2)),
      modulesQuantity,
      annualGenerationKwh: Math.round(annualGenerationKwh),
      monthlyGenerationKwh: Math.round(monthlyGenerationKwh),
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      estimatedCost: Math.round(estimatedCost),
      paybackMonths,
      roi25Years: Math.round(roi25Years),
    }
  }, [monthlyConsumption, tariff, region])

  return (
    <div className="container-domus py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
              <Sun className="w-3.5 h-3.5 mr-1" /> Módulo Solar
            </Badge>
            <span className="text-xs text-muted-foreground">Multi-tenant Integrado</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mt-1">
            Orçamentos & Dimensionamento Solar
          </h1>
          <p className="text-sm text-muted-foreground">
            Calcule usinas fotovoltaicas, estime o payback e gere propostas comerciais personalizadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'calculadora' ? 'default' : 'outline'}
            onClick={() => setActiveTab('calculadora')}
            className="gap-2"
          >
            <Calculator className="w-4 h-4" />
            Simulador Rápido
          </Button>
          <Button
            variant={activeTab === 'propostas' ? 'default' : 'outline'}
            onClick={() => setActiveTab('propostas')}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Propostas Geradas
          </Button>
        </div>
      </div>

      {activeTab === 'calculadora' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna de Entradas (Inputs) */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#AD7B3B]" />
                  <span>Dados de Consumo & Localização</span>
                </CardTitle>
                <CardDescription>
                  Informe os valores da conta de luz do cliente para calcular a usina ideal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Consumo Mensal com Range Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Consumo Médio Mensal</Label>
                    <span className="text-sm font-bold font-mono text-[#AD7B3B]">{monthlyConsumption} kWh/mês</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={5000}
                    step={50}
                    value={monthlyConsumption}
                    onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
                    className="w-full accent-[#AD7B3B] h-2 bg-muted rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>100 kWh</span>
                    <span>Padrão Residencial (500 - 800 kWh)</span>
                    <span>5.000 kWh</span>
                  </div>
                </div>

                {/* Tarifa de Energia */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tarifa da Concessionária (R$/kWh)</Label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      className="pl-9"
                      value={tariff}
                      onChange={(e) => setTariff(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Região */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Região do Imóvel</Label>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Norte">Norte (4.5 h)</SelectItem>
                        <SelectItem value="Nordeste">Nordeste (5.5 h)</SelectItem>
                        <SelectItem value="Centro-Oeste">Centro-Oeste (5.2 h)</SelectItem>
                        <SelectItem value="Sudeste">Sudeste (4.8 h)</SelectItem>
                        <SelectItem value="Sul">Sul (4.3 h)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo de Telhado */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Telhado</Label>
                    <Select value={roofType} onValueChange={setRoofType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CERAMICA">Cerâmico</SelectItem>
                        <SelectItem value="FIBROCIMENTO">Fibrocimento</SelectItem>
                        <SelectItem value="METALICA">Metálico</SelectItem>
                        <SelectItem value="LAJE">Laje de Concreto</SelectItem>
                        <SelectItem value="SOLO">Solo / Solo Usina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dados do Cliente */}
                <div className="pt-3 border-t space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Dados para Proposta</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Nome do Cliente ou Empresa"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                    <Input
                      placeholder="WhatsApp (ex: 11 99999-9999)"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna de Resultados & Proposta */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card Principal de Dimensionamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Potência Recomendada</span>
                    <span className="text-xl font-bold font-mono text-foreground">
                      {calculation.recommendedPowerKwp} kWp
                    </span>
                    <span className="text-[11px] text-amber-500/90 block">
                      {calculation.modulesQuantity} placas de 550W
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Economia Mensal</span>
                    <span className="text-xl font-bold font-mono text-emerald-600">
                      R$ {calculation.monthlySavings.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      ~R$ {calculation.annualSavings.toLocaleString('pt-BR')}/ano
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#17323D]/5 border-[#17323D]/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#17323D]/10 text-[#17323D]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Payback Estimado</span>
                    <span className="text-xl font-bold font-mono text-foreground">
                      {Math.floor(calculation.paybackMonths / 12)}a {calculation.paybackMonths % 12}m
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Retorno total do investimento
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhamento Financeiro e ROI */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Resumo do Investimento & Retorno em 25 Anos</span>
                  <Badge variant="secondary" className="font-mono">Garantia 25 anos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Geração Média Estimada</span>
                    <span className="font-semibold text-base font-mono">
                      {calculation.monthlyGenerationKwh} kWh / mês
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Investimento Estimado</span>
                    <span className="font-semibold text-base font-mono text-[#AD7B3B]">
                      R$ {calculation.estimatedCost.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Área de Telhado Estimada</span>
                    <span className="font-semibold text-base font-mono">
                      ~{Math.round(calculation.modulesQuantity * 2.3)} m²
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Lucro Líquido em 25 anos</span>
                    <span className="font-semibold text-base font-mono text-emerald-600">
                      R$ {calculation.roi25Years.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button className="flex-1 bg-[#17323D] hover:bg-[#17323D]/90 text-white gap-2">
                    <FileText className="w-4 h-4" />
                    Salvar como Proposta Oficial
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Gerar PDF Comercial
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Lista de Propostas Cadastradas */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Propostas Comerciais Recentes</CardTitle>
            <CardDescription>
              Orçamentos enviados e status de negociação dos clientes solares.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <Sun className="w-10 h-10 mx-auto text-amber-500/40" />
              <p className="text-sm font-medium">Nenhuma proposta finalizada ainda nesta organização.</p>
              <p className="text-xs max-w-md mx-auto">
                Use o Simulador Rápido acima para calcular o dimensionamento da usina e clique em "Salvar como Proposta Oficial".
              </p>
              <Button onClick={() => setActiveTab('calculadora')} variant="outline" className="mt-2">
                Abrir Simulador
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
export default SolarQuotesAdmin
