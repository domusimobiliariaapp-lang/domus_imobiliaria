import { useState, useEffect } from 'react'
import {
  Sun,
  Zap,
  DollarSign,
  Calculator as CalcIcon,
  Plus,
  Search,
  FileText,
  Clock,
  ShieldCheck,
  Sliders
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { solarService, type SolarQuote } from '@/modules/solar/services/solarService'

// Irradiação solar média por região do Brasil (kWh/m²/dia) - Dados CRESESB
const IRRADIATION_BY_REGION: Record<string, number> = {
  'Norte': 4.5,
  'Nordeste': 5.5,
  'Centro-Oeste': 5.2,
  'Sudeste': 4.8,
  'Sul': 4.3,
}

const COST_PER_KWP = 4200
const MODULE_POWER_W = 550
const PERFORMANCE_RATIO = 0.80

export function SolarQuotesAdmin() {
  const { organization } = useAuth()
  const orgId = organization?.id

  // Estados da Calculadora Solar
  const [monthlyConsumption, setMonthlyConsumption] = useState(650)
  const [tariff, setTariff] = useState(0.95)
  const [region, setRegion] = useState('Sudeste')
  const [roofType, setRoofType] = useState('CERAMICA')
  const [clientNameInput, setClientNameInput] = useState('')
  const [clientCityInput, setClientCityInput] = useState('')

  // Listagem de orçamentos
  const [quotes, setQuotes] = useState<SolarQuote[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'calculator' | 'quotes'>('calculator')

  useEffect(() => {
    async function loadData() {
      if (!orgId) return
      const quotesData = await solarService.getQuotes(orgId)
      setQuotes(quotesData)
    }
    loadData()
  }, [orgId])

  // Cálculos de Engenharia Solar
  const irradiation = IRRADIATION_BY_REGION[region] || 4.8
  const recommendedPowerKwp = Number((monthlyConsumption / (irradiation * 30 * PERFORMANCE_RATIO)).toFixed(2))
  const modulesQuantity = Math.max(2, Math.ceil((recommendedPowerKwp * 1000) / MODULE_POWER_W))
  const realPowerKwp = Number(((modulesQuantity * MODULE_POWER_W) / 1000).toFixed(2))
  const annualGenerationKwh = Math.round(realPowerKwp * irradiation * 365 * PERFORMANCE_RATIO)
  const monthlyGenerationKwh = Math.round(annualGenerationKwh / 12)
  const monthlySavings = Math.round(monthlyGenerationKwh * tariff)
  const annualSavings = monthlySavings * 12
  const estimatedCost = Math.round(realPowerKwp * COST_PER_KWP)
  const paybackMonths = monthlySavings > 0 ? Math.ceil(estimatedCost / monthlySavings) : 0
  const roi25Years = Math.round((annualSavings * 25) - estimatedCost)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
  }

  const handleGenerateQuoteFromCalc = async () => {
    if (!orgId) return
    const newQuote: Partial<SolarQuote> = {
      client_name: clientNameInput.trim() || 'Cliente Simulação Rápida',
      address_city: clientCityInput.trim() || 'São Paulo',
      address_state: 'SP',
      roof_type: roofType,
      status: 'SENT',
      average_monthly_kwh: monthlyConsumption,
      tariff,
      recommended_power_kwp: realPowerKwp,
      estimated_generation_kwh: monthlyGenerationKwh,
      modules_quantity: modulesQuantity,
      inverter_power_kw: Math.ceil(realPowerKwp * 0.8),
      modules: `${modulesQuantity}x Módulos Fotovoltaicos Tier 1 ${MODULE_POWER_W}Wp Monocristalinos`,
      inverter: `1x Inversor Solar On-Grid ${Math.ceil(realPowerKwp * 0.8)}kW com Wi-Fi`,
      total: estimatedCost,
      monthly_savings: monthlySavings,
      payback_months: paybackMonths,
      roi_25_years: roi25Years
    }

    const saved = await solarService.saveQuote(newQuote, orgId)
    setQuotes([saved, ...quotes])
    setActiveTab('quotes')
  }

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = (q.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (q.address_city || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Sun className="h-4 w-4" /> Módulo de Energia Solar
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Calculadora Solar & Orçamentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Dimensione usinas fotovoltaicas em segundos e gere propostas com retorno de investimento garantido.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'calculator' ? 'default' : 'outline'}
            onClick={() => setActiveTab('calculator')}
            className={activeTab === 'calculator' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
          >
            <CalcIcon className="h-4 w-4 mr-2" /> Calculadora & Dimensionamento
          </Button>
          <Button
            variant={activeTab === 'quotes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('quotes')}
            className={activeTab === 'quotes' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}
          >
            <FileText className="h-4 w-4 mr-2" /> Propostas ({quotes.length})
          </Button>
        </div>
      </div>

      {activeTab === 'calculator' ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Formulário de Dimensionamento */}
          <Card className="lg:col-span-5 shadow-sm border-border/60">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sliders className="h-5 w-5 text-amber-500" />
                Parâmetros da Usina
              </CardTitle>
              <CardDescription>
                Informe a conta de energia e características do telhado do cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente ou Empresa</Label>
                <Input
                  id="clientName"
                  placeholder="Ex: Cerâmica Santa Tereza Ltda"
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="clientCity">Cidade da Instalação</Label>
                  <Input
                    id="clientCity"
                    placeholder="Ex: Campinas"
                    value={clientCityInput}
                    onChange={(e) => setClientCityInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Região (Irradiação)</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a região" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sudeste">Sudeste (4.8 kWh/m²)</SelectItem>
                      <SelectItem value="Nordeste">Nordeste (5.5 kWh/m²)</SelectItem>
                      <SelectItem value="Centro-Oeste">Centro-Oeste (5.2 kWh/m²)</SelectItem>
                      <SelectItem value="Norte">Norte (4.5 kWh/m²)</SelectItem>
                      <SelectItem value="Sul">Sul (4.3 kWh/m²)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Slider de Consumo Nativo */}
              <div className="space-y-3 p-4 bg-muted/40 rounded-xl border border-border/40">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold">Consumo Médio Mensal</Label>
                  <span className="text-base font-bold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    {monthlyConsumption} kWh/mês
                  </span>
                </div>
                <input
                  type="range"
                  value={monthlyConsumption}
                  onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
                  min={100}
                  max={5000}
                  step={50}
                  className="w-full h-2 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>100 kWh (Residencial)</span>
                  <span>2.500 kWh</span>
                  <span>5.000 kWh (Comercial)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tariff">Tarifa da Concessionária (R$/kWh)</Label>
                  <Input
                    id="tariff"
                    type="number"
                    step="0.01"
                    value={tariff}
                    onChange={(e) => setTariff(parseFloat(e.target.value) || 0.85)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Telhado / Solo</Label>
                  <Select value={roofType} onValueChange={setRoofType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CERAMICA">Telha Cerâmica</SelectItem>
                      <SelectItem value="FIBROCIMENTO">Fibrocimento</SelectItem>
                      <SelectItem value="METALICA">Metálica / Trapezoidal</SelectItem>
                      <SelectItem value="LAJE">Laje de Concreto</SelectItem>
                      <SelectItem value="SOLO">Solo (Usinas Rurais)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateQuoteFromCalc}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold py-6 shadow-md"
              >
                <Plus className="h-5 w-5 mr-2" /> Salvar & Emitir Proposta Comercial
              </Button>
            </CardContent>
          </Card>

          {/* Resultado do Dimensionamento da Engenharia Solar */}
          <div className="lg:col-span-7 space-y-5">
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background">
                <CardContent className="p-4">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Zap className="h-4 w-4 text-amber-500" /> Potência Usina
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {realPowerKwp} <span className="text-sm font-normal text-muted-foreground">kWp</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {modulesQuantity} módulos de 550Wp
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="p-4">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Sun className="h-4 w-4 text-amber-500" /> Geração Estimada
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {monthlyGenerationKwh} <span className="text-sm font-normal text-muted-foreground">kWh/mês</span>
                  </div>
                  <div className="text-xs text-emerald-600 font-medium mt-1">
                    {annualGenerationKwh.toLocaleString('pt-BR')} kWh/ano
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-4">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-4 w-4 text-emerald-600" /> Economia Mensal
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {formatCurrency(monthlySavings)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(annualSavings)}/ano
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="p-4">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Clock className="h-4 w-4 text-blue-500" /> Payback
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {paybackMonths} <span className="text-sm font-normal text-muted-foreground">meses</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ~{(paybackMonths / 12).toFixed(1)} anos de retorno
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quadro de Proposta & Equipamentos Sugeridos */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      Composição do Kit Fotovoltaico Dimensionado
                    </CardTitle>
                    <CardDescription>
                      Equipamentos dimensionados para suprir 100% da fatura do cliente
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-amber-500 text-amber-600 font-semibold px-3 py-1">
                    Garantia de 25 anos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg border border-border/50 bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Gerador Fotovoltaico</p>
                    <p className="font-semibold text-foreground text-sm">{modulesQuantity}x Módulos 550Wp Monocristalinos Tier 1</p>
                    <p className="text-xs text-muted-foreground mt-1">Área de telhado necessária: ~{Math.ceil(modulesQuantity * 2.6)} m²</p>
                  </div>
                  <div className="p-3.5 rounded-lg border border-border/50 bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Inversor Central On-Grid</p>
                    <p className="font-semibold text-foreground text-sm">1x Inversor {Math.ceil(realPowerKwp * 0.8)} kW com Monitoramento WiFi</p>
                    <p className="text-xs text-muted-foreground mt-1">Garantia padrão de 10 anos pelo fabricante</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-emerald-500/10 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Investimento Total Turnkey</p>
                    <p className="text-3xl font-black text-foreground">{formatCurrency(estimatedCost)}</p>
                    <p className="text-xs text-muted-foreground">Incluso equipamentos, homologação, projeto e montagem</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-emerald-600 uppercase">Lucro Acumulado em 25 anos</p>
                    <p className="text-2xl font-black text-emerald-600">+{formatCurrency(roi25Years)}</p>
                    <p className="text-xs text-muted-foreground">Economia líquida após pagar o sistema</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Aba de Propostas & Orçamentos Cadastrados */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou cidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status da Proposta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="APPROVED">Aprovadas</SelectItem>
                  <SelectItem value="SENT">Enviadas</SelectItem>
                  <SelectItem value="DRAFT">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredQuotes.map((q) => (
              <Card key={q.id} className="border-border/60 hover:border-amber-500/50 transition-all shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-lg">{q.client_name}</span>
                        <Badge
                          variant={q.status === 'APPROVED' ? 'default' : q.status === 'SENT' ? 'secondary' : 'outline'}
                          className={
                            q.status === 'APPROVED'
                              ? 'bg-emerald-600 text-white'
                              : q.status === 'SENT'
                              ? 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                              : ''
                          }
                        >
                          {q.status === 'APPROVED' ? 'Aprovado' : q.status === 'SENT' ? 'Enviado ao Cliente' : 'Rascunho'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {q.address_city} - {q.address_state} • Telhado: {q.roof_type || 'Cerâmica'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-foreground">{formatCurrency(q.total)}</div>
                      <div className="text-xs text-emerald-600 font-semibold">Economia: {formatCurrency(q.monthly_savings)}/mês</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center bg-muted/30 p-2.5 rounded-lg text-xs">
                    <div>
                      <span className="text-muted-foreground block">Potência</span>
                      <strong className="text-foreground">{q.recommended_power_kwp} kWp</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Módulos</span>
                      <strong className="text-foreground">{q.modules_quantity}x 550Wp</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Payback</span>
                      <strong className="text-foreground">{q.payback_months} meses</strong>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    <strong>Kit:</strong> {q.modules}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default SolarQuotesAdmin
