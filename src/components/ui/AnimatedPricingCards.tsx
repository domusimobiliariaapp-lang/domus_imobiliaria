import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck, Crown } from 'lucide-react'

export function AnimatedPricingCards() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isEnterpriseHovered, setIsEnterpriseHovered] = useState(false)

  return (
    <div className="w-full max-w-5xl mx-auto py-4 space-y-8">
      {/* Seletor Mensal / Anual */}
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D4D0C8] text-xs text-[#17323D] shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#AD7B3B]" />
          <span>Planos Transparentes · Cancele ou mude a qualquer momento</span>
        </div>

        <div className="p-1 rounded-2xl bg-[#EEECE5] border border-[#D4D0C8] flex items-center gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-[#17323D] text-white shadow-xs font-bold'
                : 'text-[#6B6375] hover:text-[#17323D]'
            }`}
          >
            Faturamento Mensal
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              billingCycle === 'annual'
                ? 'bg-[#17323D] text-white shadow-xs font-bold'
                : 'text-[#6B6375] hover:text-[#17323D]'
            }`}
          >
            <span>Anual</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#AD7B3B]/15 text-[#AD7B3B] border border-[#AD7B3B]/30 font-bold">
              -20% OFF
            </span>
          </button>
        </div>
      </div>

      {/* Grid de Cards de Preço com Animação no padrão Domus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
        {/* CARD 1: Plano Team / Starter */}
        <motion.div
          whileHover={{ y: -6, scale: 1.015 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-3xl p-8 bg-white border border-[#D4D0C8] text-[#17323D] shadow-md flex flex-col justify-between overflow-hidden"
        >
          {/* Luz de gradiente sutil no canto */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#17323D]/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Cabeçalho do Card */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#17323D]/10 text-[#17323D] flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#17323D]/10 text-[#17323D] border border-[#17323D]/20">
                Mais Escolhido
              </span>
            </div>

            <h3 className="text-2xl font-bold font-serif tracking-tight">Team</h3>
            <p className="text-xs text-[#6B6375] mt-1">
              Ideal para imobiliárias em crescimento e equipes de corretores.
            </p>

            {/* Preço */}
            <div className="my-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-[#17323D]">
                  {billingCycle === 'annual' ? 'R$ 239' : 'R$ 299'}
                </span>
                <span className="text-xs text-[#6B6375] font-medium">
                  /mês por corretor
                </span>
              </div>
              <p className="text-[11px] text-[#6B6375] mt-1">
                {billingCycle === 'annual' ? 'Faturado anualmente com desconto' : 'Cobrança mensal recorrente'}
              </p>
            </div>

            {/* Botão de Ação */}
            <button
              type="button"
              onClick={() => setSelectedPlan('Team')}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-[#17323D] hover:bg-[#254F5E] shadow-sm active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 mb-8"
            >
              <span>Escolher Plano Team</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Lista de Recursos */}
            <div className="space-y-3.5 pt-2 border-t border-[#E0DED6]">
              {[
                'Usuários ilimitados na equipe',
                'Sincronização com portais a cada hora',
                'Suporte prioritário via WhatsApp',
                'Contratos digitais e locação rápida',
                'Painel financeiro com emissão de boletos',
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-[#17323D]">
                  <div className="w-4 h-4 rounded-full bg-[#17323D]/10 text-[#17323D] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CARD 2: Plano Destacado "BEST VALUE TO PRICE" (Dourado Ouro Domus #AD7B3B Header que surge no hover) */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ duration: 0.3 }}
          onMouseEnter={() => setIsEnterpriseHovered(true)}
          onMouseLeave={() => setIsEnterpriseHovered(false)}
          className={`relative rounded-3xl bg-white border-2 transition-all duration-300 text-[#17323D] flex flex-col justify-between overflow-hidden cursor-pointer ${
            isEnterpriseHovered
              ? 'border-[#AD7B3B] shadow-xl shadow-[#AD7B3B]/20 ring-1 ring-[#AD7B3B]/30'
              : 'border-[#D4D0C8] shadow-md'
          }`}
        >
          {/* Header Banner com Gradiente Ouro Nobre Domus (#AD7B3B) - surge no hover */}
          <motion.div
            initial={false}
            animate={
              isEnterpriseHovered
                ? { height: 42, opacity: 1, y: 0 }
                : { height: 0, opacity: 0, y: -10 }
            }
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="w-full overflow-hidden bg-gradient-to-r from-[#8C6027] via-[#AD7B3B] to-[#C89551] text-white font-bold tracking-widest text-xs uppercase shadow-xs flex items-center justify-center select-none"
          >
            <div className="py-2.5 px-4 flex items-center justify-center gap-2">
              <Crown className="w-3.5 h-3.5 text-white" />
              <span>MELHOR CUSTO-BENEFÍCIO</span>
            </div>
          </motion.div>

          <div className="p-8 flex-1 flex flex-col justify-between">
            <div>
              {/* Cabeçalho */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-[11px] font-semibold tracking-wider text-[#AD7B3B] uppercase">
                  Domus Enterprise Retainer
                </div>
                <div className="flex gap-1 text-[#AD7B3B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#AD7B3B]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#AD7B3B]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#AD7B3B]" />
                </div>
              </div>

              <h3 className="text-3xl font-extrabold tracking-tight font-serif text-[#17323D]">Enterprise</h3>
              <p className="text-xs text-[#6B6375] mt-1">
                Potência máxima com inteligência e suporte dedicado exclusivo.
              </p>

              {/* Preço e Botão lado a lado ou em destaque */}
              <div className="my-6 p-4 rounded-2xl bg-[#AD7B3B]/10 border border-[#AD7B3B]/30">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-[#17323D]">
                      {billingCycle === 'annual' ? 'R$ 7.120' : 'R$ 8.900'}
                    </span>
                    <span className="text-xs text-[#6B6375] font-medium ml-1">
                      /mês
                    </span>
                  </div>
                  <span className="text-[10px] text-[#AD7B3B] font-semibold bg-[#AD7B3B]/15 px-2 py-0.5 rounded-full border border-[#AD7B3B]/20">
                    Pause ou cancele a qualquer hora
                  </span>
                </div>
              </div>

              {/* Botão de Contratação com Efeito Glow Dourado */}
              <button
                type="button"
                onClick={() => setSelectedPlan('Enterprise')}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-[#AD7B3B] hover:bg-[#8C6027] shadow-md shadow-[#AD7B3B]/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 mb-8"
              >
                <span>Contratar Plano Enterprise</span>
                <Sparkles className="w-4 h-4 text-white" />
              </button>

              {/* Checklist com todos os benefícios VIP */}
              <div className="space-y-3.5 pt-2 border-t border-[#E0DED6]">
                {[
                  'Tudo incluso do plano Team ilimitado',
                  'Canal direto via WhatsApp com gerente de contas',
                  'Integração e desenvolvimento customizado sem custo adicional',
                  'Disponibilidade 5 dias por semana com SLA prioritário de 2h',
                  'Entrega de melhorias e integrações em média de 48 horas',
                  'Subdomínio + Domínio próprio personalizado (White-label)',
                  'Início imediato com onboarding guiado por especialistas',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-[#17323D]">
                    <div className="w-4 h-4 rounded-full bg-[#AD7B3B]/15 text-[#AD7B3B] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alerta de confirmação se o usuário clicar no botão */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 max-w-md mx-auto text-center text-xs flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Plano <strong>{selectedPlan}</strong> selecionado com ciclo {billingCycle === 'annual' ? 'Anual' : 'Mensal'}!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
