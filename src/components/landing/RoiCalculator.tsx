import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Clock, DollarSign, Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RoiCalculatorProps {
  onOpenTrial: () => void
}

export function RoiCalculator({ onOpenTrial }: RoiCalculatorProps) {
  const [propertiesCount, setPropertiesCount] = useState(65)

  // Métricas realistas de rotina de imobiliária no Brasil
  const hoursSavedPerMonth = Math.round(propertiesCount * 0.45)
  const financialSavings = Math.round(propertiesCount * 36)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-[#D4D0C8] dark:border-[#2D4A51] bg-white dark:bg-[#12232B] p-6 sm:p-10 shadow-lg"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Lado esquerdo: Controle interativo */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B]/15 text-[#AD7B3B] dark:text-[#F3C068] border border-[#AD7B3B]/30">
            <Calculator className="w-3.5 h-3.5 text-[#AD7B3B]" />
            <span>Simulador de rotina operacional</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5]">
              Quantos aluguéis sua equipe administra hoje?
            </h3>
            <p className="text-sm text-[#4A5D65] dark:text-[#A3A098] leading-relaxed font-medium">
              Arraste a barra para estimar o tempo economizado no fechamento do mês, na cobrança de boletos e no repasse aos proprietários.
            </p>
          </div>

          {/* Slider */}
          <div className="p-5 rounded-2xl bg-[#F7F6F2] dark:bg-[#17323D] border border-[#D4D0C8] dark:border-[#2D4A51] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#17323D] dark:text-[#EEECE5]">Imóveis alugados na carteira:</span>
              <motion.span
                key={propertiesCount}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
                className="text-2xl font-serif font-bold text-[#AD7B3B] dark:text-[#F3C068]"
              >
                {propertiesCount} <span className="text-xs font-sans font-normal text-[#5B6D74] dark:text-[#A3A098]">imóveis</span>
              </motion.span>
            </div>

            <input
              type="range"
              min={15}
              max={350}
              step={5}
              value={propertiesCount}
              onChange={(e) => setPropertiesCount(Number(e.target.value))}
              className="w-full h-2.5 bg-[#D4D0C8] dark:bg-[#2D4A51] rounded-lg appearance-none cursor-pointer accent-[#AD7B3B]"
            />

            <div className="flex justify-between text-[11px] text-[#5B6D74] dark:text-[#A3A098] font-mono font-medium">
              <span>15 imóveis</span>
              <span>150 imóveis</span>
              <span>350+ imóveis</span>
            </div>
          </div>
        </div>

        {/* Lado direito: Métricas de retorno visual */}
        <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#17323D] text-[#EEECE5] border border-[#2D4A51] shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#E2DFD7]/70">
              <span className="text-xs font-medium uppercase tracking-wider">Tempo Poupado</span>
              <Clock className="w-4 h-4 text-[#AD7B3B]" />
            </div>
            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-white">
                ~{hoursSavedPerMonth}h
              </div>
              <p className="text-xs text-[#E2DFD7]/80 mt-1">
                livres todo mês sem conferência manual de extrato
              </p>
            </div>
            <span className="text-[11px] text-[#F3C068] font-medium">
              Cerca de {(hoursSavedPerMonth / 8).toFixed(1)} dias de trabalho a menos no financeiro
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#17323D] border border-[#D4D0C8] dark:border-[#2D4A51] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6D74] dark:text-[#A3A098]">
              <span className="text-xs font-semibold uppercase tracking-wider">Economia Direta</span>
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-emerald-700 dark:text-emerald-400">
                R$ {financialSavings.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-[#5B6D74] dark:text-[#A3A098] mt-1 font-medium">
                estimados em redução de retrabalho e taxas
              </p>
            </div>
            <span className="text-[11px] text-[#5B6D74] dark:text-[#A3A098] font-medium">
              + Cobrança automática por WhatsApp antes do vencimento
            </span>
          </div>

          <div className="sm:col-span-2 p-4 rounded-xl bg-[#AD7B3B]/10 border border-[#AD7B3B]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#AD7B3B] text-white flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                  Contrato fechado em até 24 horas
                </h4>
                <p className="text-xs text-muted-foreground">
                  Sem esperar cartório nem motoboy: envio e assinatura digital na hora.
                </p>
              </div>
            </div>

            <Button
              onClick={onOpenTrial}
              className="w-full sm:w-auto h-10 px-4 bg-[#17323D] hover:bg-[#17323D]/90 text-white text-xs font-medium cursor-pointer shrink-0 rounded-xl"
            >
              <span>Testar por 3 Dias</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
