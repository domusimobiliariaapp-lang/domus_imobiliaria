import { useState, useEffect } from 'react'
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import {
  Building2, Users, DollarSign, ArrowUpRight,
  Calendar, Search, Bell, Sparkles, Key, RotateCcw,
  PieChart as PieIcon, BarChart3, TrendingUp, CheckCircle2
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'

// Number Ticker para os cards de estatísticas do dashboard
function DashboardTicker({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 85, damping: 16 })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  const display = useTransform(spring, (latest) =>
    prefix + Math.round(latest).toLocaleString('pt-BR') + suffix
  )

  return <motion.span>{display}</motion.span>
}

// Dados para os gráficos
const areaDataByPeriod = {
  semana: [
    { label: 'Seg', faturamento: 12000, locacoes: 8000 },
    { label: 'Ter', faturamento: 24000, locacoes: 14000 },
    { label: 'Qua', faturamento: 18000, locacoes: 12000 },
    { label: 'Qui', faturamento: 36000, locacoes: 22000 },
    { label: 'Sex', faturamento: 28000, locacoes: 19000 },
    { label: 'Sáb', faturamento: 45000, locacoes: 31000 },
    { label: 'Dom', faturamento: 39000, locacoes: 26000 },
  ],
  mes: [
    { label: 'Sem 1', faturamento: 72000, locacoes: 45000 },
    { label: 'Sem 2', faturamento: 98000, locacoes: 61000 },
    { label: 'Sem 3', faturamento: 84000, locacoes: 52000 },
    { label: 'Sem 4', faturamento: 115000, locacoes: 78000 },
  ],
  ano: [
    { label: 'Jan', faturamento: 210000, locacoes: 140000 },
    { label: 'Fev', faturamento: 260000, locacoes: 175000 },
    { label: 'Mar', faturamento: 310000, locacoes: 198000 },
    { label: 'Abr', faturamento: 290000, locacoes: 185000 },
    { label: 'Mai', faturamento: 350000, locacoes: 220000 },
    { label: 'Jun', faturamento: 420000, locacoes: 280000 },
  ],
}

// Dados para o Gráfico de Pizza / Donut com as cores nobres da Domus
const propertyTypeData = [
  { name: 'Apartamentos', value: 78, color: '#17323D', percent: '55%' },
  { name: 'Casas & Condomínios', value: 36, color: '#AD7B3B', percent: '25%' },
  { name: 'Comerciais & Salas', value: 18, color: '#2D4A51', percent: '13%' },
  { name: 'Terrenos & Lotes', value: 10, color: '#C89551', percent: '7%' },
]

