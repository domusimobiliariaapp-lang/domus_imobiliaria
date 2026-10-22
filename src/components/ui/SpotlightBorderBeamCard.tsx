import type * as React from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { Sparkles, ShieldCheck, Zap, FileCheck, ArrowRight, Radar } from 'lucide-react'

export function SpotlightBorderBeamCard() {
  // Spotlight: coordenadas do mouse
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* CARD 1: SPOTLIGHT CARD (O feixe de luz segue o mouse por onde ele passa) */}
        <div
          onMouseMove={handleMouseMove}
          className="group relative rounded-3xl bg-white p-8 border border-[#D4D0C8] shadow-md overflow-hidden flex flex-col justify-between"
        >
          {/* Spotlight Radial Gradient em tom Ouro Domus */}
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: useMotionTemplate`
                radial-gradient(
                  350px circle at ${mouseX}px ${mouseY}px,
                  rgba(173, 123, 59, 0.16),
                  transparent 80%
                )
              `,
            }}
          />

          {/* Borda iluminada pelo Spotlight */}
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 border border-[#AD7B3B]/50"
            style={{
              maskImage: useMotionTemplate`
                radial-gradient(
                  250px circle at ${mouseX}px ${mouseY}px,
                  black 40%,
                  transparent 100%
                )
              `,
              WebkitMaskImage: useMotionTemplate`
                radial-gradient(
                  250px circle at ${mouseX}px ${mouseY}px,
                  black 40%,
                  transparent 100%
                )
              `,
            }}
          />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20 flex items-center justify-center">
                <Radar className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/25">
                Efeito Spotlight
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold font-serif text-[#17323D] tracking-tight">
                Radar de Match Imobiliário
              </h3>
              <p className="text-xs text-[#6B6375] mt-1 leading-relaxed">
                Passe o mouse por cima deste card para ver o holofote (*spotlight*) suave iluminando a superfície e a borda dinamicamente no padrão Domus.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F5F0] border border-[#E0DED6] space-y-2 text-xs">
              <div className="flex justify-between text-[#17323D]">
                <span>Leads compatíveis encontrados:</span>
                <span className="font-bold text-[#AD7B3B]">18 clientes</span>
              </div>
              <div className="flex justify-between text-[#17323D]">
                <span>Taxa de conversão esperada:</span>
                <span className="font-bold text-emerald-700">32.5%</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6">
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-[#17323D] hover:bg-[#254F5E] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <span>Ativar Cruzamento no CRM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARD 2: BORDER BEAM (Feixe de luz infinito percorre o perímetro em Ouro e Petróleo) */}
        <div className="relative rounded-3xl bg-white p-8 border border-[#D4D0C8] shadow-md overflow-hidden flex flex-col justify-between group">
          {/* O Feixe de luz contínuo (Border Beam) com as cores da Domus */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none p-[2px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'linear' }}
              className="w-[200%] h-[200%] -top-[50%] -left-[50%] absolute"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0 310deg, #17323D 335deg, #AD7B3B 360deg)',
              }}
            />
            {/* Máscara interna para preservar o fundo branco puro do card */}
            <div className="w-full h-full rounded-[calc(1.5rem-2px)] bg-white" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#17323D]/10 text-[#17323D] border border-[#17323D]/20 flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#17323D]/10 text-[#17323D] border border-[#17323D]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#AD7B3B] animate-spin" />
                Border Beam Domus
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold font-serif text-[#17323D] tracking-tight">
                Contratos com Assinatura Gov.br
              </h3>
              <p className="text-xs text-[#6B6375] mt-1 leading-relaxed">
                Observe o feixe de luz em Petróleo e Ouro percorrendo o perímetro da borda arredondada de forma contínua e hipnotizante.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F5F0] border border-[#E0DED6] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Validade jurídica integral ICP-Brasil</span>
              </div>
              <p className="text-[11px] text-[#6B6375]">
                Dispare contratos por WhatsApp com assinatura biométrica em 2 minutos.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-6">
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-[#AD7B3B] hover:bg-[#8C6027] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <span>Gerar Novo Contrato</span>
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
