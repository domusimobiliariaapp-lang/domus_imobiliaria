import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, 
  Sparkles, 
  Clock, 
  Crown, 
  ShieldCheck, 
  Flame,
  Building2,
  Landmark,
  HardHat,
  Sun,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLifetimeSettings, type LifetimeSettings, DEFAULT_LIFETIME_SETTINGS } from '@/lib/lifetimeSettings'

export type PlanCategory = 'all' | 'imob' | 'financeiro' | 'obras' | 'solar'

interface PricingTableProps {
  onSelectPlan: (planName: string) => void
}

interface PlanItem {
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

export function PricingTable({ onSelectPlan }: PricingTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory>('all')
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

  // Catálogo Completo de Planos por Especialidade e Suíte Unificada
  const PLANS_BY_CATEGORY: Record<PlanCategory, PlanItem[]> = {
    // 1. SUÍTE COMPLETA UNIFICADA (TODOS OS 4 SISTEMAS)
    all: [
      {
        id: 'all_starter',
        name: 'Starter All-in-One',
        badge: 'Suíte Unificada',
        description: 'Acesso unificado aos 4 sistemas Domus para pequenas empresas e corretores (até 35 contratos/obras).',
        priceMonthly: 229,
        priceAnnualMonthly: 189,
        features: [
          'Suíte Unificada Completa (4 Sistemas Integrados)',
          '1. Gestão Imobiliária (até 35 imóveis e contratos)',
          '2. Domus Finanças ERP (Contas a pagar/receber e conciliação)',
          '3. Engenharia & Obras (Projetos e RDO Digital)',
          '4. Energia Solar (Funil de homologação fotovoltaica)',
          'Subdomínio próprio (suaempresa.domus.com.br)',
          'Emissão de cobrança PIX/Boleto automática',
          'Até 2 usuários com login próprio',
          'Suporte por chamado em horário comercial',
        ],
        notIncluded: [
          'Portal do inquilino com 2ª via sem senha',
          'Pipeline Kanban de leads e visitas',
          'Vistoria fotográfica com laudo digital',
        ],
        ctaText: 'Testar Suíte Unificada (3 dias)',
        popular: false,
      },
      {
        id: 'all_pro',
        name: 'Profissional All-in-One',
        badge: 'Mais Escolhido • 4 em 1',
        description: 'Potência máxima para empresas com carteira ativa que exigem automação financeira, obras e solar.',
        priceMonthly: 459,
        priceAnnualMonthly: 379,
        features: [
          'Suíte Unificada Completa (4 Sistemas Integrados)',
          '1. Gestão Imobiliária (até 150 imóveis e contratos)',
          '2. Domus Finanças ERP Pro ilimitado com conciliação OFX',
          '3. Engenharia & Obras com controle físico-financeiro',
          '4. Energia Solar com esteira de homologação de usinas',
          'Portal do Inquilino e Proprietário (acesso por código OTP)',
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
        id: 'all_enterprise',
        name: 'Enterprise All-in-One',
        badge: 'Sem Limites • Corporativo',
        description: 'Para grandes administradoras, construtoras e integradores com múltiplos projetos e equipes.',
        priceMonthly: 829,
        priceAnnualMonthly: 690,
        features: [
          'Suíte Unificada Completa sem Limites (4 Sistemas)',
          'Imóveis, contratos, obras e usinas solares ILIMITADOS',
          'Usuários, corretores e engenheiros ilimitados',
          'Domus Finanças ERP Multi-Empresas e filiais',
          'Engenharia Avançada com medições e cronogramas físicos',
          'Módulo Solar Completo com gestão de integradores parceiros',
          'Configuração de domínio próprio (ex: www.suaempresa.com.br)',
          'Importação assistida de dados e contratos antigos',
          'Treinamento prático da equipe com especialista',
          'Auditoria e log de ações no sistema',
          'Canal de suporte direto com a equipe técnica VIP',
        ],
        notIncluded: [],
        ctaText: 'Falar com Especialista',
        popular: false,
      },
    ],

    // 2. DOMUS FINANÇAS ERP (AVULSO)
    financeiro: [
      {
        id: 'fin_starter',
        name: 'Finanças Starter',
        badge: 'Pequenas Empresas',
        description: 'Controle financeiro essencial, contas a pagar/receber e fluxo de caixa diário.',
        priceMonthly: 79,
        priceAnnualMonthly: 59,
        features: [
          'Domus Finanças ERP Independente',
          'Até 500 títulos lançados por mês',
          'Contas a Pagar & Receber com régua de vencimentos',
          'Fluxo de Caixa Diário e Mensal consolidado',
          'DRE Gerencial simplificado em 1 clique',
          'Até 2 usuários financeiros com acesso',
          'Cobrança com Chave PIX e envio para WhatsApp',
        ],
        notIncluded: [
          'Importação de Extrato Bancário (.OFX)',
          'Conciliação bancária automática com 1 clique',
          'Múltiplas filiais e centros de custo',
        ],
        ctaText: 'Testar Finanças Starter',
        popular: false,
      },
      {
        id: 'fin_pro',
        name: 'Finanças Pro',
        badge: 'Mais Popular ERP',
        description: 'Automação bancária completa com leitura de OFX, conciliação e múltiplos bancos.',
        priceMonthly: 149,
        priceAnnualMonthly: 119,
        features: [
          'Domus Finanças ERP Pro Ilimitado',
          'Títulos e lançamentos financeiros ilimitados',
          'Leitura e importação de extratos (.OFX) de qualquer banco',
          'Conciliação bancária inteligente em 1 clique',
          'DRE Contábil e Financeiro completo para contabilidade',
          'Controle de caixas físicos e múltiplas contas bancárias',
          'Até 6 usuários da equipe com permissões restritas',
          'Suporte prioritário via WhatsApp',
        ],
        notIncluded: [
          'Módulo multi-empresas e filiais corporativas',
        ],
        ctaText: 'Testar Finanças Pro',
        popular: true,
      },
      {
        id: 'fin_vitalicio',
        name: 'Finanças Vitalício',
        badge: 'Pagamento Único • Sem Mensalidade',
        description: 'Tenha o Domus Finanças ERP para sempre sem nunca mais pagar mensalidade.',
        priceMonthly: 697, // Representa o pagamento único
        priceAnnualMonthly: 697,
        features: [
          'Posse Vitalícia Definitiva do Domus Finanças ERP',
          '100% Livre de Mensalidades para sempre',
          'Tudo do Plano Finanças Pro incluso',
          'Lançamentos, títulos e relatórios ilimitados',
          'Conciliação Bancária OFX e DRE completo',
          '1 ano de hospedagem e atualizações inclusas',
          'No PIX com 10% OFF por R$ 627,30 à vista (ou 12x no cartão)',
          'Garantia incondicional de 30 dias',
        ],
        notIncluded: [],
        ctaText: 'Garantir Licença Vitalícia',
        popular: false,
      },
    ],

    // 3. ENGENHARIA & OBRAS (AVULSO)
    obras: [
      {
        id: 'obras_starter',
        name: 'Construtor Starter',
        badge: 'Empreiteiros & Obras',
        description: 'Ideal para engenheiros autônomos e pequenas construtoras com até 3 obras simultâneas.',
        priceMonthly: 119,
        priceAnnualMonthly: 95,
        features: [
          'Módulo Engenharia & Obras',
          'Até 3 obras ativas na carteira',
          'RDO Digital (Relatório Diário de Obra com fotos)',
          'Registro de efetivo diário e condições climáticas',
          'Controle de orçamento previsto vs executado',
          'Até 3 usuários (engenheiros e mestres de obras)',
          'Exportação de relatórios em PDF para clientes',
        ],
        notIncluded: [
          'Medições físicas avançadas por etapa',
          'Cronograma de Gantt físico-financeiro',
        ],
        ctaText: 'Testar Construtor Starter',
        popular: false,
      },
      {
        id: 'obras_pro',
        name: 'Construtor Pro',
        badge: 'Mais Escolhido Obras',
        description: 'Controle de canteiro profissional com medições, cronograma físico e múltiplos canteiros.',
        priceMonthly: 249,
        priceAnnualMonthly: 199,
        features: [
          'Módulo Engenharia & Obras Pro',
          'Até 15 obras e empreendimentos simultâneos',
          'RDO Digital Ilimitado com armazenamento de fotos na nuvem',
          'Medições de avanço físico por etapa da construção',
          'Cronograma físico-financeiro interativo',
          'Até 10 usuários com níveis de acesso de canteiro',
          'Acompanhamento de compras de insumos e cotações',
          'Suporte prioritário via WhatsApp',
        ],
        notIncluded: [
          'Almoxarifado centralizado multi-obras',
        ],
        ctaText: 'Testar Construtor Pro',
        popular: true,
      },
      {
        id: 'obras_enterprise',
        name: 'Construtor Enterprise',
        badge: 'Grandes Construtoras',
        description: 'Para construtoras, incorporadoras e gestoras de grandes empreendimentos.',
        priceMonthly: 490,
        priceAnnualMonthly: 390,
        features: [
          'Obras e contratos de construção ILIMITADOS',
          'Usuários, mestres e engenheiros ilimitados',
          'Gestão de compras, fornecedores e almoxarifado de canteiro',
          'Medições com curva S e avanço físico integrado ao financeiro',
          'Diários de obra com assinatura digital do responsável técnico',
          'Treinamento da equipe de campo com especialista',
        ],
        notIncluded: [],
        ctaText: 'Falar com Especialista',
        popular: false,
      },
    ],

    // 4. ENERGIA SOLAR (AVULSO)
    solar: [
      {
        id: 'solar_starter',
        name: 'Integrador Starter',
        badge: 'Instaladores Solares',
        description: 'Controle de esteira de homologação para integradores com até 10 usinas ativas.',
        priceMonthly: 119,
        priceAnnualMonthly: 95,
        features: [
          'Módulo Energia Solar Integrado',
          'Até 10 usinas e projetos ativos no funil',
          'Kanban de etapas (Documentação, Homologação, Vistoria e Conexão)',
          'Acompanhamento por distribuidora de energia (Enel, CPFL, Cemig, etc.)',
          'Cálculo de potência instalada total (kWp)',
          'Até 3 usuários técnicos da equipe',
        ],
        notIncluded: [
          'Gerador de propostas comerciais automáticas',
          'Gestão de parceiros e vendedores externos',
        ],
        ctaText: 'Testar Integrador Solar',
        popular: false,
      },
      {
        id: 'solar_pro',
        name: 'Solar Pro',
        badge: 'Mais Escolhido Solar',
        description: 'Funil acelerado para empresas de energia solar com até 50 projetos fotovoltaicos ativos.',
        priceMonthly: 249,
        priceAnnualMonthly: 199,
        features: [
          'Módulo Energia Solar Pro',
          'Até 50 usinas e projetos solares simultâneos',
          'Simulação de geração estimada e kits de inversores/painéis',
          'Kanban técnico completo com histórico de trocas de medidor',
          'Alertas de prazos de concessionárias para evitar atrasos',
          'Até 10 usuários e técnicos credenciados',
          'Suporte prioritário via WhatsApp',
        ],
        notIncluded: [
          'Projetos ilimitados para grandes franquias',
        ],
        ctaText: 'Testar Solar Pro',
        popular: true,
      },
      {
        id: 'solar_enterprise',
        name: 'Solar Enterprise',
        badge: 'Grandes Integradores',
        description: 'Para franquias, grandes instaladoras e cooperativas de geração distribuída.',
        priceMonthly: 490,
        priceAnnualMonthly: 390,
        features: [
          'Projetos fotovoltaicos e usinas ILIMITADAS',
          'Usuários, instaladores e parceiros comerciais ilimitados',
          'Gestão multi-distribuidoras em todo o território nacional',
          'Controle de pós-venda, garantias e O&M (Operação e Manutenção)',
          'Canal de suporte direto com a equipe técnica',
        ],
        notIncluded: [],
        ctaText: 'Falar com Especialista',
        popular: false,
      },
    ],

    // 5. IMOBILIÁRIA & LOCAÇÕES (AVULSO)
    imob: [
      {
        id: 'imob_starter',
        name: 'Imobiliária Starter',
        badge: 'Corretores Autônomos',
        description: 'Gestão completa de contratos e repasses para carteiras com até 35 imóveis de aluguel.',
        priceMonthly: 149,
        priceAnnualMonthly: 119,
        features: [
          'Módulo Imobiliário & Locações',
          'Até 35 imóveis na carteira de locação',
          'Controle de contratos, vencimentos e reajustes',
          'Subdomínio vitrine próprio (suaempresa.domus.com.br)',
          'Emissão de cobrança e conciliação',
          'Até 2 usuários da equipe com login próprio',
        ],
        notIncluded: [
          'Portal do inquilino com 2ª via sem senha',
          'CRM com radar de imóveis e visitas',
          'Vistorias fotográficas com laudo digital',
        ],
        ctaText: 'Testar Imobiliária Starter',
        popular: false,
      },
      {
        id: 'imob_pro',
        name: 'Imobiliária Pro',
        badge: 'Mais Escolhido Imob',
        description: 'Para imobiliárias com carteira ativa que precisam fechar repasses PIX sem atraso.',
        priceMonthly: 299,
        priceAnnualMonthly: 249,
        features: [
          'Módulo Imobiliário Pro',
          'Até 150 imóveis e contratos na carteira',
          'Portal do Inquilino e Proprietário com acesso via código OTP',
          'CRM com funil de atendimento e radar de imóveis',
          'Vistoria de entrada e saída com fotos na nuvem',
          'Cálculo e lote de repasses PIX aos proprietários',
          'Reajustes automáticos por IPCA e IGP-M',
          'Até 6 usuários com permissões separadas',
        ],
        notIncluded: [
          'Domínio personalizado próprio (.com.br exclusivo)',
        ],
        ctaText: 'Testar Imobiliária Pro',
        popular: true,
      },
      {
        id: 'imob_enterprise',
        name: 'Imobiliária Enterprise',
        badge: 'Grandes Administradoras',
        description: 'Para administradoras com grandes carteiras e múltiplos corretores em campo.',
        priceMonthly: 590,
        priceAnnualMonthly: 490,
        features: [
          'Imóveis e contratos de locação ILIMITADOS',
          'Usuários e corretores ilimitados',
          'Configuração de domínio próprio (.com.br exclusivo)',
          'Importação assistida de contratos antigos',
          'Auditoria e log de ações no sistema',
          'Suporte direto com equipe técnica VIP',
        ],
        notIncluded: [],
        ctaText: 'Falar com Especialista',
        popular: false,
      },
    ],
  }

  const currentPlans = PLANS_BY_CATEGORY[selectedCategory] || PLANS_BY_CATEGORY.all

  const CATEGORIES = [
    { 
      id: 'all' as PlanCategory, 
      label: 'Suíte Unificada (4 em 1)', 
      icon: Sparkles, 
      highlight: true,
      badge: 'Mais Vendido' 
    },
    { 
      id: 'imob' as PlanCategory, 
      label: 'Imobiliária & Locações', 
      icon: Building2 
    },
    { 
      id: 'financeiro' as PlanCategory, 
      label: 'Domus Finanças ERP', 
      icon: Landmark 
    },
    { 
      id: 'obras' as PlanCategory, 
      label: 'Engenharia & Obras', 
      icon: HardHat 
    },
    { 
      id: 'solar' as PlanCategory, 
      label: 'Energia Solar', 
      icon: Sun 
    },
  ]

  return (
    <div className="w-full space-y-8">
      {/* 1. SELETOR DE CATEGORIA / MÓDULO DESEJADO */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Escolha o tipo de solução ideal para sua empresa:
        </span>
        <div className="inline-flex flex-wrap items-center justify-center p-1.5 rounded-2xl bg-card border border-border shadow-xs gap-1.5 max-w-full">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? cat.highlight 
                      ? 'bg-[#17323D] text-[#C5A880] shadow-sm'
                      : 'bg-[#17323D] text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected && cat.highlight ? 'text-[#C5A880]' : ''}`} />
                <span>{cat.label}</span>
                {cat.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    isSelected ? 'bg-[#C5A880] text-[#17323D]' : 'bg-amber-500/15 text-amber-600'
                  }`}>
                    {cat.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* BANNER PERSUASIVO SE ESTIVER VENDO PLANO AVULSO */}
      {selectedCategory !== 'all' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto p-4 rounded-xl bg-gradient-to-r from-[#17323D]/10 via-[#C5A880]/15 to-transparent border border-[#C5A880]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#17323D] text-[#C5A880] rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-foreground font-bold">Dica de Economia:</strong>{' '}
              <span className="text-muted-foreground">
                Se você precisa de mais de um sistema, a <strong>Suíte Unificada All-in-One</strong> inclui Imobiliária + Finanças ERP + Engenharia + Solar com até <strong>65% de desconto</strong>.
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-xs font-bold text-[#17323D] dark:text-[#C5A880] hover:underline flex items-center gap-1 shrink-0"
          >
            Ver Suíte Unificada <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* 2. SELETOR DE CICLO: MENSAL / ANUAL / VITALÍCIO */}
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

      {/* 3. CONTEÚDO DOS PLANOS: OU VITALÍCIO OU GRID CONFORME SELEÇÃO */}
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
                Por que a Licença Vitalícia é o melhor investimento para o seu negócio?
              </strong>
              <p className="text-muted-foreground leading-relaxed">
                Em sistemas comuns de mensalidade recorrente (R$ 600/mês), você gasta <strong>R$ 21.600</strong> em 3 anos e o sistema nunca é seu. Com o Domus Vitalício, você investe uma única vez e garante os sistemas para sempre.
              </p>
            </div>

            {/* O que está incluso */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Tudo o que sua empresa precisa sem travas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-foreground/90">
                {[
                  'Acesso Vitalício aos 4 Sistemas Integrados',
                  'Gestão Imobiliária & Locações completa ilimitada',
                  'Domus Finanças ERP Pro com DRE e conciliação',
                  'Engenharia & Obras (Projetos e RDO Digital)',
                  'Energia Solar (Homologação de usinas fotovoltaicas)',
                  'Imóveis, contratos, obras e usinas ilimitados',
                  'Usuários, corretores e engenheiros ilimitados',
                  'Portal do Inquilino e Proprietário com código OTP',
                  'Assinatura Eletrônica de Contratos com validade jurídica',
                  'Feed XML integrado para portais imobiliários',
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
        /* GRID DE PLANOS MENSAIS E ANUAIS TRADICIONAIS DO SEGMENTO SELECIONADO */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {currentPlans.map((p, idx) => {
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
                        <span className="text-xs text-muted-foreground font-normal">
                          {p.id === 'fin_vitalicio' ? ' (pagamento único)' : '/ mês'}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-1">
                        {p.id === 'fin_vitalicio'
                          ? 'Acesso perpétuo sem mensalidades'
                          : billingCycle === 'annual'
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
                    Prefere ter a Suíte Completa sem pagar mensalidade todo mês?
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
