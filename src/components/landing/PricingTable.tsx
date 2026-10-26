import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, 
  Sparkles, 
  Clock, 
  Crown, 
  ShieldCheck, 
  Flame,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLifetimeSettings, type LifetimeSettings, DEFAULT_LIFETIME_SETTINGS } from '@/lib/lifetimeSettings'

interface PricingTableProps {
  onSelectPlan: (planName: string) => void
}

export interface PlanItem {
  id: string
  name: string
  badge: string | null
  description: string
  priceMonthly: number
  priceAnnualMonthly: number
  features: string[]
  notIncluded: string[]
  ctaText: string
  popular: boolean
}

export const DOMUS_IMOB_PLANS: PlanItem[] = [
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Até 35 Imóveis',
    description: 'Para corretores autônomos e imobiliárias boutique com até 35 contratos de locação.',
    priceMonthly: 99.90,
    priceAnnualMonthly: 89.90,
    features: [
      'Gestão de até 35 contratos de locação ativos',
      'Cobrança automática com chave PIX e boleto bancário',
      'Subdomínio vitrine próprio (suaempresa.gestaodomus.com.br)',
      'Cadastro de imóveis com fotos e fichas técnicas',
      'Gestão cadastral de inquilinos e proprietários',
      'Até 2 usuários da equipe com login próprio',
      'Suporte por chamado em horário comercial',
    ],
    notIncluded: [
      'Portal do inquilino com 2ª via sem senha',
      'CRM com radar inteligente de clientes e imóveis',
      'Vistoria fotográfica com laudo digital em PDF',
    ],
    ctaText: 'Testar Starter (3 dias)',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Profissional',
    badge: 'Mais Escolhido',
    description: 'Gestão imobiliária completa para fechar repasses no prazo e eliminar atendimentos repetitivos.',
    priceMonthly: 299.90,
    priceAnnualMonthly: 249.90,
    features: [
      'Tudo do plano Starter',
      'Até 150 contratos e imóveis ativos na carteira',
      'Portal do Inquilino e Proprietário com login OTP sem senha',
      'Fechamento e repasses PIX aos proprietários com 1 clique',
      'Régua de cobrança automática 3 dias antes do vencimento',
      'CRM com funil de atendimento e radar de imóveis',
      'Vistorias de entrada e saída com fotos e laudo em PDF',
      'Reajustes anuais automáticos por IPCA e IGP-M',
      'Até 6 usuários da equipe com controle de permissões',
      'Suporte prioritário via WhatsApp',
    ],
    notIncluded: [
      'Domínio personalizado próprio (.com.br exclusivo)',
      'Migração de banco de dados assistida',
    ],
    ctaText: 'Testar Profissional (3 dias)',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Sem Limites',
    description: 'Para grandes administradoras e redes com alto volume de locações e corretores em campo.',
    priceMonthly: 599.90,
    priceAnnualMonthly: 549.90,
    features: [
      'Imóveis, contratos e locações ILIMITADOS',
      'Usuários, corretores e operadores ilimitados',
      'Configuração de domínio próprio exclusivo (ex: www.suaimobiliaria.com.br)',
      'Importação assistida de dados e contratos antigos',
      'Treinamento prático e dedicado para toda a equipe',
      'Logs de auditoria e segurança avançada',
      'Canal de suporte direto com equipe técnica VIP',
    ],
    notIncluded: [],
    ctaText: 'Falar com Especialista',
    popular: false,
  },
]

export function PricingTable({ onSelectPlan }: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'lifetime'>('annual')
  const [lifetimeSettings, setLifetimeSettings] = useState<LifetimeSettings>(DEFAULT_LIFETIME_SETTINGS)

  useEffect(() => {
    async function loadSettings() {
      try {
        const lifetime = await getLifetimeSettings()
        setLifetimeSettings(lifetime)
      } catch {
        // Fallback silencioso
      }
    }
    loadSettings()
  }, [])

  return (
    <div className="w-full space-y-8">
      {/* SELETOR DE CICLO: MENSAL / ANUAL / VITALÍCIO */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
            <span className="relative z-10">Mensal sem fidelidade</span>
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
                  className="absolute inset-0 bg-[#AD7B3B] rounded-lg shadow-xs"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <Crown className="w-3.5 h-3.5 relative z-10 text-amber-300" />
              <span className="relative z-10 font-bold">Licença Vitalícia (Sem Mensalidade)</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTEÚDO DOS PLANOS */}
      {billingCycle === 'lifetime' && lifetimeSettings.active ? (
        /* CARD EXCLUSIVO DE LICENÇA VITALÍCIA */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto rounded-3xl border-2 border-[#AD7B3B] bg-gradient-to-b from-card via-card to-amber-50/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-[#AD7B3B] text-white flex items-center gap-1 shadow-sm">
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
                Domus Imobiliária Vitalício
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Tenha o Domus na sua imobiliária para sempre. Sem mensalidades, sem travas por quantidade de imóveis e com posse definitiva do sistema.
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
                Em softwares tradicionais com mensalidades que sobem todo ano, você gasta mais de <strong>R$ 20.000</strong> em 3 anos e o sistema nunca é seu. Com o Domus Vitalício, você investe uma única vez e garante a operação completa da sua imobiliária sem custos mensais recorrentes.
              </p>
            </div>

            {/* O que está incluso */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Tudo o que sua imobiliária precisa sem travas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-foreground/90">
                {[
                  'Acesso Vitalício Completo ao Domus Imobiliária',
                  'Gestão de locações, contratos e vendas sem limites',
                  'Portal do Inquilino e Proprietário com código OTP',
                  'Régua de cobrança automática por PIX e boleto',
                  'Fechamento e repasses PIX aos proprietários com extrato',
                  'Vistorias fotográficas com geração de laudos em PDF',
                  'CRM imobiliário com radar de clientes e imóveis',
                  '1 ano de infraestrutura em nuvem e suporte técnico VIP inclusos',
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
            {DOMUS_IMOB_PLANS.map((p, idx) => {
              const currentPrice = billingCycle === 'annual' ? p.priceAnnualMonthly : p.priceMonthly
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.1 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`group rounded-2xl flex flex-col justify-between transition-all duration-300 relative ${
                    p.popular
                      ? 'border-2 border-[#AD7B3B] bg-card shadow-xl ring-2 ring-[#AD7B3B]/20 scale-[1.02] z-10'
                      : 'border border-border bg-card/80 shadow-sm hover:shadow-lg'
                  } p-6 sm:p-8`}
                >
                  {p.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B] text-white flex items-center gap-1.5 shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{p.badge}</span>
                    </div>
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
                        <span className="text-xs text-muted-foreground font-normal">
                          / mês
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-1">
                        {billingCycle === 'annual'
                          ? 'Cobrado anualmente em 12 parcelas'
                          : 'Cobrança mensal, cancele quando desejar'}
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
                      <span>3 dias de teste com dados reais liberados</span>
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
                    Prefere ter o sistema da sua imobiliária sem pagar mensalidade todo mês?
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
