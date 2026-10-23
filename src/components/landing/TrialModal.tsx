import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle2, 
  Clock, 
  Building, 
  Globe, 
  Send, 
  MessageCircle, 
  Crown, 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  ShieldCheck, 
  KeyRound,
  Sparkles,
  Lock,
  ExternalLink,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { getDevWhatsAppUrl } from '@/lib/devContactSettings'
import { getLifetimeSettings, type LifetimeSettings, DEFAULT_LIFETIME_SETTINGS } from '@/lib/lifetimeSettings'
import { createAsaasPayment, checkAsaasPaymentStatus } from '@/lib/asaas'

interface TrialModalProps {
  isOpen: boolean
  onClose: () => void
  initialPlan?: string
}

export function TrialModal({ isOpen, onClose, initialPlan = 'Profissional' }: TrialModalProps) {
  const [lifetimeSettings, setLifetimeSettings] = useState<LifetimeSettings>(DEFAULT_LIFETIME_SETTINGS)
  const isInitiallyLifetime = initialPlan.toLowerCase().includes('vital') || initialPlan.toLowerCase().includes('lifetime')

  const [isDirectPurchase, setIsDirectPurchase] = useState(isInitiallyLifetime)
  const [plan, setPlan] = useState(isInitiallyLifetime ? 'Vitalício' : initialPlan)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [documentCpfCnpj, setDocumentCpfCnpj] = useState('')
  const [password, setPassword] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [portfolioSize, setPortfolioSize] = useState('31-100')
  const [acceptedTerms, setAcceptedTerms] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)

  // Estados Asaas
  const [loadingAsaasPix, setLoadingAsaasPix] = useState(false)
  const [asaasError, setAsaasError] = useState<string | null>(null)
  const [asaasPixData, setAsaasPixData] = useState<{ encodedImage?: string; payload?: string } | null>(null)
  const [asaasInvoiceUrl, setAsaasInvoiceUrl] = useState<string | null>(null)
  const [asaasPaymentId, setAsaasPaymentId] = useState<string | null>(null)
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false)

  // Estados para pagamento com cartão no checkout direto
  const [showCardInputs, setShowCardInputs] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [selectedInstallments, setSelectedInstallments] = useState(12)
  const [processingCardPayment, setProcessingCardPayment] = useState(false)
  const [cardPaymentSuccess, setCardPaymentSuccess] = useState(false)

  // Polling em tempo real da confirmação do pagamento no Asaas
  useEffect(() => {
    if (!isSubmitted || isPaymentConfirmed || !asaasPaymentId) return

    let isMounted = true
    const interval = setInterval(async () => {
      try {
        const res = await checkAsaasPaymentStatus(asaasPaymentId)
        if (res.confirmed && isMounted) {
          setIsPaymentConfirmed(true)
          clearInterval(interval)
        }
      } catch {
        // Silencia erros transitórios de rede no polling
      }
    }, 3500)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [isSubmitted, isPaymentConfirmed, asaasPaymentId])

  // Carrega preços atualizados da Licença Vitalícia
  useEffect(() => {
    if (isOpen) {
      getLifetimeSettings().then(setLifetimeSettings).catch(() => {})
      const isLife = initialPlan.toLowerCase().includes('vital') || initialPlan.toLowerCase().includes('lifetime')
      setIsDirectPurchase(isLife)
      setPlan(isLife ? 'Vitalício' : initialPlan)
    }
  }, [isOpen, initialPlan])

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

  const generatePixAsaas = async (customSubdomain?: string, customAgency?: string) => {
    const sub = customSubdomain || subdomain || agencyName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const agency = customAgency || agencyName || 'Minha Imobiliária'
    setLoadingAsaasPix(true)
    setAsaasError(null)

    try {
      const asaasRes = await createAsaasPayment({
        billingType: 'PIX',
        value: lifetimeSettings.price_cash,
        description: `Licença Vitalícia Domus - Imobiliária ${agency}`,
        orgId: sub,
        planId: 'lifetime',
        customer: {
          name: name || 'Cliente Domus',
          email: email || 'financeiro@domus.com.br',
          cpfCnpj: documentCpfCnpj || '',
          phone: phone || '11999999999',
        },
      })

      if (asaasRes.success) {
        if (asaasRes.pix) {
          setAsaasPixData({
            encodedImage: asaasRes.pix.encodedImage,
            payload: asaasRes.pix.payload,
          })
        }
        if (asaasRes.payment?.invoiceUrl) {
          setAsaasInvoiceUrl(asaasRes.payment.invoiceUrl)
        }
        if (asaasRes.payment?.id) {
          setAsaasPaymentId(asaasRes.payment.id)
        }
      } else {
        console.warn('Aviso Asaas:', asaasRes.error)
        setAsaasError(asaasRes.error || 'Não foi possível gerar a cobrança no Asaas.')
      }
    } catch (err: any) {
      console.warn('Erro ao conectar com Asaas:', err)
      setAsaasError(err.message || 'Falha de comunicação com o Asaas.')
    } finally {
      setLoadingAsaasPix(false)
    }
  }

  const provisionAdminAccount = async (sub: string, normalizedPlan: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (!supabaseUrl || !anonKey) return

      await fetch(`${supabaseUrl}/functions/v1/saas-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          agencyName,
          subdomain: sub,
          portfolioSize,
          planId: normalizedPlan,
          paymentMethod,
          isDirectPurchase,
        }),
      })
    } catch (err) {
      console.warn('Aviso saas-signup edge function:', err)
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
      const normalizedPlan = plan.toLowerCase().includes('starter')
        ? 'starter'
        : plan.toLowerCase().includes('enterprise')
        ? 'enterprise'
        : plan.toLowerCase().includes('vital') || plan.toLowerCase().includes('lifetime')
        ? 'lifetime'
        : 'pro'

      const isBuy = isDirectPurchase || normalizedPlan === 'lifetime'
      const sub = subdomain || agencyName.toLowerCase().replace(/[^a-z0-9]/g, '')

      // 1. Provisiona a organização e o usuário como ADMIN no Supabase
      await provisionAdminAccount(sub, normalizedPlan)

      // 2. Se for compra vitalícia via PIX, gera cobrança real imediatamente no Asaas!
      if (isBuy && paymentMethod === 'pix') {
        await generatePixAsaas(sub, agencyName)
      }

      // 3. Grava o lead/pedido no Supabase com status 'novo' (válido no check constraint)
      const { supabase } = await import('@/integrations/supabase/client')
      await supabase.from('saas_leads').insert({
        name,
        email,
        phone,
        agency_name: agencyName,
        subdomain: sub,
        portfolio_size: portfolioSize,
        plan_id: normalizedPlan,
        status: 'novo',
        notes: isBuy
          ? `[COMPRA DIRETA] Pagamento: ${paymentMethod.toUpperCase()} (${paymentMethod === 'cartao' ? `12x de R$ ${lifetimeSettings.price_installments}` : `R$ ${lifetimeSettings.price_cash} à vista`}) • Senha: ${password} • CPF/CNPJ: ${documentCpfCnpj || 'Não informado'} • Data: ${new Date().toLocaleString('pt-BR')}`
          : `[TESTE 3 DIAS] Senha: ${password} • Aceite formal dos Termos v2.4 registrado em ${new Date().toLocaleString('pt-BR')}`,
      })
    } catch (err) {
      console.warn('Erro ao salvar lead no Supabase:', err)
    } finally {
      setLoading(false)
      setIsSubmitted(true)
    }
  }

  const handleProcessCardDirect = async () => {
    if (!cardNumber || cardNumber.replace(/\D/g, '').length < 15) {
      alert('Por favor, informe um número de cartão de crédito válido.')
      return
    }
    if (!cardHolder.trim()) {
      alert('Por favor, informe o nome impresso no cartão.')
      return
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      alert('Por favor, informe a validade no formato MM/AA.')
      return
    }
    if (!cardCvv || cardCvv.length < 3) {
      alert('Por favor, informe o código CVV de segurança.')
      return
    }

    setProcessingCardPayment(true)
    setAsaasError(null)

    try {
      const { supabase } = await import('@/integrations/supabase/client')
      const installmentValue = selectedInstallments === 12 
        ? lifetimeSettings.price_installments 
        : Math.round(lifetimeSettings.price_cash / selectedInstallments)

      const totalAmount = selectedInstallments === 12
        ? (lifetimeSettings.price_installments * 12)
        : lifetimeSettings.price_cash

      const cleanNumber = cardNumber.replace(/\s+/g, '')
      const [expMonth, expYear] = cardExpiry.split('/')
      const fullYear = expYear ? (expYear.length === 2 ? `20${expYear}` : expYear) : '2028'
      const sub = subdomain || agencyName.toLowerCase().replace(/[^a-z0-9]/g, '')

      // Cria a transação real no gateway Asaas (aparece imediatamente em Cobranças!)
      const asaasRes = await createAsaasPayment({
        billingType: 'CREDIT_CARD',
        value: totalAmount,
        description: `Licença Vitalícia Domus (${selectedInstallments}x) - ${agencyName}`,
        orgId: sub,
        planId: 'lifetime',
        isRecurring: false,
        installmentCount: selectedInstallments,
        customer: {
          name: cardHolder.trim() || name,
          email: email || 'financeiro@domus.com.br',
          cpfCnpj: documentCpfCnpj || '',
          phone: phone || '11999999999',
        },
        creditCard: {
          holderName: cardHolder.trim().toUpperCase(),
          number: cleanNumber,
          expiryMonth: expMonth || '12',
          expiryYear: fullYear,
          ccv: cardCvv,
        },
      })

      if (!asaasRes.success) {
        throw new Error(asaasRes.error || 'Erro retornado pela operadora/Asaas ao processar o cartão.')
      }

      if (asaasRes.payment?.invoiceUrl) {
        setAsaasInvoiceUrl(asaasRes.payment.invoiceUrl)
      }
      if (asaasRes.payment?.id) {
        setAsaasPaymentId(asaasRes.payment.id)
      }

      // Provisiona a organização e a conta de ADMIN
      await provisionAdminAccount(sub, 'lifetime')

      await supabase.from('saas_leads').insert({
        name,
        email,
        phone,
        agency_name: agencyName,
        subdomain: sub,
        portfolio_size: portfolioSize,
        plan_id: 'lifetime',
        status: 'novo',
        notes: `[PAGAMENTO CARTÃO PROCESSADO NO ASAAS] ID: ${asaasRes.payment?.id || 'N/A'} • ${selectedInstallments}x de R$ ${installmentValue} • Titular: ${cardHolder.toUpperCase()} • Cartão final: ${cardNumber.slice(-4)} • Senha: ${password} • Em ${new Date().toLocaleString('pt-BR')}`,
      })

      setCardPaymentSuccess(true)
    } catch (err: any) {
      console.warn('Erro ao processar cartão no Asaas:', err)
      alert(`Falha no pagamento: ${err.message || 'Verifique os dados informados'}`)
    } finally {
      setProcessingCardPayment(false)
    }
  }

  const openWhatsAppDirect = () => {
    const isLife = plan.toLowerCase().includes('vital') || isDirectPurchase
    let message = ''
    if (isLife) {
      if (paymentMethod === 'cartao') {
        const installmentValue = selectedInstallments === 12 
          ? lifetimeSettings.price_installments 
          : Math.round(lifetimeSettings.price_cash / selectedInstallments)

        message =
          `Olá! Acabei de reservar a *Licença Vitalícia* para a minha imobiliária *${agencyName || 'minha empresa'}*!\n` +
          `• Forma de Pagamento: *${selectedInstallments}x de R$ ${installmentValue} no Cartão de Crédito*\n` +
          `• Subdomínio reservado: *${subdomain ? `${subdomain}.domus.com.br` : 'não informado'}*\n` +
          `• Responsável: *${name}* (${email})\n` +
          `• WhatsApp: *${phone}*\n\n` +
          `Por favor, me envie o link de pagamento no cartão para liberação imediata do sistema!`
      } else {
        message =
          `Olá! Acabei de garantir a *Licença Vitalícia* para a minha imobiliária *${agencyName || 'minha empresa'}*!\n` +
          `• Valor à vista: *R$ ${new Intl.NumberFormat('pt-BR').format(lifetimeSettings.price_cash)} no PIX*\n` +
          `• Subdomínio reservado: *${subdomain ? `${subdomain}.domus.com.br` : 'não informado'}*\n` +
          `• Responsável: *${name}* (${email})\n\n` +
          `Gostaria de confirmar o envio do comprovante para liberação imediata!`
      }
    } else {
      message =
        `Olá! Quero testar a plataforma por 3 dias para a *${agencyName || 'minha imobiliária'}*.\n` +
        `• Plano: *${plan}*\n` +
        `• Porte: *${portfolioSize}*\n` +
        `• Subdomínio desejado: *${subdomain ? `${subdomain}.domus.com.br` : 'não definido'}*\n` +
        `• Responsável: *${name}*`
    }
    window.open(getDevWhatsAppUrl(message), '_blank')
  }

  const handleCopyPix = () => {
    const pixChave = asaasPixData?.payload || 'financeiro@domus.com.br'
    navigator.clipboard.writeText(pixChave)
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 3000)
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setDocumentCpfCnpj('')
    setAsaasPixData(null)
    setAsaasInvoiceUrl(null)
    setAsaasPaymentId(null)
    setAsaasError(null)
    setAgencyName('')
    setSubdomain('')
    setShowCardInputs(false)
    setCardPaymentSuccess(false)
    setIsPaymentConfirmed(false)
    onClose()
  }

  const isLifetimeSelected = plan.toLowerCase().includes('vital') || isDirectPurchase

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleReset() : undefined)}>
      <DialogContent className="max-w-xl bg-card text-foreground border border-border sm:rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="checkout-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Seletor de Modo: Compra Direta vs Teste de 3 Dias */}
              <div className="flex items-center justify-between gap-2 p-1 bg-muted/50 rounded-xl mb-4 border border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsDirectPurchase(true)
                    setPlan('Vitalício')
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isDirectPurchase
                      ? 'bg-[#AD7B3B] text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Comprar Licença Vitalícia</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDirectPurchase(false)
                    if (plan === 'Vitalício') setPlan('Profissional')
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !isDirectPurchase
                      ? 'bg-[#17323D] text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Testar 3 Dias Grátis</span>
                </button>
              </div>

              <DialogHeader className="space-y-1.5 text-left">
                {isDirectPurchase ? (
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-[#AD7B3B] border border-[#AD7B3B]/30 w-fit">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lifetimeSettings.badge || 'Lote Fundador'} • Sem Mensalidade</span>
                    </div>
                    <DialogTitle className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                      Adquira sua Licença Vitalícia
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Crie sua conta e garanta o Domus definitivo para sua imobiliária com pagamento único.
                    </DialogDescription>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20 w-fit">
                      <Clock className="w-3.5 h-3.5" />
                      <span>3 dias de acesso liberado • Sem cartão de crédito</span>
                    </div>
                    <DialogTitle className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                      Teste o Domus na sua Imobiliária
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Preencha os dados abaixo para receber o acesso imediato ao seu ambiente.
                    </DialogDescription>
                  </div>
                )}
              </DialogHeader>

              {/* Box de Resumo da Licença Vitalícia se no modo compra */}
              {isDirectPurchase && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-card to-card border border-[#AD7B3B]/40 my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Valor da Licença Definitiva:</span>
                    <div className="flex items-baseline gap-1 my-0.5">
                      <span className="text-xs font-medium text-muted-foreground">R$</span>
                      <span className="text-2xl sm:text-3xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5]">
                        {new Intl.NumberFormat('pt-BR').format(lifetimeSettings.price_cash)}
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
                        à vista (PIX)
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Ou em até 12x de <strong>R$ {lifetimeSettings.price_installments}</strong> no cartão
                    </span>
                  </div>

                  {/* Forma de Pagamento */}
                  <div className="flex sm:flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        paymentMethod === 'pix'
                          ? 'border-[#AD7B3B] bg-[#AD7B3B]/15 text-[#AD7B3B]'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>PIX à Vista</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cartao')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        paymentMethod === 'cartao'
                          ? 'border-[#AD7B3B] bg-[#AD7B3B]/15 text-[#AD7B3B]'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>12x no Cartão</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="checkout-name" className="text-xs font-medium">Seu Nome Completo</Label>
                    <Input
                      id="checkout-name"
                      required
                      placeholder="Ex: Carlos Mendes"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="checkout-phone" className="text-xs font-medium">WhatsApp</Label>
                    <Input
                      id="checkout-phone"
                      required
                      placeholder="(11) 98765-4321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="checkout-email" className="text-xs font-medium">E-mail Corporativo</Label>
                    <Input
                      id="checkout-email"
                      type="email"
                      required
                      placeholder="carlos@suaimobiliaria.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="checkout-password" className="text-xs font-medium flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-[#AD7B3B]" />
                      <span>Criar Senha de Acesso</span>
                    </Label>
                    <Input
                      id="checkout-password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="checkout-agency" className="text-xs font-medium">Nome da Imobiliária</Label>
                    <div className="relative">
                      <Building className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                      <Input
                        id="checkout-agency"
                        required
                        placeholder="Ex: Imobiliária Horizonte"
                        value={agencyName}
                        onChange={(e) => handleAgencyChange(e.target.value)}
                        className="pl-8 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="checkout-subdomain" className="text-xs font-medium flex items-center justify-between">
                      <span>Subdomínio Desejado</span>
                      <span className="text-[10px] text-[#AD7B3B] font-mono">link da sua vitrine</span>
                    </Label>
                    <div className="flex items-center rounded-lg border border-input bg-background/50 focus-within:ring-2 focus-within:ring-ring h-9">
                      <div className="pl-2.5 pr-1.5 text-muted-foreground">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="checkout-subdomain"
                        type="text"
                        required
                        pattern="[a-z0-9-]{2,40}"
                        title="Apenas letras minúsculas, números e hífens"
                        placeholder="horizonte"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="w-full py-1.5 bg-transparent text-xs focus:outline-none font-mono"
                      />
                      <span className="pr-2.5 text-[11px] text-muted-foreground font-mono select-none">
                        .domus.com.br
                      </span>
                    </div>
                  </div>
                </div>

                {isDirectPurchase && (
                  <div className="space-y-1">
                    <Label htmlFor="checkout-doc" className="text-xs font-medium flex items-center justify-between">
                      <span>CPF ou CNPJ (para nota fiscal e fatura Asaas)</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Opcional no Sandbox</span>
                    </Label>
                    <Input
                      id="checkout-doc"
                      placeholder="000.000.000-00 ou 00.000.000/0001-00"
                      value={documentCpfCnpj}
                      onChange={(e) => setDocumentCpfCnpj(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                )}

                {!isDirectPurchase && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Imóveis Sob Gestão</Label>
                      <select
                        value={portfolioSize}
                        onChange={(e) => setPortfolioSize(e.target.value)}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        <option value="1-30">Até 30 imóveis</option>
                        <option value="31-100">31 a 100 imóveis</option>
                        <option value="101-300">101 a 300 imóveis</option>
                        <option value="300+">Mais de 300 imóveis</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Plano a Testar</Label>
                      <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        <option value="Starter">Starter (até 35 imóveis)</option>
                        <option value="Profissional">Profissional (Mais procurado)</option>
                        <option value="Enterprise">Enterprise (Acima de 150)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Termos de Uso */}
                <div className="flex items-start gap-2 pt-1 text-left bg-muted/40 p-2.5 rounded-xl border border-border/60">
                  <input
                    id="checkout-terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                    className="mt-0.5 h-3.5 w-3.5 rounded border-input text-[#AD7B3B] focus:ring-[#AD7B3B] cursor-pointer"
                  />
                  <label htmlFor="checkout-terms" className="text-[11px] text-muted-foreground leading-tight select-none cursor-pointer">
                    Declaro que li e concordo com os{' '}
                    <a href="/termos" target="_blank" rel="noreferrer" className="text-[#AD7B3B] hover:underline font-medium">
                      Termos de Uso
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
                    className={`w-full h-11 text-white font-medium flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xl transition-all ${
                      isDirectPurchase
                        ? 'bg-[#AD7B3B] hover:bg-[#AD7B3B]/90'
                        : 'bg-[#17323D] hover:bg-[#17323D]/90'
                    }`}
                  >
                    {loading ? (
                      'Processando solicitação...'
                    ) : isDirectPurchase ? (
                      <>
                        <Crown className="w-4 h-4 text-amber-200" />
                        <span>
                          {paymentMethod === 'cartao'
                            ? `Garantir Licença Vitalícia (12x de R$ ${lifetimeSettings.price_installments})`
                            : `Garantir Licença Vitalícia (R$ ${new Intl.NumberFormat('pt-BR').format(lifetimeSettings.price_cash)})`}
                        </span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Liberar Meus 3 Dias de Teste</span>
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                    {isDirectPurchase
                      ? 'Ativação prioritária • Suporte VIP • Implantação e migração assistida'
                      : 'Acesso imediato às telas com dados de demonstração.'}
                  </p>
                </div>
              </form>
            </motion.div>
          ) : isPaymentConfirmed ? (
            <motion.div
              key="checkout-confirmed"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="py-4 text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pagamento Confirmado no Asaas!</span>
                </div>
                <h3 className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                  Parabéns! Sua Imobiliária Está Ativa
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  A licença vitalícia da <strong>{agencyName}</strong> foi liberada com sucesso. Seu ambiente multi-tenant já está pronto para uso.
                </p>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border border-border text-left space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">E-mail de Acesso:</span>
                  <span className="font-semibold text-foreground">{email}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Endereço da Vitrine:</span>
                  <span className="font-mono text-foreground font-medium">{subdomain}.domus.com.br</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Status do Plano:</span>
                  <span className="font-semibold text-emerald-600">Vitalício Definitivo (Ativo)</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => {
                    window.location.href = `/login?email=${encodeURIComponent(email)}`
                  }}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Acessar Meu Painel Agora</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(`/${subdomain}/imoveis`, '_blank')
                  }}
                  className="w-full h-10 text-xs rounded-xl cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                  <span>Visualizar Minha Vitrine Pública</span>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="checkout-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="py-4 text-center space-y-4"
            >
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                  {isDirectPurchase ? 'Licença Vitalícia Reservada!' : 'Ambiente Pré-configurado!'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Parabéns, <strong>{name}</strong>! O endereço{' '}
                  <span className="font-mono font-semibold text-foreground">{subdomain}.domus.com.br</span> foi reservado para a <strong>{agencyName}</strong>.
                </p>
              </div>

              {/* Informações de Pagamento da Licença Vitalícia */}
              {isDirectPurchase ? (
                <div className="space-y-3">
                  {/* Seletor de Método de Pagamento na Confirmação */}
                  <div className="flex items-center justify-between gap-2 p-1 bg-muted/60 rounded-xl border border-border/60">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cartao')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'cartao'
                          ? 'bg-[#17323D] text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>12x no Cartão (R$ {lifetimeSettings.price_installments}/mês)</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setPaymentMethod('pix')
                        if (!asaasPixData && !loadingAsaasPix) {
                          await generatePixAsaas()
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'pix'
                          ? 'bg-[#AD7B3B] text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>PIX à Vista (R$ {new Intl.NumberFormat('pt-BR').format(lifetimeSettings.price_cash)})</span>
                    </button>
                  </div>

                  {asaasError && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 text-left">
                      <strong>Aviso Asaas:</strong> {asaasError}
                    </div>
                  )}

                  {paymentMethod === 'cartao' ? (
                    <div className="p-4 rounded-xl bg-blue-500/10 dark:bg-blue-950/20 border border-blue-500/30 text-left space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          Pagamento Parcelado no Cartão
                        </span>
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                          em até 12x de R$ {lifetimeSettings.price_installments}
                        </span>
                      </div>

                      {cardPaymentSuccess ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
                          <p className="font-semibold flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-600" />
                            Pagamento Registrado no Asaas com Sucesso!
                          </p>
                          {asaasPaymentId && (
                            <p className="text-[11px] font-mono text-muted-foreground">
                              ID da Cobrança Asaas: <strong>{asaasPaymentId}</strong>
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            Seu ambiente foi reservado para ativação em <strong>{subdomain}.domus.com.br</strong>.
                          </p>
                          {asaasInvoiceUrl && (
                            <div className="pt-1">
                              <a
                                href={asaasInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Visualizar Fatura Oficial / Recibo no Asaas</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-background rounded-lg border border-border text-xs space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                              <span>Total da Licença Definitiva:</span>
                              <span className="font-semibold text-foreground">
                                12x de R$ {lifetimeSettings.price_installments} (Sem mensalidade)
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Processamento com criptografia direta pelo Asaas.</span>
                            </div>
                          </div>

                          {!showCardInputs ? (
                            <div className="pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCardInputs(true)}
                                className="w-full h-9 text-xs gap-1.5 cursor-pointer font-medium border-blue-500/30 hover:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Digitar Dados do Cartão de Crédito Agora</span>
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2.5 pt-2 border-t border-border/60">
                              <div className="space-y-1">
                                <Label className="text-[11px] font-medium">Número do Cartão</Label>
                                <Input
                                  placeholder="0000 0000 0000 0000"
                                  maxLength={19}
                                  value={cardNumber}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim()
                                    setCardNumber(val)
                                  }}
                                  className="h-8 text-xs font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[11px] font-medium">Nome Impresso no Cartão</Label>
                                <Input
                                  placeholder="Ex: CARLOS MENDES"
                                  value={cardHolder}
                                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                  className="h-8 text-xs uppercase"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[11px] font-medium">Validade (MM/AA)</Label>
                                  <Input
                                    placeholder="MM/AA"
                                    maxLength={5}
                                    value={cardExpiry}
                                    onChange={(e) => {
                                      let val = e.target.value.replace(/\D/g, '')
                                      if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`
                                      setCardExpiry(val)
                                    }}
                                    className="h-8 text-xs font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[11px] font-medium">CVV</Label>
                                  <Input
                                    placeholder="123"
                                    maxLength={4}
                                    type="password"
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                    className="h-8 text-xs font-mono"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[11px] font-medium">Opções de Parcelamento</Label>
                                <select
                                  value={selectedInstallments}
                                  onChange={(e) => setSelectedInstallments(Number(e.target.value))}
                                  className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background"
                                >
                                  <option value={1}>1x de R$ {new Intl.NumberFormat('pt-BR').format(lifetimeSettings.price_cash)} à vista</option>
                                  <option value={2}>2x de R$ {new Intl.NumberFormat('pt-BR').format(Math.round(lifetimeSettings.price_cash / 2))}</option>
                                  <option value={3}>3x de R$ {new Intl.NumberFormat('pt-BR').format(Math.round(lifetimeSettings.price_cash / 3))}</option>
                                  <option value={6}>6x de R$ {new Intl.NumberFormat('pt-BR').format(Math.round(lifetimeSettings.price_cash / 6))}</option>
                                  <option value={10}>10x de R$ {new Intl.NumberFormat('pt-BR').format(Math.round(lifetimeSettings.price_cash / 10))}</option>
                                  <option value={12}>12x de R$ {lifetimeSettings.price_installments} (Sem juros)</option>
                                </select>
                              </div>
                              <Button
                                type="button"
                                disabled={processingCardPayment}
                                onClick={handleProcessCardDirect}
                                className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>
                                  {processingCardPayment
                                    ? 'Processando no Asaas...'
                                    : `Confirmar e Cobrar no Cartão (${selectedInstallments}x de R$ ${selectedInstallments === 12 ? lifetimeSettings.price_installments : Math.round(lifetimeSettings.price_cash / selectedInstallments)})`}
                                </span>
                              </Button>
                            </div>
                          )}

                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            A cobrança será lançada imediatamente no Asaas e seu ambiente será liberado automaticamente após a confirmação.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-[#AD7B3B]/40 text-left space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-[#AD7B3B]" />
                          Pagamento via PIX (Ativação Automática)
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          R$ {new Intl.NumberFormat('pt-BR').format(lifetimeSettings.price_cash)}
                        </span>
                      </div>

                      {loadingAsaasPix ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                          <Loader2 className="w-7 h-7 animate-spin text-[#AD7B3B]" />
                          <span>Gerando QR Code PIX oficial no Asaas...</span>
                        </div>
                      ) : (
                        <>
                          {asaasPixData?.encodedImage && (
                            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 rounded-xl border border-border/80 shadow-xs space-y-2">
                              <img
                                src={`data:image/png;base64,${asaasPixData.encodedImage}`}
                                alt="QR Code PIX Asaas"
                                className="w-44 h-44 object-contain rounded-md"
                              />
                              <span className="text-[11px] text-muted-foreground text-center">
                                Abra o aplicativo do seu banco e escaneie o QR Code acima
                              </span>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-muted-foreground">
                              {asaasPixData?.payload ? 'Código PIX Copia e Cola (Asaas):' : 'Chave PIX:'}
                            </Label>
                            <div className="p-2.5 bg-background rounded-lg border border-border flex items-center justify-between gap-2">
                              <span className="text-xs font-mono text-muted-foreground truncate select-all">
                                {asaasPixData?.payload || 'financeiro@domus.com.br'}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleCopyPix}
                                className="h-7 px-2.5 text-xs gap-1 shrink-0 cursor-pointer"
                              >
                                {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedPix ? 'Copiado!' : asaasPixData?.payload ? 'Copiar Código PIX' : 'Copiar Chave'}</span>
                              </Button>
                            </div>
                          </div>

                          {asaasPaymentId && (
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                              <span>Cobrança gerada no Asaas:</span>
                              <span className="font-mono font-semibold text-foreground">{asaasPaymentId}</span>
                            </div>
                          )}

                          {asaasInvoiceUrl && (
                            <div className="pt-1 text-center">
                              <a
                                href={asaasInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-[#AD7B3B] hover:underline font-medium"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Abrir fatura / comprovante oficial no Asaas</span>
                              </a>
                            </div>
                          )}

                          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                            </span>
                            <span>Aguardando pagamento... A tela atualizará automaticamente após o PIX.</span>
                          </div>

                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Assim que o PIX for pago no app do seu banco, o sistema reconhece instantaneamente e libera seu acesso sem precisar de atendimento manual!
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-left space-y-1 text-xs text-muted-foreground">
                  <p>• Enviamos os detalhes de primeiro acesso para <strong>{email}</strong>.</p>
                  <p>• Você tem 3 dias completos para testar a emissão de boletos, o cálculo de repasses e cadastrar imóveis.</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Button
                  onClick={openWhatsAppDirect}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2 cursor-pointer rounded-xl"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {isDirectPurchase
                      ? paymentMethod === 'cartao'
                        ? 'Pedir Link do Cartão no WhatsApp'
                        : 'Confirmar e Ativar no WhatsApp'
                      : 'Chamar no WhatsApp para Ativar'}
                  </span>
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
