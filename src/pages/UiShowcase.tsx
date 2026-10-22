import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Layers, CreditCard, Trash2, LayoutDashboard,
  Lock, ArrowLeft, Code2, Tag, Compass, Building2, TrendingUp,
  Radar, Heart
} from 'lucide-react'
import { NeumorphicLoginForm } from '@/components/ui/NeumorphicLoginForm'
import { AnimatedDeleteButton } from '@/components/ui/AnimatedDeleteButton'
import { InteractivePaymentModal } from '@/components/ui/InteractivePaymentModal'
import { GlassmorphicDashboardView } from '@/components/ui/GlassmorphicDashboardView'
import { AnimatedPricingCards } from '@/components/ui/AnimatedPricingCards'
import { FloatingNavigationTabs } from '@/components/ui/FloatingNavigationTabs'
import { ParallaxPropertyCard } from '@/components/ui/ParallaxPropertyCard'
import { NumberTickerShowcase } from '@/components/ui/NumberTickerShowcase'
import { SpotlightBorderBeamCard } from '@/components/ui/SpotlightBorderBeamCard'
import { AnimatedLucideIconsShowcase } from '@/components/ui/AnimatedLucideIconsShowcase'

type TabType =
  | 'all'
  | 'parallax'
  | 'ticker'
  | 'spotlight'
  | 'icons'
  | 'pricing'
  | 'navigation'
  | 'neumorph'
  | 'delete-btn'
  | 'checkout'
  | 'dashboard'




