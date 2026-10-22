import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  Zap,
  Globe2,
  CheckCircle2,
  ArrowRight,
  Users,
  FileCheck,
  CreditCard,
  MessageSquare,
  KeyRound,
  FileSpreadsheet,
  Clock,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NumberTicker } from '@/components/ui/NumberTicker'
import { LiveScreenShowcase } from '@/components/landing/LiveScreenShowcase'
import { SolutionsCatalog } from '@/components/landing/SolutionsCatalog'
import { PricingTable } from '@/components/landing/PricingTable'
import { RoiCalculator } from '@/components/landing/RoiCalculator'
import { FaqSection } from '@/components/landing/FaqSection'
import { TrialModal } from '@/components/landing/TrialModal'
import { HeroAnimatedBackground } from '@/components/landing/HeroAnimatedBackground'
import { DomusLogo } from '@/components/brand/DomusLogo'

export function LandingPage() {
  const [isTrialOpen, setIsTrialOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('Profissional')
  const [selectedModule, setSelectedModule] = useState('Imobiliária & Locações')

  const openTrial = (planName = 'Profissional', moduleName = 'Imobiliária & Locações') => {
    setSelectedPlan(planName)
    setSelectedModule(moduleName)
    setIsTrialOpen(true)
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#EEECE5] dark:bg-[#0E1E24] text-foreground font-sans selection:bg-[#AD7B3B]/20 selection:text-[#AD7B3B]">
      {/* NAVBAR COM ENTRADA SUAVE */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#EEECE5]/90 dark:bg-[#0E1E24]/90 border-b border-[#D4D0C8] dark:border-[#2D4A51]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo Domus Premium */}
          <Link to="/">
            <DomusLogo size="md" />
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <button
              onClick={() => scrollToSection('solutions')}
              className="hover:text-foreground transition-colors cursor-pointer text-[#AD7B3B] font-semibold"
            >
              Soluções
            </button>
            <button
              onClick={() => scrollToSection('showcase')}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Telas do Sistema
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              O que faz
            </button>
            <button
              onClick={() => scrollToSection('subdomain-section')}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Subdomínio Próprio
            </button>
            <button
              onClick={() => scrollToSection('roi')}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Simulador
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Planos
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Dúvidas
            </button>
          </nav>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-medium text-[#17323D] dark:text-[#EEECE5] hover:text-[#AD7B3B] transition-colors px-3 py-2"
            >
              Entrar
            </Link>
            <Button
              onClick={() => openTrial('Profissional')}
              className="h-10 px-4 bg-[#17323D] hover:bg-[#17323D]/90 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs cursor-pointer"
            >
              <span>Testar 3 Dias</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* HERO SECTION HUMANO E DIRETO */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        {/* Fundo Animado Sofisticado com Malha Arquitetônica e Orbes Fluidos */}
        <HeroAnimatedBackground />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#17323D]/5 dark:bg-[#EEECE5]/10 text-[#17323D] dark:text-[#AD7B3B] border border-[#17323D]/10 dark:border-[#AD7B3B]/20 mb-6"
          >
            <Clock className="w-3.5 h-3.5 text-[#AD7B3B]" />
            <span>Feito para a rotina diária de quem administra aluguéis</span>
          </motion.div>

          {/* Título Principal deslopado */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5] tracking-tight max-w-4xl mx-auto leading-[1.18]"
          >
            Gestão de aluguéis, cobrança e repasses aos proprietários sem dor de cabeça no fim do mês.
          </motion.h1>

          {/* Subtítulo claro e concreto */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Você emite a cobrança, o inquilino paga por PIX ou boleto, o Domus desconta sua taxa de administração e o dinheiro do proprietário vai com comprovante pronto. Tudo no link da sua imobiliária (<span className="font-mono text-xs font-semibold text-foreground">suaempresa.domus.com.br</span>).
          </motion.p>

          {/* Botões do Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => openTrial('Profissional')}
              className="w-full sm:w-auto h-12 px-7 bg-[#17323D] hover:bg-[#17323D]/90 text-white font-medium text-sm sm:text-base rounded-xl shadow-lg shadow-[#17323D]/15 cursor-pointer"
            >
              <span>Começar Teste de 3 Dias Grátis</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => scrollToSection('showcase')}
              className="w-full sm:w-auto h-12 px-7 bg-card/80 hover:bg-card text-foreground font-medium text-sm sm:text-base rounded-xl border border-border cursor-pointer"
            >
              <span>Ver Telas do Sistema</span>
            </Button>
          </motion.div>

          {/* Selos de segurança */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sem pedir cartão de crédito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>3 dias com dados de teste liberados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Banco de dados isolado por empresa</span>
            </div>
          </motion.div>

          {/* BARRA DE IMPACTO COM NUMBER TICKERS VIVOS */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#12232B]/80 backdrop-blur-md border border-[#D4D0C8] dark:border-[#2D4A51] shadow-lg text-left"
          >
            <div className="p-2 border-r border-[#D4D0C8]/60 dark:border-[#2D4A51]/60 last:border-r-0">
              <span className="text-[11px] text-muted-foreground block font-medium">Aluguéis Geridos</span>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5] mt-1">
                <NumberTicker value={14.8} prefix="R$ " suffix="M+" decimals={1} />
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Zero atrito de repasse</span>
            </div>

            <div className="p-2 border-r border-[#D4D0C8]/60 dark:border-[#2D4A51]/60 last:border-r-0">
              <span className="text-[11px] text-muted-foreground block font-medium">Taxa de Adimplência</span>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#AD7B3B] mt-1">
                <NumberTicker value={98.6} suffix="%" decimals={1} />
              </div>
              <span className="text-[10px] text-muted-foreground block mt-0.5">com régua automática</span>
            </div>

            <div className="p-2 border-r border-[#D4D0C8]/60 dark:border-[#2D4A51]/60 last:border-r-0">
              <span className="text-[11px] text-muted-foreground block font-medium">Tempo de Repasse</span>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5] mt-1">
                <span>1 clique</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">PIX em lote automático</span>
            </div>

            <div className="p-2">
              <span className="text-[11px] text-muted-foreground block font-medium">Assinatura Digital</span>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#AD7B3B] mt-1">
                <span>&lt; 3 min</span>
              </div>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Validade jurídica real</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATÁLOGO DE SOLUÇÕES POR SEGMENTO */}
      <SolutionsCatalog onSelectSolution={(solution) => openTrial('Profissional', solution)} />

      {/* SEÇÃO TOCANDO NA DOR DO CLIENTE (ANTES vs DEPOIS) */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-transparent via-[#17323D]/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60 mb-4">
              <span>Pare de perder tempo com processos manuais</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5] tracking-tight">
              A rotina que consome sua equipe vs. A facilidade com o Domus
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              O maior custo de uma imobiliária não é a tecnologia; é a quantidade de horas que corretores e administradores gastam apagando incêndios no WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* CARD ANTES (A DOR) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#12232B] border-2 border-red-200 dark:border-red-900/40 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 font-semibold text-sm mb-6 pb-4 border-b border-red-100 dark:border-red-900/30">
                <XCircle className="w-5 h-5 shrink-0" />
                <span>O que acontece na rotina tradicional (Excel e WhatsApp)</span>
              </div>

              <div className="space-y-5 text-xs sm:text-sm text-foreground/80">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">1</div>
                  <div>
                    <strong className="text-foreground block font-semibold">Cobrança manual e constrangedora:</strong>
                    <span className="text-muted-foreground">Sua equipe precisa lembrar quem pagou e mandar mensagem cobrando um a um no WhatsApp.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">2</div>
                  <div>
                    <strong className="text-foreground block font-semibold">Repasse demorado e estressante no dia 10:</strong>
                    <span className="text-muted-foreground">Proprietários ligam irritados cobrando comprovantes enquanto você digita transferências manualmente no internet banking.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">3</div>
                  <div>
                    <strong className="text-foreground block font-semibold">Interrupções constantes por 2ª via:</strong>
                    <span className="text-muted-foreground">Inquilinos perdem o boleto e a imobiliária vira uma central de atendimento para reenviar PDFs.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">4</div>
                  <div>
                    <strong className="text-foreground block font-semibold">Imóveis vagos gerando prejuízo:</strong>
                    <span className="text-muted-foreground">Leads dos portais chegam, esfriam porque o retorno demora horas e o imóvel continua gerando despesa ao proprietário.</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CARD DEPOIS (A SOLUÇÃO DOMUS) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="p-6 sm:p-8 rounded-3xl bg-[#17323D] text-[#EEECE5] border-2 border-[#AD7B3B] shadow-xl relative overflow-hidden"
            >
              <div className="flex items-center gap-2.5 text-[#AD7B3B] font-semibold text-sm mb-6 pb-4 border-b border-[#2D4A51]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Como fica sua imobiliária com o Domus</span>
              </div>

              <div className="space-y-5 text-xs sm:text-sm text-[#EEECE5]/90">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#AD7B3B]/20 text-[#AD7B3B] border border-[#AD7B3B]/40 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <div>
                    <strong className="text-white block font-semibold">Régua de cobrança automática:</strong>
                    <span className="text-white/70">O sistema avisa 3 dias antes com link e código PIX. Quem não pagou recebe lembrete educado no WhatsApp sem você mexer um dedo.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#AD7B3B]/20 text-[#AD7B3B] border border-[#AD7B3B]/40 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <div>
                    <strong className="text-white block font-semibold">Repasse em 1 clique com extrato automático:</strong>
                    <span className="text-white/70">A taxa de administração é descontada na hora e o comprovante com todos os lançamentos chega no WhatsApp do proprietário.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#AD7B3B]/20 text-[#AD7B3B] border border-[#AD7B3B]/40 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <div>
                    <strong className="text-white block font-semibold">Portal do Inquilino e Proprietário sem Senha:</strong>
                    <span className="text-white/70">O cliente digita o CPF e recebe código de 6 dígitos no celular. Ele mesmo pega a 2ª via ou informe de IRPF em segundos.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#AD7B3B]/20 text-[#AD7B3B] border border-[#AD7B3B]/40 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <div>
                    <strong className="text-white block font-semibold">Match inteligente de leads e vitrine própria:</strong>
                    <span className="text-white/70">Imóvel desocupado é cruzado imediatamente com clientes na lista de espera e os corretores recebem a notificação pronta para fechar.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#2D4A51] flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-white/70 font-medium">
                  Pronto para transformar sua operação?
                </span>
                <Button
                  onClick={() => openTrial('Profissional')}
                  className="w-full sm:w-auto h-10 px-5 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white font-medium text-xs rounded-xl cursor-pointer"
                >
                  <span>Experimentar por 3 Dias</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* APRESENTAÇÃO DE TELAS REAIS */}
      <section id="showcase" className="py-16 sm:py-24 bg-card/60 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5]">
              Como é usar o Domus no dia a dia
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Telas limpas com as informações que importam para o fechamento do dia: vencimentos, repasses e atendimento.
            </p>
          </div>

          <LiveScreenShowcase onOpenTrial={() => openTrial('Profissional')} />
        </div>
      </section>

      {/* SEÇÃO SUBDOMÍNIO PRÓPRIO */}
      <section id="subdomain-section" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl bg-[#17323D] text-[#EEECE5] p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-2xl border border-[#2D4A51]"
          >
            <div className="max-w-3xl relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#AD7B3B]/20 text-[#AD7B3B] border border-[#AD7B3B]/30">
                <Globe2 className="w-3.5 h-3.5" />
                <span>Link próprio para a sua empresa</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
                Seu site de imóveis e a área do cliente no endereço da sua imobiliária.
              </h2>

              <p className="text-sm sm:text-base text-muted/80 leading-relaxed">
                Você não precisa pagar hospedagem extra nem contratar programador. Assim que sua conta é criada, o Domus gera um link exclusivo para a sua marca.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-[#AD7B3B] font-mono text-xs font-semibold">
                    <Globe2 className="w-4 h-4" />
                    <span>suaempresa.domus.com.br/imoveis</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-2">Catálogo de Imóveis</h4>
                  <p className="text-xs text-muted/70 mt-1">
                    Divulgue links de imóveis no WhatsApp com fotos, mapa e botão que manda a conversa direto para o seu corretor.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-[#AD7B3B] font-mono text-xs font-semibold">
                    <KeyRound className="w-4 h-4" />
                    <span>suaempresa.domus.com.br/portal</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-2">Área do Cliente sem Senha</h4>
                  <p className="text-xs text-muted/70 mt-1">
                    Inquilinos pegam 2ª via do boleto e proprietários tiram informe de IRPF pelo celular com código de verificação.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  onClick={() => openTrial('Profissional')}
                  className="h-11 px-6 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white font-medium text-xs sm:text-sm cursor-pointer shadow-md rounded-xl"
                >
                  <span>Reservar o Nome da Minha Imobiliária</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <span className="text-xs text-muted/60">
                  3 dias de teste para ver como fica com seus dados.
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MATRIZ DE FUNCIONALIDADES DESLOPADA */}
      <section id="features" className="py-16 sm:py-24 bg-card/40 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#17323D]/10 text-[#17323D] dark:text-[#AD7B3B] mb-4">
              <Zap className="w-3.5 h-3.5" />
              <span>O que está incluso no sistema</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5]">
              As ferramentas que resolvem a rotina do aluguel
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Tudo integrado para você não precisar de uma ferramenta para contrato, outra para boleto e outra para atender clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#17323D]/10 text-[#17323D] dark:text-[#AD7B3B] flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-foreground">
                Contratos de Locação
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Acompanhe prazos de vigência, reajuste anual por IPCA/IGP-M e controle o tipo de garantia: caução, fiador ou seguro fiança.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#AD7B3B]/10 text-[#AD7B3B] flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-foreground">
                Cobrança e Repasse
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Boletos com código de barras e chave PIX Copia e Cola. O sistema calcula a taxa de administração e monta a lista de repasse aos proprietários.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-foreground">
                Funil de Atendimento de Leads
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Receba os contatos que chegam pelo site, organize as visitas agendadas e não perca propostas por demora no retorno.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-foreground">
                Dados Blindados no Banco
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Cada imobiliária tem seus dados protegidos no banco de dados. Outra imobiliária jamais visualiza seus contratos ou valores.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-foreground">
                Área do Inquilino Sem Senha
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Seu cliente não precisa decorar login: digita o CPF, recebe um código de 6 dígitos no WhatsApp e pega o boleto ou informe de rendimento na hora.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-foreground">
                Vistorias com Fotos
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Anexe fotos de cada cômodo na vistoria de entrada e gere laudo em PDF para evitar discussões na hora da entrega do imóvel.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SIMULADOR DE ROI */}
      <section id="roi" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RoiCalculator onOpenTrial={() => openTrial('Profissional')} />
        </div>
      </section>

      {/* PLANOS E PREÇOS */}
      <section id="pricing" className="py-16 sm:py-24 bg-card/60 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5]">
              Planos conforme o tamanho da sua carteira
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Você tem 3 dias de teste sem compromisso para conhecer o sistema com a sua equipe.
            </p>
          </div>

          <PricingTable onSelectPlan={(plan) => openTrial(plan)} />
        </div>
      </section>

      {/* DÚVIDAS FREQUENTES */}
      <section id="faq" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5]">
              Perguntas frequentes
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Respostas diretas sobre como funciona o teste, a migração e o subdomínio.
            </p>
          </div>

          <FaqSection />
        </div>
      </section>

      {/* BANNER FINAL */}
      <section className="py-16 sm:py-20 bg-[#17323D] text-[#EEECE5] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Teste o Domus por 3 dias na sua imobiliária
          </h2>
          <p className="text-sm sm:text-base text-muted/80 max-w-xl mx-auto">
            Cadastre seus primeiros imóveis, veja como funciona o repasse e receba o link da sua vitrine.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => openTrial('Profissional')}
              className="w-full sm:w-auto h-12 px-8 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white font-medium text-base rounded-xl shadow-lg cursor-pointer"
            >
              <span>Liberar Meus 3 Dias Grátis</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link
              to="/login"
              className="text-xs sm:text-sm text-muted/80 hover:text-white transition-colors"
            >
              Já tenho cadastro: Fazer login
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#EEECE5] dark:bg-[#0E1E24] border-t border-border py-12 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <DomusLogo size="sm" showBadge={false} showTagline={false} />
              <p className="text-[11px] leading-relaxed">
                Sistema para imobiliárias e corretores autônomos gerenciarem locações e repasses.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Módulos</h5>
              <ul className="space-y-2 text-[11px]">
                <li><button onClick={() => scrollToSection('features')} className="hover:underline">Contratos & Reajustes</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:underline">Repasses aos Proprietários</button></li>
                <li><button onClick={() => scrollToSection('subdomain-section')} className="hover:underline">Subdomínio da Imobiliária</button></li>
                <li><button onClick={() => scrollToSection('showcase')} className="hover:underline">Portal do Inquilino</button></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Acesso</h5>
              <ul className="space-y-2 text-[11px]">
                <li><Link to="/login" className="hover:underline">Login da Equipe</Link></li>
                <li><Link to="/portal/login" className="hover:underline">Portal do Cliente</Link></li>
                <li><Link to="/dev" className="hover:underline">Painel DEV</Link></li>
                <li><button onClick={() => openTrial('Profissional')} className="hover:underline text-[#AD7B3B] font-medium">Solicitar Teste</button></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Segurança</h5>
              <p className="text-[11px] leading-relaxed">
                Banco de dados Postgres com isolamento de dados por organização. Seus contratos e clientes não se misturam com os de terceiros.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>© {new Date().getFullYear()} Domus. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link to="/termos" className="hover:underline hover:text-foreground">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:underline hover:text-foreground">Privacidade & LGPD</Link>
              <button onClick={() => scrollToSection('faq')} className="hover:underline hover:text-foreground cursor-pointer">Dúvidas Frequentes</button>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL DE TESTE GRÁTIS */}
      <TrialModal
        isOpen={isTrialOpen}
        onClose={() => setIsTrialOpen(false)}
        initialPlan={selectedPlan}
        initialModule={selectedModule}
      />
    </div>
  )
}
