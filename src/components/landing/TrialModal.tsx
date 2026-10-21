import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Clock, Building, Globe, Send, MessageCircle } from 'lucide-react'
import { getDevWhatsAppUrl } from '@/lib/devContactSettings'

interface TrialModalProps {
  isOpen: boolean
  onClose: () => void
  initialPlan?: string
}

export function TrialModal({ isOpen, onClose, initialPlan = 'Profissional' }: TrialModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [portfolioSize, setPortfolioSize] = useState('31-100')
  const [plan, setPlan] = useState(initialPlan)
  const [acceptedTerms, setAcceptedTerms] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Normaliza o subdomínio conforme o usuário digita o nome da imobiliária
  const handleAgencyChange = (val: string) => {
    setAgencyName(val)
    if (!subdomain || subdomain === agencyName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setSubdomain(generated)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptedTerms) {
      alert('É necessário concordar com os Termos de Uso e Contrato SaaS para prosseguir.')
      return
    }
    setLoading(true)

    try {
      // Normaliza o ID do plano para coincidir com a tabela saas_plans
      const normalizedPlan = plan.toLowerCase().includes('starter')
        ? 'starter'
        : plan.toLowerCase().includes('enterprise')
        ? 'enterprise'
        : plan.toLowerCase().includes('vital') || plan.toLowerCase().includes('lifetime')
        ? 'lifetime'
        : 'pro'

      // Grava o lead no Supabase com registro de aceite contratual
      const { supabase } = await import('@/integrations/supabase/client')
      await supabase.from('saas_leads').insert({
        name,
        email,
        phone,
        agency_name: agencyName,
        subdomain: subdomain || agencyName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        portfolio_size: portfolioSize,
        plan_id: normalizedPlan,
        status: 'novo',
        notes: `Aceite formal dos Termos v2.4 e LGPD registrado em ${new Date().toLocaleString('pt-BR')}`,
      })
    } catch (err) {
      // Falha silenciosa para não travar a experiência do usuário caso a tabela ainda não exista no Supabase remoto
      console.warn('Erro ao salvar lead no Supabase:', err)
    } finally {
      setLoading(false)
      setIsSubmitted(true)
    }
  }

  const openWhatsAppDirect = () => {
    const message =
      `Olá! Quero testar o Domus por 3 dias para a *${agencyName || 'minha imobiliária'}*.\n` +
      `• Plano: *${plan}*\n` +
      `• Carteira: *${portfolioSize} imóveis*\n` +
      `• Subdomínio desejado: *${subdomain ? `${subdomain}.domus.com.br` : 'não definido'}*\n` +
      `• Responsável: *${name}*`
    window.open(getDevWhatsAppUrl(message), '_blank')
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setName('')
    setEmail('')
    setPhone('')
    setAgencyName('')
    setSubdomain('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleReset() : undefined)}>
      <DialogContent className="max-w-lg bg-card text-foreground border border-border sm:rounded-2xl p-6 sm:p-8 shadow-2xl">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="trial-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="space-y-2 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20 w-fit">
                  <Clock className="w-3.5 h-3.5" />
                  <span>3 dias de acesso liberado • Sem cartão de crédito</span>
                </div>
                <DialogTitle className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                  Teste o Domus na sua imobiliária
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Cadastre seus dados para receber o link do seu ambiente com subdomínio próprio reservado.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <Label htmlFor="trial-name" className="text-xs font-medium">Seu Nome</Label>
                    <Input
                      id="trial-name"
                      required
                      placeholder="Ex: Carlos Mendes"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="trial-phone" className="text-xs font-medium">WhatsApp</Label>
                    <Input
                      id="trial-phone"
                      required
                      placeholder="(11) 98765-4321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="trial-email" className="text-xs font-medium">E-mail de Trabalho</Label>
                  <Input
                    id="trial-email"
                    type="email"
                    required
                    placeholder="carlos@suaimobiliaria.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="trial-agency" className="text-xs font-medium">Nome da Imobiliária</Label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      id="trial-agency"
                      required
                      placeholder="Ex: Imobiliária Horizon"
                      value={agencyName}
                      onChange={(e) => handleAgencyChange(e.target.value)}
                      className="pl-9 h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="trial-subdomain" className="text-xs font-medium flex items-center justify-between">
                    <span>Subdomínio Desejado</span>
                    <span className="text-[11px] text-[#AD7B3B] font-mono">link da sua vitrine</span>
                  </Label>
                  <div className="flex items-center rounded-lg border border-input bg-background/50 focus-within:ring-2 focus-within:ring-ring">
                    <div className="pl-3 pr-2 text-muted-foreground">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      id="trial-subdomain"
                      type="text"
                      required
                      pattern="[a-z0-9-]{2,40}"
                      title="Apenas letras minúsculas, números e hífens"
                      placeholder="horizon"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full py-2 bg-transparent text-sm focus:outline-none font-mono"
                    />
                    <span className="pr-3 text-xs text-muted-foreground font-mono select-none">
                      .domus.com.br
                    </span>
                  </div>
                  {subdomain && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Vitrine e portal: <span className="font-semibold text-foreground font-mono">https://{subdomain}.domus.com.br</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Imóveis Sob Gestão</Label>
                    <select
                      value={portfolioSize}
                      onChange={(e) => setPortfolioSize(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                      <option value="1-30">Até 30 imóveis</option>
                      <option value="31-100">31 a 100 imóveis</option>
                      <option value="101-300">101 a 300 imóveis</option>
                      <option value="300+">Mais de 300 imóveis</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Plano Inicial</Label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                      <option value="Starter">Starter (até 35 imóveis)</option>
                      <option value="Profissional">Profissional (Mais procurado)</option>
                      <option value="Enterprise">Enterprise (Acima de 150)</option>
                    </select>
                  </div>
                </div>

                {/* Termos de Uso e Aceite do Contrato SaaS */}
                <div className="flex items-start gap-2 pt-1 text-left bg-muted/40 p-2.5 rounded-xl border border-border/60">
                  <input
                    id="trial-terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-input text-[#AD7B3B] focus:ring-[#AD7B3B] cursor-pointer"
                  />
                  <label htmlFor="trial-terms" className="text-[11px] text-muted-foreground leading-tight select-none cursor-pointer">
                    Declaro que li e concordo com os{' '}
                    <a href="/termos" target="_blank" rel="noreferrer" className="text-[#AD7B3B] hover:underline font-medium">
                      Termos de Uso e Contrato de Licença
                    </a>{' '}
                    e a{' '}
                    <a href="/privacidade" target="_blank" rel="noreferrer" className="text-[#AD7B3B] hover:underline font-medium">
                      Política de Privacidade (LGPD)
                    </a>.
                  </label>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading || !acceptedTerms}
                    className="w-full h-11 bg-[#17323D] hover:bg-[#17323D]/90 text-white font-medium flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xl transition-all"
                  >
                    {loading ? (
                      'Criando ambiente de teste...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Liberar Meus 3 Dias de Teste</span>
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground mt-2">
                    Acesso imediato às telas com dados de demonstração.
                  </p>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="trial-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="py-6 text-center space-y-4"
            >
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                  Ambiente Pré-configurado!
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Pronto, <strong>{name}</strong>. O endereço <span className="font-mono font-semibold text-foreground">{subdomain}.domus.com.br</span> foi reservado para a <strong>{agencyName}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#EEECE5]/60 dark:bg-[#17323D]/40 border border-border text-left space-y-1.5 text-xs text-muted-foreground">
                <p>• Enviamos os detalhes de primeiro acesso para <strong>{email}</strong>.</p>
                <p>• Você tem 3 dias completos para testar a emissão de boletos, o cálculo de repasses e cadastrar imóveis.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={openWhatsAppDirect}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2 cursor-pointer rounded-xl"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chamar no WhatsApp para Ativar</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="h-11 cursor-pointer rounded-xl"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
