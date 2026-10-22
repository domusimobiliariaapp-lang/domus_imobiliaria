import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, Clock, Crown, ShieldCheck, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { getLifetimeSettings, type LifetimeSettings, DEFAULT_LIFETIME_SETTINGS } from '@/lib/lifetimeSettings'
import type { SaasPlan } from '@/types'

interface PricingTableProps {
  onSelectPlan: (planName: string) => void
}

export function PricingTable({ onSelectPlan }: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'lifetime'>('annual')
  const [dbPlans, setDbPlans] = useState<SaasPlan[]>([])
  const [lifetimeSettings, setLifetimeSettings] = useState<LifetimeSettings>(DEFAULT_LIFETIME_SETTINGS)

  useEffect(() => {
    async function loadDbPlans() {
      try {
        const [plansRes, lifetime] = await Promise.all([
          supabase
            .from('saas_plans')
            .select('*')
            .eq('active', true)
            .order('price_monthly', { ascending: true }),
          getLifetimeSettings(),
        ])
        if (plansRes.data && plansRes.data.length > 0) {
          setDbPlans(plansRes.data as SaasPlan[])
        }
        setLifetimeSettings(lifetime)
      } catch {
        // Fallback silencioso para planos estáticos
      }
    }
    loadDbPlans()
  }, [])

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      badge: null,
      description: 'Para corretores autônomos e imobiliárias boutique com até 35 contratos de aluguel.',
      priceMonthly: 229,
      priceAnnualMonthly: 189,
      features: [
        'Até 35 imóveis na carteira',
        'Controle de contratos e vencimentos',
        'Subdomínio próprio (suaempresa.domus.com.br)',
        'Vitrine pública de imóveis para WhatsApp',
        'Emissão de cobrança e conciliação',
        'Até 2 usuários com login próprio',
        'Suporte por chamado em horário comercial',
      ],
      notIncluded: [
        'Portal do inquilino com 2ª via sem senha',
        'Pipeline Kanban de leads e visitas',
        'Vistoria fotográfica com laudo digital',
      ],
      ctaText: 'Testar 3 Dias Grátis',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Profissional',
      badge: 'Mais contratado',
      description: 'Para imobiliárias com carteira ativa que precisam fechar repasses sem atraso.',
      priceMonthly: 459,
      priceAnnualMonthly: 379,
      features: [
        'Até 150 imóveis na carteira',
        'Tudo do plano Starter incluso',
        'Portal do Inquilino e Proprietário (acesso por código no celular)',
        'CRM com funil de atendimento e agendamento de visitas',
        'Vistoria de entrada e saída com fotos na nuvem',
        'Cálculo e lote de repasses PIX aos proprietários',
        'Reajustes automáticos por IPCA e IGP-M',
        'Até 6 usuários da equipe com permissões separadas',
        'Suporte prioritário via WhatsApp',
      ],
      notIncluded: [
        'Domínio personalizado próprio (.com.br exclusivo)',
        'Migração de banco de dados assistida',
      ],
      ctaText: 'Testar Plano Profissional (3 dias)',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      badge: 'Grandes carteiras',
      description: 'Para administradoras com mais de 150 imóveis e múltiplos corretores em campo.',
      priceMonthly: 829,
      priceAnnualMonthly: 690,
      features: [
        'Imóveis e contratos ilimitados',
        'Tudo do plano Profissional incluso',
        'Usuários e corretores ilimitados',
        'Configuração de domínio próprio (ex: www.suaimobiliaria.com.br)',
        'Importação assistida de contratos e cadastros antigos',
        'Treinamento prático da equipe com nosso especialista',
        'Auditoria e log de ações no sistema',
        'Canal de suporte direto com a equipe técnica',
      ],
      notIncluded: [],
      ctaText: 'Falar com Especialista',
      popular: false,
    },
  ]

  const mergedPlans = plans.map((p) => {
    const fromDb = dbPlans.find((item) => item.id === p.id)
    if (!fromDb) return p
    return {
      ...p,
      name: fromDb.name || p.name,
      description: fromDb.description || p.description,
      priceMonthly: Number(fromDb.price_monthly) || p.priceMonthly,
      priceAnnualMonthly: Number(fromDb.price_annual_monthly) || p.priceAnnualMonthly,
      popular: fromDb.popular !== undefined ? fromDb.popular : p.popular,
      badge: fromDb.badge !== undefined ? fromDb.badge : p.badge,
    }
  })

  return (
    <div className="w-full">
      {/* Seletor Mensal / Anual / Vitalício com animação de pill */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
        <div className="inline-flex flex-wrap items-center justify-center p-1 rounded-xl bg-card border border-border shadow-xs gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              billingCycle === 'monthly' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {billingCycle === 'monthly' && (
              <motion.div
                layoutId="cycle-indicator"
                className="absolute inset-0 bg-[#17323D] rounded-lg shadow-xs"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">Mensal sem compromisso</span>
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              billingCycle === 'annual' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {billingCycle === 'annual' && (
              <motion.div
                layoutId="cycle-indicator"
                className="absolute inset-0 bg-[#17323D] rounded-lg shadow-xs"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">Anual (-20%)</span>
            <span className="relative z-10 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#AD7B3B] text-white">
              2 meses grátis
            </span>
          </button>

          {lifetimeSettings.active && (
            <button
              onClick={() => setBillingCycle('lifetime')}
              className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'lifetime' ? 'text-white' : 'text-amber-700 dark:text-amber-400 hover:text-foreground'
              }`}
            >
              {billingCycle === 'lifetime' && (
                <motion.div
                  layoutId="cycle-indicator"
                  className="absolute inset-0 bg-gradient-to-r from-[#AD7B3B] to-amber-700 rounded-lg shadow-xs"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <Crown className="w-3.5 h-3.5 relative z-10 text-amber-200" />
              <span className="relative z-10 font-bold">Licença Vitalícia (Sem Mensalidade)</span>
              <span className="relative z-10 px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-900/60 text-amber-200 border border-amber-500/30">
                Único
              </span>
            </button>
          )}
        </div>
      </div>

      {billingCycle === 'lifetime' ? (
        /* VISÃO DEDICADA DA LICENÇA VITALÍCIA (SEM MENSALIDADE) */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto rounded-3xl border-2 border-[#AD7B3B] bg-gradient-to-b from-card via-card to-amber-500/5 shadow-2xl p-6 sm:p-10 relative overflow-hidden"
        >
          {/* Badge Topo */}
          <div className="absolute top-0 right-0 bg-[#AD7B3B] text-white text-xs font-bold uppercase tracking-wider px-6 py-1.5 rounded-bl-2xl shadow-sm flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" />
            {lifetimeSettings.badge}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#AD7B3B] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
                Oferta Especial de Lançamento • Vagas Limitadas
              </span>
              <h3 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
                {lifetimeSettings.headline}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                {lifetimeSettings.description}
              </p>
            </div>

            {/* Preço e Gatilho de Escassez */}
            <div className="p-6 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs text-muted-foreground block">Pagamento Único à Vista:</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-sm font-medium text-muted-foreground">R$</span>
                  <span className="text-4xl sm:text-5xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5]">
                    {new Intl.NumberFormat('pt-BR').format(lifetimeSettings.price_cash)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full ml-2">
                    Economia de R$ 18.000+
                  </span>
                </div>
                <span className="text-xs text-muted-foreground block">
                  Ou em até 12x de <strong>R$ {lifetimeSettings.price_installments}</strong> no cartão
                </span>
              </div>

              {/* Contador de vagas */}
              <div className="bg-background p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 text-center sm:text-right shrink-0">
                <span className="text-xs text-muted-foreground block mb-1">Status das Vagas:</span>
                <div className="text-2xl font-bold text-[#AD7B3B]">
                  {Math.max(0, lifetimeSettings.spots_total - lifetimeSettings.spots_taken)} de {lifetimeSettings.spots_total}
                </div>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold block">
                  vagas restantes no lote atual
                </span>
              </div>
            </div>

            {/* Comparativo de Custo */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-foreground/90 space-y-1.5">
              <strong className="text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Por que a Licença Vitalícia é o melhor investimento para sua imobiliária?
              </strong>
              <p className="text-muted-foreground leading-relaxed">
                Em sistemas comuns de mensalidade recorrente (R$ 600/mês), você gasta <strong>R$ 21.600</strong> em 3 anos e o sistema nunca é seu. Com o Domus Vitalício, você investe uma única vez e garante o sistema para sempre.
              </p>
            </div>

            {/* O que está incluso */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Tudo o que sua imobiliária precisa sem travas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-foreground/90">
                {[
                  'Imóveis e contratos ilimitados',
                  'Usuários e corretores ilimitados',
                  'Portal do Inquilino e Proprietário com código OTP',
                  'Assinatura Eletrônica de Contratos com validade jurídica',
                  'Feed XML integrado para ZAP, VivaReal, OLX e Chaves na Mão',
                  'DRE Financeiro Gerencial consolidado',
                  'Vitrine pública de imóveis com subdomínio próprio',
                  '1 ano de hospedagem em nuvem e suporte técnico VIP inclusos',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nota de Manutenção a partir do 2º ano */}
            <p className="text-[11px] text-muted-foreground border-t border-border pt-4">
              * O 1º ano de infraestrutura de nuvem, backup e suporte está 100% incluso. A partir do 2º ano, manutenção e hospedagem opcional de apenas R$ {lifetimeSettings.annual_maintenance}/ano (menos de R$ 41/mês).
            </p>

            {/* CTA */}
            <div className="pt-2">
              <Button
                onClick={() => onSelectPlan('Vitalício')}
                className="w-full h-12 text-base font-bold bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white rounded-xl shadow-lg gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                Garantir Licença Vitalícia (Sem Mensalidade)
              </Button>
              <p className="text-center text-[11px] text-muted-foreground mt-2">
                Ativação imediata • Implantação e migração assistida
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* GRID DE PLANOS MENSAIS E ANUAIS TRADICIONAIS */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {mergedPlans.map((p, idx) => {
              const currentPrice = billingCycle === 'annual' ? p.priceAnnualMonthly : p.priceMonthly
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.1 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`group rounded-2xl flex flex-col justify-between transition-all duration-300 relative ${
                    p.popular
                      ? 'border-2 border-[#AD7B3B] bg-card shadow-xl ring-2 ring-[#AD7B3B]/20 scale-[1.02] z-10'
                      : 'border border-border bg-card/80 shadow-sm hover:shadow-lg'
                  } p-6 sm:p-8`}
                >
                  {p.popular && (
                    <>
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B] text-white flex items-center gap-1.5 shadow-md">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{p.badge}</span>
                      </div>

                      {/* Faixa revelada no hover solicitada pelo cliente */}
                      <div className="overflow-hidden max-h-0 group-hover:max-h-12 transition-all duration-300 ease-in-out -mt-2 mb-2">
                        <div className="py-1 px-2.5 rounded-lg bg-[#AD7B3B]/15 border border-[#AD7B3B]/40 text-center">
                          <span className="text-[11px] font-bold text-[#AD7B3B] tracking-wider uppercase flex items-center justify-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Melhor Custo-Benefício da Categoria
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5]">
                        {p.name}
                      </h4>
                      {p.badge && !p.popular && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#17323D]/10 text-[#17323D] dark:text-[#AD7B3B]">
                          {p.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 min-h-[34px] leading-relaxed">
                      {p.description}
                    </p>

                    {/* Preço com AnimatePresence no número */}
                    <div className="my-6 pb-6 border-b border-border">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-medium text-muted-foreground">R$</span>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={currentPrice}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className="text-4xl sm:text-5xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5]"
                          >
                            {currentPrice}
                          </motion.span>
                        </AnimatePresence>
                        <span className="text-xs text-muted-foreground font-normal">/ mês</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-1">
                        {billingCycle === 'annual' ? 'Cobrado anualmente em 12 parcelas' : 'Cobrança mensal, cancele quando desejar'}
                      </span>
                    </div>

                    {/* Recursos inclusos */}
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                        O que está incluso:
                      </span>
                      <ul className="space-y-2.5 text-xs text-muted-foreground">
                        {p.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-foreground/90 leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <div className="pt-8">
                    <Button
                      onClick={() => onSelectPlan(p.name)}
                      className={`w-full h-11 font-medium cursor-pointer shadow-sm rounded-xl transition-all ${
                        p.popular
                          ? 'bg-[#17323D] hover:bg-[#17323D]/90 text-white'
                          : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                      }`}
                    >
                      {p.ctaText}
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mt-2">
                      <Clock className="w-3 h-3 text-[#AD7B3B]" />
                      <span>3 dias de teste com dados reais</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* CALLOUT BANNER DA LICENÇA VITALÍCIA (QUANDO ESTIVER NA VISÃO MENSAL/ANUAL) */}
          {lifetimeSettings.active && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-10 p-6 rounded-2xl border-2 border-dashed border-[#AD7B3B]/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-[#AD7B3B]/10 text-[#AD7B3B] rounded-xl flex-shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
                    Prefere ter o sistema sem pagar mensalidade todo mês?
                    <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-[#AD7B3B] text-white">
                      Lote Fundador
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adquira a <strong>Licença Vitalícia Definitiva</strong> em pagamento único de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lifetimeSettings.price_cash)} (ou 12x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lifetimeSettings.price_installments)}) e economize mais de R$ 18.000 em 3 anos.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setBillingCycle('lifetime')}
                className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white text-xs font-semibold h-10 px-5 shrink-0 shadow-sm gap-2 cursor-pointer"
              >
                <span>Conhecer Licença Vitalícia</span>
                <Sparkles className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
