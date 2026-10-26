import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  FileText, 
  QrCode, 
  Globe, 
  Rss, 
  X,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface OnboardingChecklistProps {
  totalProperties: number
  totalLeases: number
}

export function OnboardingChecklist({ totalProperties, totalLeases }: OnboardingChecklistProps) {
  const { organization } = useAuth()
  const slug = organization?.slug || 'domus'
  const navigate = useNavigate()

  const [dismissed, setDismissed] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [pixConfigured, setPixConfigured] = useState(false)
  const [showcaseVisited, setShowcaseVisited] = useState(false)
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false)

  // Modal rápido de PIX
  const [pixDialogOpen, setPixDialogOpen] = useState(false)
  const [pixKeyInput, setPixKeyInput] = useState('')
  const [pixTypeInput, setPixTypeInput] = useState('cnpj')
  const [pixSavedToast, setPixSavedToast] = useState(false)

  // Recupera estado de dismiss ou conclusão manual do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && organization?.id) {
      const isDismissed = localStorage.getItem(`domus_onboarding_dismissed_${organization.id}`)
      if (isDismissed === 'true') setDismissed(true)

      const isPix = localStorage.getItem(`domus_onboarding_pix_${organization.id}`)
      if (isPix === 'true') setPixConfigured(true)

      const savedPix = localStorage.getItem(`domus_pix_key_${organization.id}`)
      if (savedPix) setPixKeyInput(savedPix)

      const savedType = localStorage.getItem(`domus_pix_type_${organization.id}`)
      if (savedType) setPixTypeInput(savedType)

      const isShowcase = localStorage.getItem(`domus_onboarding_showcase_${organization.id}`)
      if (isShowcase === 'true') setShowcaseVisited(true)

      // Exibe o modal de boas-vindas no 1º acesso
      const hasSeenWelcome = localStorage.getItem(`domus_welcome_seen_${organization.id}`)
      if (!hasSeenWelcome && totalProperties === 0) {
        setWelcomeModalOpen(true)
      }
    }
  }, [organization?.id, totalProperties])

  const handleCloseWelcome = () => {
    if (typeof window !== 'undefined' && organization?.id) {
      localStorage.setItem(`domus_welcome_seen_${organization.id}`, 'true')
    }
    setWelcomeModalOpen(false)
  }

  const handleSavePix = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!organization?.id) return
    localStorage.setItem(`domus_pix_key_${organization.id}`, pixKeyInput)
    localStorage.setItem(`domus_pix_type_${organization.id}`, pixTypeInput)
    localStorage.setItem(`domus_onboarding_pix_${organization.id}`, 'true')
    setPixConfigured(true)
    setPixSavedToast(true)
    setTimeout(() => {
      setPixSavedToast(false)
      setPixDialogOpen(false)
    }, 1200)
  }

  const steps = [
    {
      id: 'property',
      title: 'Cadastrar seu 1º Imóvel',
      description: 'Adicione fotos, endereço e valor de locação ou venda.',
      completed: totalProperties > 0,
      link: '/admin/imoveis',
      cta: 'Cadastrar Imóvel',
      icon: Building2,
    },
    {
      id: 'contract',
      title: 'Cadastrar Contrato & Inquilino',
      description: 'Gere a locação com dia de vencimento e taxa de repasse.',
      completed: totalLeases > 0,
      link: '/admin/contratos',
      cta: 'Criar Contrato',
      icon: FileText,
    },
    {
      id: 'pix',
      title: 'Configurar Chave PIX da Imobiliária',
      description: 'Defina a chave para recebimento dos aluguéis e repasses.',
      completed: pixConfigured,
      cta: 'Configurar PIX',
      icon: QrCode,
      onClick: () => setPixDialogOpen(true),
    },
    {
      id: 'showcase',
      title: 'Conhecer sua Vitrine Pública',
      description: `Seu catálogo online já está no ar em /${slug}/imoveis`,
      completed: showcaseVisited,
      externalLink: `/${slug}/imoveis`,
      cta: 'Ver Site Vitrine',
      icon: Globe,
      onCompleteManual: () => {
        setShowcaseVisited(true)
        localStorage.setItem(`domus_onboarding_showcase_${organization?.id}`, 'true')
      },
    },
    {
      id: 'xml_feed',
      title: 'Feed XML para Portais (ZAP / VivaReal)',
      description: 'Integração pronta para anunciar em portais automaticamente.',
      completed: false,
      externalLink: `/${slug}/feed.xml`,
      cta: 'Copiar Feed XML',
      icon: Rss,
    },
  ]

  const completedCount = steps.filter((s) => s.completed).length
  const progressPercent = Math.round((completedCount / steps.length) * 100)

  // Se tudo concluído ou dispensado, oculta
  if (dismissed || (completedCount === steps.length && minimized)) return null

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`domus_onboarding_dismissed_${organization?.id}`, 'true')
    }
  }

  return (
    <Card className="border border-[#AD7B3B]/30 bg-gradient-to-r from-amber-500/5 via-card to-card shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B]">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-foreground">
                  Primeiros Passos no Domus
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#AD7B3B]/15 text-[#AD7B3B]">
                  {completedCount} de {steps.length} concluídos ({progressPercent}%)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete a configuração da sua imobiliária para começar a emitir cobranças e repasses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMinimized(!minimized)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title={minimized ? 'Expandir checklist' : 'Minimizar checklist'}
            >
              {minimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Dispensar checklist"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden mt-3">
          <div
            className="bg-gradient-to-r from-[#AD7B3B] to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Lista de Itens */}
        {!minimized && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-border/50">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    step.completed
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-border/60 bg-background/50 hover:border-primary/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          step.completed
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className={`text-xs font-semibold ${step.completed ? 'text-emerald-900 dark:text-emerald-300 line-through' : 'text-foreground'}`}>
                      {step.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-border/30">
                    {step.link ? (
                      <Link
                        to={step.link}
                        className="text-[11px] font-semibold text-[#17323D] dark:text-[#AD7B3B] hover:underline flex items-center gap-1"
                      >
                        <span>{step.cta}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : step.externalLink ? (
                      <a
                        href={step.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={step.onCompleteManual}
                        className="text-[11px] font-semibold text-[#AD7B3B] hover:underline flex items-center gap-1"
                      >
                        <span>{step.cta}</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={step.onClick || step.onCompleteManual}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{step.cta}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Rápido de Configuração do PIX */}
      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B]">
                <QrCode className="w-5 h-5" />
              </span>
              <DialogTitle className="text-lg font-serif">Configurar Chave PIX</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre a chave PIX padrão da imobiliária para constar nos recibos, faturas e links de cobrança enviados para locatários.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePix} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Chave PIX</Label>
              <select
                value={pixTypeInput}
                onChange={(e) => setPixTypeInput(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="cnpj">CNPJ</option>
                <option value="cpf">CPF</option>
                <option value="telefone">Celular / WhatsApp</option>
                <option value="email">E-mail</option>
                <option value="aleatoria">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Chave PIX</Label>
              <Input
                value={pixKeyInput}
                onChange={(e) => setPixKeyInput(e.target.value)}
                placeholder={
                  pixTypeInput === 'cnpj'
                    ? '00.000.000/0001-00'
                    : pixTypeInput === 'cpf'
                    ? '000.000.000-00'
                    : pixTypeInput === 'telefone'
                    ? '(11) 99999-9999'
                    : pixTypeInput === 'email'
                    ? 'financeiro@imobiliaria.com.br'
                    : 'Chave aleatória UUID'
                }
                className="text-sm font-mono"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Esta chave será exibida nas notificações automáticas de cobrança via WhatsApp e nos demonstrativos.
              </p>
            </div>

            {pixSavedToast && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <Check className="w-4 h-4 text-emerald-600" />
                Chave PIX salva e configurada com sucesso!
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground order-2 sm:order-1"
                onClick={() => {
                  setPixDialogOpen(false)
                  navigate('/admin/administrative?tab=configuracoes')
                }}
              >
                Configurações completas →
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#17323D] hover:bg-[#17323D]/90 text-white dark:bg-[#AD7B3B] dark:hover:bg-[#AD7B3B]/90 order-1 sm:order-2"
              >
                Salvar Chave PIX
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Wizard de Boas-Vindas (Primeiro Login) */}
      <Dialog open={welcomeModalOpen} onOpenChange={(open) => !open && handleCloseWelcome()}>
        <DialogContent className="sm:max-w-2xl bg-card border border-border sm:rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#17323D] to-[#2D4A51] dark:from-[#AD7B3B] dark:to-amber-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                <Sparkles className="w-7 h-7 text-amber-300" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ambiente Imobiliário Criado</span>
                </div>
                <DialogTitle className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                  Bem-vindo ao Domus, {organization?.name || 'sua imobiliária'}!
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  Sua vitrine pública já está publicada na web em{' '}
                  <span className="font-mono font-semibold text-foreground">{slug}.gestaodomus.com.br</span>.
                  Preparamos um checklist interativo para você começar a operar em poucos minutos:
                </DialogDescription>
              </div>
            </div>

            {/* Grid dos 4 Passos Estruturais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-[#17323D] dark:bg-[#AD7B3B] text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Cadastrar 1º Imóvel</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Adicione fotos, endereço, taxas de condomínio e valores para venda ou locação.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-[#17323D] dark:bg-[#AD7B3B] text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Contratos & Inquilinos</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Defina o vencimento, a taxa de administração e os dados do proprietário.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-[#17323D] dark:bg-[#AD7B3B] text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Configurar Chave PIX</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Receba aluguéis diretamente na conta da sua imobiliária com baixa rápida.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-[#17323D] dark:bg-[#AD7B3B] text-white flex items-center justify-center text-[10px]">4</span>
                  <span>Divulgar sua Vitrine</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Envie o link oficial do seu catálogo online para clientes e redes sociais.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-border/40">
              <Button
                onClick={handleCloseWelcome}
                className="flex-1 h-11 bg-[#17323D] hover:bg-[#17323D]/90 text-white dark:bg-[#AD7B3B] dark:hover:bg-[#AD7B3B]/90 font-medium text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Começar Configuração Guiada</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleCloseWelcome}
                className="h-11 text-xs rounded-xl cursor-pointer"
              >
                Explorar Painel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