export function UiShowcase() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [deleteLog, setDeleteLog] = useState<string[]>([])

  const handleDeletedItem = (name: string) => {
    setDeleteLog((prev) => [
      `${new Date().toLocaleTimeString('pt-BR')}: Item "${name}" excluído com micro-animação!`,
      ...prev.slice(0, 4),
    ])
  }

  return (
    <div className="min-h-screen bg-[#EEECE5] text-[#17323D] flex flex-col selection:bg-[#AD7B3B]/20 selection:text-[#AD7B3B]">
      {/* Top Bar de Apresentação no Padrão Domus */}
      <header className="sticky top-0 z-50 border-b border-[#D4D0C8] bg-[#EEECE5]/90 backdrop-blur-md px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[#6B6375] hover:text-[#17323D] transition-colors p-1.5 rounded-lg hover:bg-black/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Sistema</span>
            </Link>

            <div className="h-4 w-px bg-[#D4D0C8] hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#AD7B3B] animate-ping" />
              <h1 className="text-sm font-semibold font-serif text-[#17323D] tracking-wide">
                Domus · Laboratório de UI & Micro-interações
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/25 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Paleta Oficial Harmonizada
            </span>
            <Link
              to="/admin/dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#17323D] hover:bg-[#254F5E] text-white transition-colors shadow-xs"
            >
              Ir para o Painel
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="px-4 lg:px-8 py-8 border-b border-[#D4D0C8] bg-gradient-to-b from-[#E5E2D9]/60 to-transparent">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#D4D0C8] text-xs text-[#17323D] shadow-2xs">
            <Code2 className="w-3.5 h-3.5 text-[#AD7B3B]" />
            <span>Framer Motion + Tailwind CSS + Web Audio API + Recharts</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold font-serif tracking-tight text-[#17323D]">
            Componentes e Animações com a Identidade Domus
          </h2>
          <p className="text-sm text-[#6B6375] max-w-2xl mx-auto">
            Todas as micro-interações, cartões 3D, tickers e gráficos integrados com as cores oficiais: Linho Claro (#EEECE5), Petróleo Profundo (#17323D) e Ouro (#AD7B3B).
          </p>

          {/* Seletor de Tabs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'Todos os Recursos', icon: Layers },
              { id: 'parallax', label: 'Card 3D Parallax', icon: Building2 },
              { id: 'ticker', label: 'Number Ticker', icon: TrendingUp },
              { id: 'spotlight', label: 'Spotlight & Beam', icon: Radar },
              { id: 'icons', label: 'Ícones Animados', icon: Heart },
              { id: 'pricing', label: 'Pricing Cards', icon: Tag },
              { id: 'navigation', label: 'Navigation Tabs V4', icon: Compass },
              { id: 'neumorph', label: 'Neumorphism Login', icon: Lock },
              { id: 'delete-btn', label: 'Botão Delete Animado', icon: Trash2 },
              { id: 'checkout', label: 'Checkout & Cartão 3D', icon: CreditCard },
              { id: 'dashboard', label: 'Dashboard Glass V7', icon: LayoutDashboard },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#17323D] text-white shadow-md shadow-[#17323D]/20 scale-105 border border-[#17323D]'
                      : 'bg-white/80 hover:bg-white text-[#6B6375] hover:text-[#17323D] border border-[#D4D0C8]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#AD7B3B]' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-12">
        {/* ==========================================================
            SEÇÃO 1: NEUMORPHISM LOGIN (Print 1 - Code By Gaurav)
            ========================================================== */}
        {(activeTab === 'all' || activeTab === 'neumorph') && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4D0C8] pb-3">
              <div>
                <span className="text-xs font-bold text-[#AD7B3B] uppercase tracking-wider">
                  Referência Imagem 1
                </span>
                <h3 className="text-xl font-bold font-serif text-[#17323D] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#AD7B3B]" />
                  Neumorphism / Soft UI Login Form
                </h3>
                <p className="text-xs text-[#6B6375]">
                  Sombras suaves convexas (relevo) e côncavas (inset/baixo relevo) no tom linho Domus, com resposta tátil ao clique.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#17323D] border border-[#D4D0C8] self-start sm:self-auto shadow-2xs">
                Código: &lt;NeumorphicLoginForm /&gt;
              </span>
            </div>

            <div className="p-8 lg:p-12 rounded-3xl neumorph-bg flex items-center justify-center border border-[#D4D0C8] overflow-hidden">
              <NeumorphicLoginForm />
            </div>
          </section>
        )}

        {/* ==========================================================
            SEÇÃO 2: BOTÃO DELETE ANIMADO (Print 2 - Codea con Horacio)
            ========================================================== */}
        {(activeTab === 'all' || activeTab === 'delete-btn') && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4D0C8] pb-3">
              <div>
                <span className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">
                  Referência Imagem 2
                </span>
                <h3 className="text-xl font-bold font-serif text-[#17323D] flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-[#DC2626]" />
                  Micro-interação: Botão de Exclusão com Letras Voando
                </h3>
                <p className="text-xs text-[#6B6375]">
                  Clique no botão para abrir a tampa da lixeira, arremessar cada letra em arco com som e tremer no impacto.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#17323D] border border-[#D4D0C8] self-start sm:self-auto shadow-2xs">
                Código: &lt;AnimatedDeleteButton /&gt;
              </span>
            </div>

            <div className="p-8 lg:p-12 rounded-3xl bg-white border border-[#D4D0C8] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div className="text-center space-y-2">
                  <span className="text-xs text-[#6B6375] block">Exemplo em Português:</span>
                  <AnimatedDeleteButton
                    label="Excluir"
                    deletedLabel="Excluído!"
                    onDelete={() => handleDeletedItem('Contrato #402')}
                  />
                </div>

                <div className="text-center space-y-2">
                  <span className="text-xs text-[#6B6375] block">Exemplo do Vídeo (Delete):</span>
                  <AnimatedDeleteButton
                    label="Delete"
                    deletedLabel="Deleted!"
                    onDelete={() => handleDeletedItem('Imóvel 101')}
                  />
                </div>

                <div className="text-center space-y-2">
                  <span className="text-xs text-[#6B6375] block">Remover Locatário:</span>
                  <AnimatedDeleteButton
                    label="Remover"
                    deletedLabel="Removido com Sucesso!"
                    onDelete={() => handleDeletedItem('Locatário João')}
                  />
                </div>
              </div>

              {deleteLog.length > 0 && (
                <div className="max-w-md mx-auto p-3 rounded-xl bg-[#F7F5F0] border border-[#D4D0C8] text-xs font-mono text-[#6B6375] space-y-1">
                  <div className="text-[11px] font-semibold text-[#17323D] mb-1">
                    Log de Eventos (Micro-interação disparada):
                  </div>
                  {deleteLog.map((log, i) => (
                    <div key={i} className="truncate">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==========================================================
            SEÇÃO 3 & 4: CHECKOUT V4 & CARTÃO 3D (Prints 3 e 4 - Code XR)
            ========================================================== */}
        {(activeTab === 'all' || activeTab === 'checkout') && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4D0C8] pb-3">
              <div>
                <span className="text-xs font-bold text-[#AD7B3B] uppercase tracking-wider">
                  Referências Imagens 3 & 4
                </span>
                <h3 className="text-xl font-bold font-serif text-[#17323D] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#AD7B3B]" />
                  Payment Checkout V4 & Cartão Black Domus com Animação 3D
                </h3>
                <p className="text-xs text-[#6B6375]">
                  Cartão em Petróleo Profundo (#17323D) com filigranas e chip dourados (#AD7B3B), espelhamento ao vivo e rotação de sucesso.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#17323D] border border-[#D4D0C8] self-start sm:self-auto shadow-2xs">
                Código: &lt;InteractivePaymentModal /&gt;
              </span>
            </div>

            <div className="py-4">
              <InteractivePaymentModal />
            </div>
          </section>
        )}

        {/* ==========================================================
            SEÇÃO 5: ADMIN DASHBOARD V7 GLASSMORPHISM (Print 5 - Code XR)
            ========================================================== */}
        {(activeTab === 'all' || activeTab === 'dashboard') && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4D0C8] pb-3">
              <div>
                <span className="text-xs font-bold text-[#AD7B3B] uppercase tracking-wider">
                  Referência Imagem 5
                </span>
                <h3 className="text-xl font-bold font-serif text-[#17323D] flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-[#AD7B3B]" />
                  Admin Dashboard V7 com Gráfico de Donut & Movimentação Fluida
                </h3>
                <p className="text-xs text-[#6B6375]">
                  Visão executiva elegante nas cores Domus, com gráfico de rosca interativo com centro dinâmico e gráficos de área/barras alternáveis.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#17323D] border border-[#D4D0C8] self-start sm:self-auto shadow-2xs">
                Código: &lt;GlassmorphicDashboardView /&gt;
              </span>
            </div>

            <GlassmorphicDashboardView />
          </section>
        )}

        {/* ==========================================================
            SEÇÃO 6: PRICING CARDS ANIMATION (Print 1 novo - Code XR)
            ========================================================== */}
        {(activeTab === 'all' || activeTab === 'pricing') && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4D0C8] pb-3">
              <div>
                <span className="text-xs font-bold text-[#AD7B3B] uppercase tracking-wider">
                  Referência Imagem 6 (Novo)
                </span>
                <h3 className="text-xl font-bold font-serif text-[#17323D] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#AD7B3B]" />
                  Pricing Cards Animation · Planos e Preços Interativos
                </h3>
                <p className="text-xs text-[#6B6375]">
                  Cards de planos com cabeçalho ouro degradê "MELHOR CUSTO-BENEFÍCIO" que desliza suavemente no hover, seletor mensal/anual e checklist dinâmico.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#17323D] border border-[#D4D0C8] self-start sm:self-auto shadow-2xs">
                Código: &lt;AnimatedPricingCards /&gt;
              </span>
            </div>

            <div className="p-8 rounded-3xl bg-white/70 border border-[#D4D0C8] shadow-sm">
              <AnimatedPricingCards />
            </div>
          </section>
        )}

        {/* ==========================================================
            SEÇÃO 7: NAVIGATION TABS V4 (Print 2 novo - Code XR)
            ========================================================== */}
        {(activeTab === 'all' || activeTab === 'navigation') && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4D0C8] pb-3">
              <div>
                <span className="text-xs font-bold text-[#AD7B3B] uppercase tracking-wider">
                  Referência Imagem 7 (Novo)
                </span>
                <h3 className="text-xl font-bold font-serif text-[#17323D] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#AD7B3B]" />
                  Navigation Tabs V4 · Expanding Glow Pill, Soft Dock & Dynamic Island
                </h3>
                <p className="text-xs text-[#6B6375]">
                  Barra de navegação com pílula ativa em Ouro Domus, dock flutuante em relevo macio linho e pílula estilo Dynamic Island em Petróleo.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#17323D] border border-[#D4D0C8] self-start sm:self-auto shadow-2xs">
                Código: &lt;FloatingNavigationTabs /&gt;
              </span>
            </div>

            <div className="p-8 rounded-3xl bg-white/70 border border-[#D4D0C8] shadow-sm">
              <FloatingNavigationTabs />
            </div>
          </section>
        )}

        {/* ==========================================================
            SEÇÃO 8: CARD 3D COM PARALLAX (Aceternity UI Style)
            ========================================================== */}
        {(activeTab === 'all' || activeTab === 'parallax') && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4D0C8] pb-3">
              <div>
                <span className="text-xs font-bold text-[#AD7B3B] uppercase tracking-wider">
                  Sugestão 1 · Aceternity UI Parallax
                </span>
                <h3 className="text-xl font-bold font-serif text-[#17323D] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#AD7B3B]" />
                  Card 3D com Parallax para Imóveis da Carteira
                </h3>
                <p className="text-xs text-[#6B6375]">
                  Mova o cursor do mouse sobre o card para ver a rotação em 3D, reflexo dourado suave e as camadas flutuantes (foto, badges, preço e botão).
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#17323D] border border-[#D4D0C8] self-start sm:self-auto shadow-2xs">
                Código: &lt;ParallaxPropertyCard /&gt;
              </span>
            </div>

            <div className="p-8 rounded-3xl bg-white/70 border border-[#D4D0C8] shadow-sm flex items-center justify-center">
              <ParallaxPropertyCard />
            </div>
          </section>
        )}

        {/* ==========================================================
            SEÇÃO 9: NUMBER TICKER (Magic UI Style)
            ========================================================== */}
        {(activeTab === 'all' || activeTab === 'ticker') && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4D0C8] pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Sugestão 2 · Magic UI Number Ticker
                </span>
                <h3 className="text-xl font-bold font-serif text-[#17323D] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                  Number Ticker · Contadores Animados para Métricas Financeiras
                </h3>
                <p className="text-xs text-[#6B6375]">
                  Valores de VGV, receita, ocupação e quantidade de imóveis sobem dinamicamente simulando a apuração em tempo real com física suave.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#17323D] border border-[#D4D0C8] self-start sm:self-auto shadow-2xs">
                Código: &lt;NumberTickerShowcase /&gt;
              </span>
            </div>

            <div className="p-8 rounded-3xl bg-white/70 border border-[#D4D0C8] shadow-sm">
              <NumberTickerShowcase />
            </div>
          </section>
        )}

        {/* ==========================================================
            SEÇÃO 10: SPOTLIGHT & BORDER BEAM (Magic UI + Aceternity UI)
            ========================================================== */}
        {(activeTab === 'all' || activeTab === 'spotlight') && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4D0C8] pb-3">
              <div>
                <span className="text-xs font-bold text-[#AD7B3B] uppercase tracking-wider">
                  Sugestão 3 · Spotlight & Border Beam
                </span>
                <h3 className="text-xl font-bold font-serif text-[#17323D] flex items-center gap-2">
                  <Radar className="w-5 h-5 text-[#AD7B3B]" />
                  Spotlight Card & Border Beam · Feixes de Luz e Holofote
                </h3>
                <p className="text-xs text-[#6B6375]">
                  Card com holofote (*spotlight*) dourado que rastreia o mouse e card com feixe contínuo de luz (*border-beam*) em Petróleo e Ouro.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#17323D] border border-[#D4D0C8] self-start sm:self-auto shadow-2xs">
                Código: &lt;SpotlightBorderBeamCard /&gt;
              </span>
            </div>

            <div className="p-8 rounded-3xl bg-white/70 border border-[#D4D0C8] shadow-sm">
              <SpotlightBorderBeamCard />
            </div>
          </section>
        )}

        {/* ==========================================================
            SEÇÃO 11: ÍCONES LUCIDE ANIMADOS (Lucide Animated Style)
            ========================================================== */}
        {(activeTab === 'all' || activeTab === 'icons') && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4D0C8] pb-3">
              <div>
                <span className="text-xs font-bold text-[#AD7B3B] uppercase tracking-wider">
                  Sugestão 4 · Lucide Animated
                </span>
                <h3 className="text-xl font-bold font-serif text-[#17323D] flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#AD7B3B]" />
                  Ícones Lucide com Reações Físicas Vivas no Hover
                </h3>
                <p className="text-xs text-[#6B6375]">
                  Passe o mouse sobre os ícones essenciais do sistema Domus para ver o balanço do sino, o giro da chave, o pulo da casa e a faísca do raio.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#17323D] border border-[#D4D0C8] self-start sm:self-auto shadow-2xs">
                Código: &lt;AnimatedLucideIconsShowcase /&gt;
              </span>
            </div>

            <div className="p-8 rounded-3xl bg-white/70 border border-[#D4D0C8] shadow-sm">
              <AnimatedLucideIconsShowcase />
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D4D0C8] py-6 px-4 text-center text-xs text-[#6B6375] bg-[#EAE8E0]/40">
        Domus Gestão Imobiliária · Demonstração de Micro-interações e UI de Alta Performance.
      </footer>
    </div>
  )
}