export function GlassmorphicDashboardView() {
  const [selectedPeriod, setSelectedPeriod] = useState<'semana' | 'mes' | 'ano'>('mes')
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null)
  const [activeTabChart, setActiveTabChart] = useState<'area' | 'bar'>('area')
  const [renderKey, setRenderKey] = useState(0)

  const handleRestartAnimations = () => {
    setRenderKey((k) => k + 1)
  }

  const activeCategory =
    activePieIndex !== null ? propertyTypeData[activePieIndex] : null

  return (
    <div
      key={renderKey}
      className="w-full rounded-3xl p-6 lg:p-8 bg-gradient-to-br from-white via-[#F7F5F0] to-[#EEECE5] text-[#17323D] shadow-xl border border-[#D4D0C8] relative overflow-hidden"
    >
      {/* Luzes de ambientação com blur no fundo (aurora suave Domus) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#AD7B3B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#17323D]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header com Saudação, Busca e Botão de Re-animar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#AD7B3B]/15 text-[#AD7B3B] border border-[#AD7B3B]/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#AD7B3B]" />
              Admin Dashboard V7 · Live Motion
            </span>
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block" />
              Ao vivo
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-serif tracking-tight text-[#17323D] mt-1">
            Bom dia, Gestor <span className="inline-block animate-pulse">☀️</span>
          </h1>
          <p className="text-xs text-[#6B6375]">
            Confira a performance da carteira imobiliária em tempo real no padrão Domus.
          </p>
        </div>

        {/* Barra de Pesquisa e Notificações com Estilo Domus */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRestartAnimations}
            className="p-2.5 rounded-xl bg-white hover:bg-[#F7F5F0] border border-[#D4D0C8] text-[#17323D] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Re-disparar todas as animações"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#AD7B3B]" />
            <span className="hidden sm:inline">Re-animar</span>
          </button>

          <div className="relative">
            <Search className="w-4 h-4 text-[#6B6375] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar imóvel, cliente..."
              className="pl-9 pr-4 py-2 rounded-xl text-xs bg-white border border-[#D4D0C8] text-[#17323D] placeholder:text-[#6B6375] focus:outline-none focus:ring-2 focus:ring-[#AD7B3B]/50 w-44 md:w-60 shadow-xs"
            />
          </div>

          <button className="p-2.5 rounded-xl bg-white hover:bg-[#F7F5F0] border border-[#D4D0C8] text-[#17323D] transition-all cursor-pointer relative shadow-xs">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-[#AD7B3B] absolute top-2 right-2 ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* Grid de 4 StatsCards com Number Ticker e Framer Motion */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-white hover:bg-[#F7F5F0]/60 border border-[#D4D0C8] hover:border-[#AD7B3B]/50 cursor-pointer transition-colors shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#6B6375]">Receita Mês</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#17323D] tracking-tight">
            <DashboardTicker value={84500} prefix="R$ " />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.4% vs mês anterior</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-white hover:bg-[#F7F5F0]/60 border border-[#D4D0C8] hover:border-[#AD7B3B]/50 cursor-pointer transition-colors shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#6B6375]">Imóveis na Carteira</span>
            <div className="p-1.5 rounded-lg bg-[#17323D]/10 text-[#17323D]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#17323D] tracking-tight">
            <DashboardTicker value={142} suffix=" ativos" />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#17323D]">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8 novos este mês</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-white hover:bg-[#F7F5F0]/60 border border-[#D4D0C8] hover:border-[#AD7B3B]/50 cursor-pointer transition-colors shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#6B6375]">Taxa de Ocupação</span>
            <div className="p-1.5 rounded-lg bg-[#AD7B3B]/15 text-[#AD7B3B]">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#17323D] tracking-tight">
            <DashboardTicker value={94} suffix="%" />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#AD7B3B]">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Apenas 6% de vacância</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-white hover:bg-[#F7F5F0]/60 border border-[#D4D0C8] hover:border-[#AD7B3B]/50 cursor-pointer transition-colors shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#6B6375]">Leads no CRM</span>
            <div className="p-1.5 rounded-lg bg-[#2D4A51]/10 text-[#2D4A51]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#17323D] tracking-tight">
            <DashboardTicker value={56} suffix=" contatos" />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#AD7B3B]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>18 propostas quentes</span>
          </div>
        </motion.div>
      </div>

      {/* Grid Principal: Gráfico Evolutivo + Gráfico de Pizza / Donut Animado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-stretch">
        {/* Coluna Esquerda (7 colunas): Gráfico com Alternador de Área / Barras */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-[#D4D0C8] shadow-sm space-y-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#AD7B3B]" />
                <h3 className="text-sm font-semibold text-[#17323D]">
                  Movimentação Financeira Animada
                </h3>
              </div>
              <p className="text-xs text-[#6B6375] mt-0.5">
                Volume transacionado com animação de entrada fluida
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Alternador de Tipo de Gráfico */}
              <div className="p-1 rounded-xl bg-[#EEECE5] border border-[#D4D0C8] flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTabChart('area')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTabChart === 'area' ? 'bg-[#17323D] text-white font-bold' : 'text-[#6B6375] hover:text-[#17323D]'
                  }`}
                  title="Gráfico de Área"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabChart('bar')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTabChart === 'bar' ? 'bg-[#17323D] text-white font-bold' : 'text-[#6B6375] hover:text-[#17323D]'
                  }`}
                  title="Gráfico de Barras"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Seletor de Período */}
              <div className="p-1 rounded-xl bg-[#EEECE5] border border-[#D4D0C8] flex items-center text-xs">
                {(['semana', 'mes', 'ano'] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                      selectedPeriod === period
                        ? 'bg-[#17323D] text-white font-bold'
                        : 'text-[#6B6375] hover:text-[#17323D]'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gráfico Recharts com Animação Ativa */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeTabChart === 'area' ? (
                <AreaChart data={areaDataByPeriod[selectedPeriod]}>
                  <defs>
                    <linearGradient id="gradientFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#17323D" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#17323D" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradientLocacoes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#AD7B3B" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#AD7B3B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#6B6375" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#6B6375"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `R$${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#D4D0C8',
                      borderRadius: '12px',
                      color: '#17323D',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="faturamento"
                    name="Faturamento Total"
                    stroke="#17323D"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradientFaturamento)"
                    isAnimationActive={true}
                    animationDuration={1200}
                  />
                  <Area
                    type="monotone"
                    dataKey="locacoes"
                    name="Locações Líquidas"
                    stroke="#AD7B3B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#gradientLocacoes)"
                    isAnimationActive={true}
                    animationDuration={1400}
                  />
                </AreaChart>
              ) : (
                <BarChart data={areaDataByPeriod[selectedPeriod]}>
                  <XAxis dataKey="label" stroke="#6B6375" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#6B6375"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `R$${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#D4D0C8',
                      borderRadius: '12px',
                      color: '#17323D',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="faturamento"
                    name="Faturamento"
                    fill="#17323D"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1200}
                  />
                  <Bar
                    dataKey="locacoes"
                    name="Locações"
                    fill="#AD7B3B"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1400}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coluna Direita (5 colunas): GRÁFICO DE PIZZA / DONUT ANIMADO E INTERATIVO */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-[#D4D0C8] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#AD7B3B]" />
                <h3 className="text-sm font-semibold text-[#17323D]">
                  Distribuição da Carteira
                </h3>
              </div>
              <p className="text-xs text-[#6B6375] mt-0.5">
                Passe o mouse nas fatias para destacar
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#6B6375]">Total: 142</span>
          </div>

          {/* O Gráfico de Donut Animado com Centro Dinâmico */}
          <div className="relative h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={propertyTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={true}
                  animationBegin={100}
                  animationDuration={1400}
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                  cursor="pointer"
                >
                  {propertyTypeData.map((entry, index) => {
                    const isSelected = activePieIndex === index
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={isSelected ? '#17323D' : '#ffffff'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="transition-all duration-300"
                        style={{
                          filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                        }}
                      />
                    )
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#D4D0C8',
                    borderRadius: '12px',
                    color: '#17323D',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(val, name) => [`${val} imóveis`, name]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Informação no Centro do Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <AnimatePresence mode="wait">
                {activeCategory ? (
                  <motion.div
                    key={activeCategory.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-xl font-bold font-serif text-[#17323D]">
                      {activeCategory.percent}
                    </span>
                    <span className="block text-[10px] text-[#6B6375] font-semibold max-w-[90px] leading-tight mx-auto">
                      {activeCategory.name}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="text-xl font-bold font-serif text-[#17323D]">
                      142
                    </span>
                    <span className="block text-[10px] text-[#6B6375]">
                      Imóveis
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Legenda Interativa com Reação ao Hover */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#E0DED6]">
            {propertyTypeData.map((item, idx) => {
              const isSelected = activePieIndex === idx

              return (
                <button
                  key={item.name}
                  type="button"
                  onMouseEnter={() => setActivePieIndex(idx)}
                  onMouseLeave={() => setActivePieIndex(null)}
                  className={`p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEECE5] ring-1 ring-[#AD7B3B]/40'
                      : 'hover:bg-[#F7F5F0] text-[#6B6375]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-[11px] font-medium text-[#17323D]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-[11px] text-[#17323D] ml-1">
                    {item.value}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Seção Inferior: Feed de Atividades Recentes com Entrada Fluida */}
      <div className="mt-6 p-6 rounded-3xl bg-white border border-[#D4D0C8] shadow-sm relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#AD7B3B]" />
            <h3 className="text-sm font-semibold text-[#17323D]">
              Atividades e Compromissos Recentes
            </h3>
          </div>
          <span className="text-xs text-[#6B6375]">Próximas 24 horas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { time: '09:30', title: 'Vistoria de Entrada', ref: 'Apto 402 - Jardins', tag: 'Hoje', badgeColor: 'bg-[#17323D]/10 text-[#17323D]' },
            { time: '11:00', title: 'Assinatura Digital', ref: 'Casa Alphaville', tag: 'Hoje', badgeColor: 'bg-emerald-500/15 text-emerald-700' },
            { time: '14:30', title: 'Visita Comercial', ref: 'Sala 1205 - Paulista', tag: 'Hoje', badgeColor: 'bg-[#2D4A51]/10 text-[#2D4A51]' },
            { time: '16:00', title: 'Repasse a Proprietário', ref: 'Loteamento Bosque', tag: 'Amanhã', badgeColor: 'bg-[#AD7B3B]/15 text-[#AD7B3B]' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -3, scale: 1.01 }}
              className="p-3.5 rounded-2xl bg-[#F7F5F0] hover:bg-white border border-[#E0DED6] hover:border-[#AD7B3B]/30 transition-all space-y-2 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.tag} · {item.time}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6B6375]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#17323D] truncate">{item.title}</div>
                <div className="text-[11px] text-[#6B6375] truncate">{item.ref}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
