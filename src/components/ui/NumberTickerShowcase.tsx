import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { RotateCcw, TrendingUp, DollarSign, Building2, Key } from 'lucide-react'


// Componente unitário de Number Ticker
function NumberTicker({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.8,
}: {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
}) {
  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000,
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  const display = useTransform(spring, (latest) => {
    return (
      prefix +
      latest.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) +
      suffix
    )
  })

  return <motion.span>{display}</motion.span>
}

export function NumberTickerShowcase() {
  const [triggerKey, setTriggerKey] = useState(0)
  const [vgv, setVgv] = useState(14850000)
  const [monthlyRevenue, setMonthlyRevenue] = useState(184200)
  const [activeProperties, setActiveProperties] = useState(284)
  const [occupancyRate, setOccupancyRate] = useState(96.8)

  const handleRestart = () => {
    setTriggerKey((k) => k + 1)
  }

  return (
    <div key={triggerKey} className="w-full max-w-4xl mx-auto py-6 space-y-8">
      {/* Barra de controle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#D4D0C8] shadow-sm">
        <div>
          <h4 className="text-sm font-bold font-serif text-[#17323D] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#AD7B3B]" />
            Number Ticker (Contadores Animados com Easing)
          </h4>
          <p className="text-xs text-[#6B6375]">
            Veja os números subirem suavemente simulando o carregamento dos dados reais do dashboard no padrão Domus.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="px-4 py-2 rounded-xl bg-[#17323D] hover:bg-[#254F5E] text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-[#AD7B3B]" />
          <span>Re-disparar Contagem</span>
        </button>
      </div>

      {/* Grid de 4 Cards com Ticker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: VGV */}
        <div className="p-5 rounded-2xl bg-white border border-[#D4D0C8] shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#6B6375]">
            <span>VGV em Carteira</span>
            <div className="p-1.5 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#17323D] tracking-tight">
            <NumberTicker value={vgv} prefix="R$ " decimals={0} />
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span>↑ +18.4%</span>
            <span className="text-[#6B6375]">vs. mês anterior</span>
          </div>
        </div>

        {/* Card 2: Receita Mensal */}
        <div className="p-5 rounded-2xl bg-white border border-[#D4D0C8] shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#6B6375]">
            <span>Receita de Locação</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#17323D] tracking-tight">
            <NumberTicker value={monthlyRevenue} prefix="R$ " decimals={0} />
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span>↑ 99.1%</span>
            <span className="text-[#6B6375]">taxa de adimplência</span>
          </div>
        </div>

        {/* Card 3: Imóveis Ativos */}
        <div className="p-5 rounded-2xl bg-white border border-[#D4D0C8] shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#6B6375]">
            <span>Imóveis Cadastrados</span>
            <div className="p-1.5 rounded-lg bg-[#17323D]/10 text-[#17323D] border border-[#17323D]/20">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#17323D] tracking-tight">
            <NumberTicker value={activeProperties} suffix=" imóveis" />
          </div>
          <div className="text-[11px] text-[#17323D] font-semibold flex items-center gap-1">
            <span>+14 captados</span>
            <span className="text-[#6B6375]">nesta semana</span>
          </div>
        </div>

        {/* Card 4: Taxa de Ocupação */}
        <div className="p-5 rounded-2xl bg-white border border-[#D4D0C8] shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#6B6375]">
            <span>Taxa de Ocupação</span>
            <div className="p-1.5 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20">
              <Key className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#17323D] tracking-tight">
            <NumberTicker value={occupancyRate} suffix="%" decimals={1} />
          </div>
          <div className="text-[11px] text-[#AD7B3B] font-semibold flex items-center gap-1">
            <span>Apenas 3.2%</span>
            <span className="text-[#6B6375]">de vacância</span>
          </div>
        </div>
      </div>

      {/* Controles para testar valores dinâmicos */}
      <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#D4D0C8] space-y-3">
        <span className="text-xs font-semibold text-[#6B6375] uppercase tracking-wider block">
          Ajuste os valores para testar a resposta do contador:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-[#6B6375] block mb-1">VGV da Carteira:</label>
            <input
              type="range"
              min="5000000"
              max="50000000"
              step="500000"
              value={vgv}
              onChange={(e) => setVgv(Number(e.target.value))}
              className="w-full accent-[#17323D] cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[#6B6375] block mb-1">Receita Mensal:</label>
            <input
              type="range"
              min="50000"
              max="500000"
              step="5000"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[#6B6375] block mb-1">Qtd. Imóveis:</label>
            <input
              type="range"
              min="50"
              max="1000"
              step="10"
              value={activeProperties}
              onChange={(e) => setActiveProperties(Number(e.target.value))}
              className="w-full accent-[#17323D] cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[#6B6375] block mb-1">Ocupação (%):</label>
            <input
              type="range"
              min="50"
              max="100"
              step="0.5"
              value={occupancyRate}
              onChange={(e) => setOccupancyRate(Number(e.target.value))}
              className="w-full accent-[#AD7B3B] cursor-pointer"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
