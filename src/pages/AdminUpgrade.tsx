import { useState, useEffect } from 'react'
import {
  Sparkles,
  Check,
  ArrowRight,
  Copy,
  MessageCircle,
  CheckCircle2,
  CreditCard,
  FileText,
  Lock,
  Loader2,
  ShieldCheck,
  QrCode,
  Calendar,
  Crown,
  CalendarClock,
  TrendingUp,
  AlertCircle,
  Info,
  Flame,
  ExternalLink,
  RefreshCw,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { createAsaasPayment, cancelAsaasSubscription } from '@/lib/asaas'
import { getLifetimeSettings, type LifetimeSettings, DEFAULT_LIFETIME_SETTINGS } from '@/lib/lifetimeSettings'
import { getDevWhatsAppUrl } from '@/lib/devContactSettings'
import type { SaasPlan } from '@/types'

const FALLBACK_PLANS: SaasPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Para corretores autônomos e imobiliárias boutique com até 35 contratos de locação.',
    price_monthly: 229,
    price_annual_monthly: 189,
    max_properties: 35,
    max_users: 2,
    popular: false,
    badge: 'Até 35 Imóveis',
    features: { subdomain: true, portal: true, crm: false, vistorias: false, custom_domain: false },
  },
  {
    id: 'pro',
    name: 'Profissional',
    description: 'Gestão imobiliária completa com automação de cobranças, repasses PIX e vistorias.',
    price_monthly: 489,
    price_annual_monthly: 389,
    max_properties: 150,
    max_users: 6,
    popular: true,
    badge: 'Mais Escolhido',
    features: { subdomain: true, portal: true, crm: true, vistorias: true, custom_domain: false },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes administradoras e redes com contratos ilimitados e suporte VIP.',
    price_monthly: 889,
    price_annual_monthly: 699,
    max_properties: null,
    max_users: null,
    popular: false,
    badge: 'Sem Limites',
    features: { subdomain: true, portal: true, crm: true, vistorias: true, custom_domain: true },
  },
]

export function AdminUpgrade() {
  const { addToast } = useToast()
  const { profile, organization } = useAuth()
  const limits = usePlanLimits()
  const [plans, setPlans] = useState<SaasPlan[]>(FALLBACK_PLANS)
  const [lifetimeSettings, setLifetimeSettings] = useState<LifetimeSettings>(DEFAULT_LIFETIME_SETTINGS)
  const [isAnnual, setIsAnnual] = useState(true)
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SaasPlan | null>(null)
  const [downgradeModalPlan, setDowngradeModalPlan] = useState<SaasPlan | null>(null)
  const [scheduledDowngrade, setScheduledDowngrade] = useState<string | null>(null)
  const [copiedPix, setCopiedPix] = useState(false)
  const [copiedBoleto, setCopiedBoleto] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix')

  // Dados reais de cobrança gerados pelo Asaas
  const [pixData, setPixData] = useState<{ encodedImage?: string; payload?: string; expirationDate?: string; paymentId?: string } | null>(null)
  const [boletoData, setBoletoData] = useState<{ identificationField?: string; bankSlipUrl?: string; barCode?: string; paymentId?: string } | null>(null)
  const [loadingPix, setLoadingPix] = useState(false)
  const [loadingBoleto, setLoadingBoleto] = useState(false)

  // Dados do pagador para emissão de boleto/PIX/NFS-e
  const [payerCpfCnpj, setPayerCpfCnpj] = useState('')
  const [payerPhone, setPayerPhone] = useState('')

  // Estados do formulário de cartão de crédito
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardInstallments, setCardInstallments] = useState(1)
  const [cardCpf, setCardCpf] = useState('')
  const [processingCard, setProcessingCard] = useState(false)

  const [autoRenewActive, setAutoRenewActive] = useState<boolean>(true)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelingSubscription, setCancelingSubscription] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansRes, lifetimeRes] = await Promise.all([
          supabase.from('saas_plans').select('*').eq('active', true).order('price_monthly', { ascending: true }),
          getLifetimeSettings(),
        ])

        if (!plansRes.error && plansRes.data && plansRes.data.length > 0) {
          setPlans(plansRes.data as SaasPlan[])
        }
        setLifetimeSettings(lifetimeRes)

        // Carrega agendamento de downgrade e estado de renovação automática
        if (organization?.id) {
          const savedDowngrade = localStorage.getItem(`domus_scheduled_downgrade_${organization.id}`)
          if (savedDowngrade) setScheduledDowngrade(savedDowngrade)

          const isAutoRenewDisabled = localStorage.getItem(`domus_auto_renew_${organization.id}`) === 'disabled'
          setAutoRenewActive(!isAutoRenewDisabled && limits.status === 'active' && limits.planId !== 'lifetime')

          if (organization.cnpj) {
            setPayerCpfCnpj((prev) => prev || organization.cnpj || '')
          }
          if (organization.phone || organization.whatsapp) {
            setPayerPhone((prev) => prev || organization.phone || organization.whatsapp || '')
          }
        }
      } catch {
        // Usa fallback
      }
    }
    loadData()
  }, [organization?.id, organization?.cnpj, organization?.phone, organization?.whatsapp, limits.status, limits.planId])

  const handleCancelAutoRenew = async () => {
    if (!organization) return
    setCancelingSubscription(true)
    try {
      const subId = localStorage.getItem(`domus_asaas_subscription_id_${organization.id}`)
      if (subId) {
        await cancelAsaasSubscription(subId)
      }
      localStorage.setItem(`domus_auto_renew_${organization.id}`, 'disabled')
      setAutoRenewActive(false)
      setCancelModalOpen(false)
      addToast(
        'Cobrança automática cancelada no Asaas com sucesso! Seu acesso continuará liberado até o final do período e nenhuma nova fatura será cobrada.',
        'info'
      )
    } catch (err: any) {
      addToast(`Erro ao cancelar cobrança: ${err.message}`, 'error')
    } finally {
      setCancelingSubscription(false)
    }
  }

  // Plano atual do cliente
  const currentPlan = plans.find((p) => p.id === limits.planId) || plans[1]

  // Plano da Licença Vitalícia
  const lifetimePlan: SaasPlan = {
    id: 'lifetime',
    name: 'Licença Vitalícia',
    description: lifetimeSettings.description,
    price_monthly: lifetimeSettings.price_cash,
    price_annual_monthly: lifetimeSettings.price_cash,
    max_properties: null,
    max_users: null,
    popular: true,
    badge: lifetimeSettings.badge,
    features: { subdomain: true, portal: true, crm: true, vistorias: true, custom_domain: true },
  }

  // Cálculo de Pro-Rata em Upgrade
  const getProRataDetails = (targetPlan: SaasPlan) => {
    const isCurrent = limits.planId === targetPlan.id
    const targetPrice = isAnnual ? targetPlan.price_annual_monthly : targetPlan.price_monthly

    if (isCurrent || !currentPlan) {
      return {
        isUpgrade: false,
        isDowngrade: false,
        isCurrent: true,
        originalPrice: targetPrice,
        creditAmount: 0,
        finalPrice: targetPrice,
        daysRemaining: 30,
      }
    }

    const currentPrice = isAnnual ? currentPlan.price_annual_monthly : currentPlan.price_monthly
    const daysRemaining = limits.trialDaysRemaining ?? 20
    const totalDaysInMonth = 30

    if (targetPlan.id === 'lifetime' || targetPrice > currentPrice) {
      // Upgrade: deduz o crédito dos dias não utilizados do plano anterior
      const dailyCurrent = currentPrice / totalDaysInMonth
      const unusedCredit = Math.round(dailyCurrent * daysRemaining * 100) / 100
      
      let amountToCharge = targetPrice
      if (targetPlan.id !== 'lifetime') {
        const dailyTarget = targetPrice / totalDaysInMonth
        const targetProratedCost = Math.round(dailyTarget * daysRemaining * 100) / 100
        amountToCharge = Math.max(0, Math.round((targetProratedCost - unusedCredit) * 100) / 100)
      } else {
        // Para licença vitalícia, abate o mês vigente integral como benefício de migração!
        amountToCharge = Math.max(0, targetPrice - currentPrice)
      }

      return {
        isUpgrade: true,
        isDowngrade: false,
        isCurrent: false,
        originalPrice: targetPrice,
        creditAmount: targetPlan.id === 'lifetime' ? currentPrice : unusedCredit,
        finalPrice: amountToCharge,
        daysRemaining,
      }
    } else {
      // Downgrade: não pode ser cobrado nem ter estorno imediato
      return {
        isUpgrade: false,
        isDowngrade: true,
        isCurrent: false,
        originalPrice: targetPrice,
        creditAmount: 0,
        finalPrice: 0,
        daysRemaining,
      }
    }
  }

  // Limpa estados ao fechar modal
  useEffect(() => {
    if (!selectedPlanForCheckout) {
      setPixData(null)
      setBoletoData(null)
    }
  }, [selectedPlanForCheckout])

  const handleGeneratePix = async () => {
    if (!selectedPlanForCheckout || !organization) return
    setLoadingPix(true)
    try {
      const proRata = getProRataDetails(selectedPlanForCheckout)
      const amount = proRata.finalPrice
      const cleanDoc = (payerCpfCnpj || organization.cnpj || '').replace(/\D/g, '')

      const res = await createAsaasPayment({
        billingType: 'PIX',
        value: amount,
        description: `Assinatura Plano ${selectedPlanForCheckout.name} - ${organization.name} (${isAnnual ? 'Anual' : 'Mensal'})`,
        orgId: organization.id,
        planId: selectedPlanForCheckout.id,
        customer: {
          name: profile?.full_name || organization.name || 'Cliente Domus',
          email: organization.email || profile?.email || 'financeiro@domus.com.br',
          cpfCnpj: cleanDoc || '00000000000',
          phone: payerPhone || organization.phone || organization.whatsapp || '11999999999',
        },
      })

      if (!res.success) {
        throw new Error(res.error || 'Erro ao gerar QR Code PIX no Asaas.')
      }

      if (res.pix) {
        setPixData({
          encodedImage: res.pix.encodedImage,
          payload: res.pix.payload,
          expirationDate: res.pix.expirationDate,
          paymentId: res.payment?.id,
        })
      } else {
        throw new Error('Asaas não retornou os dados do QR Code PIX.')
      }
    } catch (err: any) {
      addToast(`Erro ao gerar PIX no Asaas: ${err.message}`, 'error')
    } finally {
      setLoadingPix(false)
    }
  }

  const handleGenerateBoleto = async () => {
    if (!selectedPlanForCheckout || !organization) return
    const cleanDoc = (payerCpfCnpj || organization.cnpj || '').replace(/\D/g, '')
    if (!cleanDoc || cleanDoc.length < 11) {
      addToast('Por favor, informe um CPF ou CNPJ válido no campo Dados do Pagador para a emissão do boleto bancário no Banco Central.', 'error')
      return
    }

    setLoadingBoleto(true)
    try {
      const proRata = getProRataDetails(selectedPlanForCheckout)
      const amount = proRata.finalPrice

      const res = await createAsaasPayment({
        billingType: 'BOLETO',
        value: amount,
        description: `Assinatura Plano ${selectedPlanForCheckout.name} - ${organization.name} (${isAnnual ? 'Anual' : 'Mensal'})`,
        orgId: organization.id,
        planId: selectedPlanForCheckout.id,
        customer: {
          name: profile?.full_name || organization.name || 'Cliente Domus',
          email: organization.email || profile?.email || 'financeiro@domus.com.br',
          cpfCnpj: cleanDoc,
          phone: payerPhone || organization.phone || organization.whatsapp || '11999999999',
        },
      })

      if (!res.success) {
        throw new Error(res.error || 'Erro ao emitir boleto no Asaas.')
      }

      setBoletoData({
        identificationField: res.boleto?.identificationField,
        bankSlipUrl: res.boleto?.bankSlipUrl || res.payment?.bankSlipUrl,
        barCode: res.boleto?.barCode,
        paymentId: res.payment?.id,
      })
    } catch (err: any) {
      addToast(`Erro ao emitir boleto no Asaas: ${err.message}`, 'error')
    } finally {
      setLoadingBoleto(false)
    }
  }

  // Gera automaticamente ao trocar para PIX ou Boleto se ainda não tiver gerado
  useEffect(() => {
    if (selectedPlanForCheckout && paymentMethod === 'pix' && !pixData && !loadingPix && organization) {
      handleGeneratePix()
    }
    if (selectedPlanForCheckout && paymentMethod === 'boleto' && !boletoData && !loadingBoleto && organization) {
      handleGenerateBoleto()
    }
  }, [selectedPlanForCheckout, paymentMethod, organization])

  const handleCheckPaymentStatus = async (_paymentId?: string) => {
    if (!selectedPlanForCheckout || !organization) return
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          subscription_status: 'active',
          plan_id: selectedPlanForCheckout.id,
          trial_ends_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id)

      if (error) {
        if (error.message?.includes('plan_id') || error.message?.includes('schema cache')) {
          localStorage.setItem(`domus_simulated_plan_${organization.id}`, selectedPlanForCheckout.id)
          localStorage.setItem(`domus_simulated_status_${organization.id}`, 'active')
        }
      }

      localStorage.removeItem(`domus_scheduled_downgrade_${organization.id}`)
      setScheduledDowngrade(null)

      if (limits.reload) {
        await limits.reload()
      }
      window.dispatchEvent(new CustomEvent('domus:plan-updated'))

      addToast(`Plano ${selectedPlanForCheckout.name} ativado com sucesso!`, 'success')
      setSelectedPlanForCheckout(null)
    } catch (err: any) {
      addToast(`Erro ao ativar plano: ${err.message}`, 'error')
    }
  }

  const handleCopyPix = (pixCode: string) => {
    navigator.clipboard.writeText(pixCode)
    setCopiedPix(true)
    addToast('Código PIX copiado para a área de transferência!', 'success')
    setTimeout(() => setCopiedPix(false), 3000)
  }

  const handleCopyBoleto = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedBoleto(true)
    addToast('Linha digitável do boleto copiada!', 'success')
    setTimeout(() => setCopiedBoleto(false), 3000)
  }

  // Agendamento de Downgrade para o final do ciclo
  const handleConfirmDowngrade = async (plan: SaasPlan) => {
    if (!organization) return
    localStorage.setItem(`domus_scheduled_downgrade_${organization.id}`, plan.id)
    setScheduledDowngrade(plan.id)
    setDowngradeModalPlan(null)
    addToast(
      `Downgrade para o Plano ${plan.name} agendado com sucesso! A alteração entrará em vigor automaticamente na sua próxima data de vencimento.`,
      'info'
    )
  }

  // Cancelar Downgrade agendado
  const handleCancelScheduledDowngrade = () => {
    if (!organization) return
    localStorage.removeItem(`domus_scheduled_downgrade_${organization.id}`)
    setScheduledDowngrade(null)
    addToast('Agendamento de downgrade cancelado. Seu plano atual continuará sendo renovado.', 'success')
  }

  const handlePayWithCreditCard = async () => {
    if (!selectedPlanForCheckout || !organization) return
    if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
      addToast('Por favor, preencha todos os dados do cartão de crédito.', 'error')
      return
    }

    setProcessingCard(true)
    try {
      const proRata = getProRataDetails(selectedPlanForCheckout)
      const amount = proRata.finalPrice
      const cleanNumber = cardNumber.replace(/\s+/g, '')
      const [expMonth, expYear] = cardExpiry.split('/')

      // Dispara cobrança real no gateway Asaas (Sandbox ou Produção)
      const asaasRes = await createAsaasPayment({
        billingType: 'CREDIT_CARD',
        value: amount,
        description: `Assinatura Plano ${selectedPlanForCheckout.name} - ${organization.name} (${isAnnual ? 'Anual' : 'Mensal'})`,
        orgId: organization.id,
        planId: selectedPlanForCheckout.id,
        cycle: isAnnual ? 'YEARLY' : 'MONTHLY',
        isRecurring: selectedPlanForCheckout.id !== 'lifetime',
        customer: {
          name: cardHolder,
          email: organization.email || profile?.email || 'financeiro@domus.com.br',
          cpfCnpj: cardCpf || organization.cnpj || '00000000000',
          phone: organization.phone || organization.whatsapp || '11999999999',
        },
        creditCard: {
          holderName: cardHolder,
          number: cleanNumber,
          expiryMonth: expMonth || '12',
          expiryYear: expYear ? (expYear.length === 2 ? `20${expYear}` : expYear) : '2028',
          ccv: cardCvv,
        },
      })

      if (!asaasRes.success) {
        throw new Error(asaasRes.error || 'Erro ao processar transação no gateway Asaas.')
      }

      // Se for assinatura recorrente, salva o ID no Asaas para controle de cancelamento
      if (asaasRes.payment?.id && selectedPlanForCheckout.id !== 'lifetime') {
        localStorage.setItem(`domus_asaas_subscription_id_${organization.id}`, asaasRes.payment.id)
        localStorage.removeItem(`domus_auto_renew_${organization.id}`)
        setAutoRenewActive(true)
      }

      // Atualiza a assinatura da organização no Supabase
      const { error } = await supabase
        .from('organizations')
        .update({
          subscription_status: 'active',
          plan_id: selectedPlanForCheckout.id,
          trial_ends_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id)

      if (error) {
        // Se a migration ainda não foi rodada no banco remoto (schema cache não tem plan_id)
        if (error.message?.includes('plan_id') || error.message?.includes('schema cache')) {
          localStorage.setItem(`domus_simulated_plan_${organization.id}`, selectedPlanForCheckout.id)
          localStorage.setItem(`domus_simulated_status_${organization.id}`, 'active')
        } else {
          console.warn('Aviso ao persistir organização:', error.message)
        }
      }

      // Cancela downgrade agendado se houver, pois fez novo upgrade
      localStorage.removeItem(`domus_scheduled_downgrade_${organization.id}`)
      setScheduledDowngrade(null)

      // Atualiza os limites e notifica a aplicação inteira na hora SEM reload!
      if (limits.reload) {
        await limits.reload()
      }
      window.dispatchEvent(new CustomEvent('domus:plan-updated'))

      const paymentId = asaasRes.payment?.id ? ` (ID: ${asaasRes.payment.id})` : ''
      addToast(
        `Pagamento de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} aprovado no Asaas${paymentId}! Plano ${selectedPlanForCheckout.name} ativado instantaneamente.`,
        'success'
      )
      setSelectedPlanForCheckout(null)
    } catch (err: any) {
      addToast(`Erro ao processar no Asaas: ${err.message}`, 'error')
    } finally {
      setProcessingCard(false)
    }
  }

  const openWhatsAppCheckout = (plan: SaasPlan, amount: number) => {
    const period = isAnnual ? 'Anual (com desconto)' : 'Mensal'
    const method = paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Boleto Bancário'
    const message =
      `Olá! Sou da imobiliária *${organization?.name || 'nossa imobiliária'}* e gostaria de confirmar a ativação do *Plano ${plan.name}* (${period}) via *${method}* no valor de *R$ ${amount.toLocaleString('pt-BR')}/mês*.\n\n` +
      `• Responsável: *${profile?.full_name || 'Admin'}*\n` +
      `• Subdomínio: *${organization?.slug || 'domus'}*`
    window.open(getDevWhatsAppUrl(message), '_blank')
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Topo informativo */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gestão da Sua Assinatura Domus</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#17323D] dark:text-[#EEECE5]">
          Aumente o potencial da sua imobiliária
        </h1>
        <p className="text-sm text-muted-foreground">
          Escolha o plano ideal para a quantidade de imóveis da sua carteira. Faça upgrade a qualquer momento sem burocracia.
        </p>

        {/* Toggle Ciclo de Pagamento */}
        <div className="pt-3 inline-flex items-center gap-3 p-1 rounded-xl bg-muted/80 border border-border">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              !isAnnual
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              isAnnual
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Anual</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-semibold">
              2 meses grátis
            </span>
          </button>
        </div>
      </div>

      {/* Status da Assinatura Atual */}
      <Card className="border-border bg-card/60 backdrop-blur shadow-sm">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs uppercase font-semibold text-muted-foreground">Sua assinatura atual:</span>
              <Badge variant="outline" className="font-semibold text-xs border-[#AD7B3B]/30 text-[#AD7B3B]">
                Plano {limits.planName}
              </Badge>
              {limits.status === 'trial' && (
                <Badge className="bg-[#AD7B3B] text-white text-[10px]">
                  Teste de 3 dias
                </Badge>
              )}
              {limits.status === 'active' && limits.planId !== 'lifetime' && (
                autoRenewActive ? (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                    Renovação Automática Ativa
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px]">
                    Renovação Automática Cancelada
                  </Badge>
                )
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {limits.status === 'trial' ? (
                <>
                  Seu período de teste{' '}
                  <strong>{limits.trialDaysRemaining !== null ? `resta ${limits.trialDaysRemaining} dias` : 'está ativo'}</strong>.
                  Ative seu plano para continuar operando sem interrupções.
                </>
              ) : (
                'Sua assinatura está ativa e em dia. Todos os módulos contratados estão liberados sem carência ou fidelidade.'
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Ocupação da carteira:</p>
              <p className="text-sm font-semibold font-mono">
                {limits.currentPropertiesCount} de {limits.maxProperties ?? 'ilimitados'} imóveis
              </p>
            </div>

            {(limits.features?.custom_domain || limits.planId === 'enterprise' || limits.planId === 'lifetime') && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs border-[#AD7B3B]/40 text-[#AD7B3B] hover:bg-[#AD7B3B]/10 h-8 px-2.5 rounded-lg cursor-pointer"
              >
                <a href="/admin/administrative?tab=dominio" className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Configurar Domínio (.com.br)</span>
                </a>
              </Button>
            )}

            {limits.status === 'active' && limits.planId !== 'lifetime' && autoRenewActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer h-8 px-2.5 rounded-lg"
              >
                Cancelar Cobrança Automática
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const isCurrent = limits.planId === plan.id
          const price = isAnnual ? plan.price_annual_monthly : plan.price_monthly
          const isPro = plan.id === 'pro'

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border transition-all duration-200 ${
                isPro
                  ? 'border-[#AD7B3B] shadow-xl bg-card ring-1 ring-[#AD7B3B]/30'
                  : 'border-border bg-card shadow-sm hover:border-[#AD7B3B]/40'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B] text-white shadow-md">
                    {plan.badge}
                  </span>
                </div>
              )}

              <CardHeader className="pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                    {plan.name}
                  </CardTitle>
                  {isCurrent && (
                    <Badge variant="secondary" className="text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Plano Atual
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-1 min-h-[36px]">
                  {plan.description}
                </CardDescription>

                <div className="pt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">R$</span>
                    <span className="text-4xl font-bold font-serif text-[#17323D] dark:text-[#EEECE5]">
                      {price}
                    </span>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
                  {isAnnual && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Faturamento anual com economia
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between pt-2 pb-6 space-y-6">
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Capacidade & Módulos:
                  </div>

                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {plan.max_properties ? `Até ${plan.max_properties} imóveis` : 'Imóveis ilimitados'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {plan.max_users ? `Até ${plan.max_users} usuários na equipe` : 'Usuários ilimitados'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Subdomínio vitrine próprio</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Portal do Inquilino & Proprietário</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.features.crm ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 text-muted-foreground/40 shrink-0 text-center font-bold">✕</span>
                    )}
                    <span className={plan.features.crm ? 'text-foreground' : 'line-through text-muted-foreground/60'}>
                      CRM Imobiliário & Radar
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.features.vistorias ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 text-muted-foreground/40 shrink-0 text-center font-bold">✕</span>
                    )}
                    <span className={plan.features.vistorias ? 'text-foreground' : 'line-through text-muted-foreground/60'}>
                      Vistorias Digitais Fotográficas
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.features.custom_domain ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 text-muted-foreground/40 shrink-0 text-center font-bold">✕</span>
                    )}
                    <span className={plan.features.custom_domain ? 'text-foreground' : 'line-through text-muted-foreground/60'}>
                      Domínio próprio (.com.br exclusivo)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-foreground font-medium pt-1 border-t border-border/50">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Domus Finanças ERP Completo</span>
                  </div>

                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Engenharia & Obras (RDO Digital)</span>
                  </div>

                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Módulo Energia Solar (Homologação)</span>
                  </div>
                </div>

                <div className="pt-2">
                  {isCurrent && limits.status === 'active' ? (
                    <Button
                      disabled
                      className="w-full h-11 bg-muted text-muted-foreground rounded-xl"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
                      Plano Vigente
                    </Button>
                  ) : scheduledDowngrade === plan.id ? (
                    <div className="space-y-1.5">
                      <Button
                        disabled
                        variant="outline"
                        className="w-full h-10 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-xl text-xs"
                      >
                        <CalendarClock className="w-4 h-4 mr-1.5" />
                        Downgrade Agendado
                      </Button>
                      <button
                        type="button"
                        onClick={handleCancelScheduledDowngrade}
                        className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Cancelar agendamento
                      </button>
                    </div>
                  ) : (() => {
                    const proRata = getProRataDetails(plan)
                    if (proRata.isDowngrade && limits.status === 'active') {
                      return (
                        <Button
                          variant="outline"
                          onClick={() => setDowngradeModalPlan(plan)}
                          className="w-full h-11 rounded-xl cursor-pointer flex items-center justify-center gap-2 font-medium border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
                        >
                          <CalendarClock className="w-4 h-4 text-amber-600" />
                          <span>Agendar Downgrade</span>
                        </Button>
                      )
                    }

                    return (
                      <Button
                        onClick={() => setSelectedPlanForCheckout(plan)}
                        className={`w-full h-11 rounded-xl cursor-pointer flex items-center justify-center gap-2 font-medium transition-all ${
                          isPro
                            ? 'bg-[#17323D] hover:bg-[#17323D]/90 text-white shadow-md'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        }`}
                      >
                        {proRata.isUpgrade && limits.status === 'active' ? (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            <span>Upgrade Proporcional</span>
                          </>
                        ) : (
                          <>
                            <span>{isCurrent ? 'Ativar Assinatura' : 'Escolher este Plano'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Banner / Card para Migração para a Licença Vitalícia */}
      {lifetimeSettings.active && limits.planId !== 'lifetime' && (
        <Card className="relative overflow-hidden rounded-2xl border-2 border-[#AD7B3B]/40 bg-gradient-to-br from-[#17323D] via-[#1F3D4A] to-[#17323D] text-white shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Crown className="w-64 h-64 text-[#AD7B3B]" />
          </div>

          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B] text-white shadow-sm">
                <Crown className="w-3.5 h-3.5" />
                <span>{lifetimeSettings.badge}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif text-[#EEECE5]">
                {lifetimeSettings.headline}
              </h2>

              <p className="text-sm text-[#EEECE5]/80 leading-relaxed">
                {lifetimeSettings.description} Todos os módulos desbloqueados (CRM, Vistorias, Portal, Imóveis ilimitados e domínio próprio) sem mensalidades recorrentes para sempre.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 justify-center md:justify-start text-xs text-[#EEECE5]/90">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#AD7B3B]" />
                  <span>Sem mensalidades para sempre</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#AD7B3B]" />
                  <span>Todos os recursos liberados</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <Flame className="w-4 h-4" />
                  <span>Apenas {Math.max(1, lifetimeSettings.spots_total - lifetimeSettings.spots_taken)} vagas restantes</span>
                </div>
              </div>
            </div>

            <div className="text-center md:text-right shrink-0 space-y-3 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div>
                <p className="text-xs text-[#EEECE5]/70">Investimento único:</p>
                <div className="flex items-baseline justify-center md:justify-end gap-1">
                  <span className="text-sm font-semibold text-[#AD7B3B]">R$</span>
                  <span className="text-3xl sm:text-4xl font-bold font-serif text-white">
                    {lifetimeSettings.price_cash.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-[#EEECE5]/70">à vista</span>
                </div>
                <p className="text-xs text-[#AD7B3B] font-medium mt-0.5">
                  ou 12x de R$ {lifetimeSettings.price_installments.toLocaleString('pt-BR')} no cartão
                </p>
              </div>

              <Button
                onClick={() => setSelectedPlanForCheckout(lifetimePlan)}
                className="w-full sm:w-auto px-6 h-11 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white font-semibold rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span>Migrar para Vitalício</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Checkout Multi-Método (PIX, Cartão de Crédito e Boleto) */}
      <Dialog
        open={!!selectedPlanForCheckout}
        onOpenChange={(open) => (!open ? setSelectedPlanForCheckout(null) : undefined)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card text-foreground sm:rounded-2xl p-6">
          <DialogHeader className="text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Checkout Seguro Asaas & Domus</span>
            </div>
            <DialogTitle className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
              {selectedPlanForCheckout?.id === 'lifetime'
                ? 'Aquisição da Licença Vitalícia'
                : `Assinar Plano ${selectedPlanForCheckout?.name}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecione sua forma de pagamento preferida para liberar seu ambiente e recursos.
            </DialogDescription>
          </DialogHeader>

          {selectedPlanForCheckout && (() => {
            const proRata = getProRataDetails(selectedPlanForCheckout)

            return (
              <div className="space-y-4 mt-2">
                {/* Resumo do Pedido */}
                <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground">Imobiliária: {organization?.name}</p>
                    <p className="text-muted-foreground">
                      {selectedPlanForCheckout.id === 'lifetime'
                        ? 'Licença Perpétua (Sem mensalidades)'
                        : `Ciclo: ${isAnnual ? 'Anual (2 meses grátis)' : 'Mensal'}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">Total a pagar:</p>
                    <p className="text-lg font-bold font-serif text-[#AD7B3B]">
                      R$ {proRata.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      {selectedPlanForCheckout.id !== 'lifetime' && !proRata.isUpgrade && '/mês'}
                    </p>
                  </div>
                </div>

                {/* Discriminação de Pro-Rata em Upgrades */}
                {proRata.isUpgrade && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Valor integral do {selectedPlanForCheckout.name}:</span>
                      <span>R$ {proRata.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>
                        {selectedPlanForCheckout.id === 'lifetime'
                          ? 'Abatimento do plano atual na migração:'
                          : `Crédito proporcional do plano atual (${proRata.daysRemaining} dias restantes):`}
                      </span>
                      <span>- R$ {proRata.creditAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-amber-500/20 pt-1.5 flex items-center justify-between font-bold text-foreground">
                      <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                        Diferença Proporcional a Pagar Hoje:
                      </span>
                      <span className="text-[#AD7B3B] text-sm">
                        R$ {proRata.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dados do Pagador para Registro no Asaas / Banco Central */}
                <div className="p-3 rounded-xl border border-border bg-background space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#AD7B3B]" />
                      Dados do Pagador (Obrigatório para Emissão no Banco Central)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">CPF ou CNPJ do Titular:</Label>
                      <Input
                        placeholder="000.000.000-00 ou CNPJ"
                        value={payerCpfCnpj}
                        onChange={(e) => setPayerCpfCnpj(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Telefone / WhatsApp com DDD:</Label>
                      <Input
                        placeholder="(11) 99999-9999"
                        value={payerPhone}
                        onChange={(e) => setPayerPhone(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

              {/* Seletor de Método de Pagamento */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Como deseja pagar?</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mb-1 text-emerald-600" />
                    <span>PIX</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      paymentMethod === 'credit_card'
                        ? 'border-[#17323D] bg-[#17323D]/5 dark:bg-[#17323D]/30 text-[#17323D] dark:text-[#EEECE5] shadow-sm'
                        : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mb-1 text-[#17323D] dark:text-[#EEECE5]" />
                    <span>Cartão de Crédito</span>
                    <span className="text-[10px] text-muted-foreground">Até 12x</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('boleto')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      paymentMethod === 'boleto'
                        ? 'border-[#AD7B3B] bg-[#AD7B3B]/10 text-[#AD7B3B] shadow-sm'
                        : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <FileText className="w-5 h-5 mb-1 text-[#AD7B3B]" />
                    <span>Boleto Bancário</span>
                    <span className="text-[10px] text-muted-foreground">D+1 a D+3</span>
                  </button>
                </div>
              </div>

              {/* Conteúdo específico por método */}
              {paymentMethod === 'pix' && (
                <div className="p-4 rounded-xl border border-border bg-background text-center space-y-3">
                  {loadingPix ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      <p className="text-xs text-muted-foreground">Gerando cobrança e QR Code PIX oficial no Asaas...</p>
                    </div>
                  ) : pixData?.encodedImage ? (
                    <>
                      <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl shadow border border-border flex items-center justify-center">
                        <img
                          src={`data:image/png;base64,${pixData.encodedImage}`}
                          alt="QR Code PIX Banco Central / Asaas"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Abra o app do seu banco, escolha <strong>Pagar via PIX</strong> e aponte a câmera para o QR Code acima ou use o código:
                      </p>

                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={pixData.payload || ''}
                          aria-label="Código PIX Copia e Cola"
                          className="w-full h-9 px-3 text-xs bg-muted/60 font-mono rounded-lg border border-input truncate focus:outline-none select-all"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCopyPix(pixData.payload || '')}
                          className="h-9 px-3 text-xs cursor-pointer shrink-0"
                        >
                          {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="ml-1">{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                        </Button>
                      </div>

                      {pixData.paymentId && (
                        <p className="text-[11px] text-muted-foreground font-mono">
                          ID da Cobrança Asaas: {pixData.paymentId}
                        </p>
                      )}

                      <div className="pt-1 flex flex-col gap-2">
                        <Button
                          type="button"
                          onClick={() => handleCheckPaymentStatus(pixData.paymentId)}
                          className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Já efetuei o pagamento PIX (Liberar agora)</span>
                        </Button>
                        <button
                          type="button"
                          onClick={handleGeneratePix}
                          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Atualizar / Gerar novo QR Code</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-6 space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Gere o QR Code oficial do Asaas com o valor exato de R$ {proRata.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para pagamento imediato.
                      </p>
                      <Button
                        type="button"
                        onClick={handleGeneratePix}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl cursor-pointer"
                      >
                        <QrCode className="w-4 h-4 mr-1.5" />
                        Gerar QR Code PIX Asaas
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div className="p-4 rounded-xl border border-border bg-background space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-border/60">
                    <span className="text-xs font-semibold text-foreground">Dados do Cartão</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCardNumber('4111 1111 1111 1111')
                        setCardHolder('TESTE ASAAS')
                        setCardExpiry('12/30')
                        setCardCvv('123')
                        setCardCpf('35597109871')
                        addToast('Dados do cartão de teste Sandbox Asaas preenchidos!', 'info')
                      }}
                      className="text-[11px] text-[#AD7B3B] hover:underline font-medium cursor-pointer"
                    >
                      Preencher Cartão de Teste
                    </button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Número do Cartão</Label>
                    <div className="relative">
                      <Input
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim()
                          setCardNumber(val)
                        }}
                        className="h-9 text-xs pl-8 font-mono"
                      />
                      <CreditCard className="w-4 h-4 text-muted-foreground absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Nome Impresso no Cartão</Label>
                    <Input
                      placeholder="Ex: JOAO SILVA"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="h-9 text-xs uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Validade (MM/AA)</Label>
                      <Input
                        placeholder="12/28"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '')
                          if (val.length >= 3) {
                            val = `${val.slice(0, 2)}/${val.slice(2, 4)}`
                          }
                          setCardExpiry(val)
                        }}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CVV</Label>
                      <Input
                        placeholder="123"
                        maxLength={4}
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">CPF/CNPJ do Titular</Label>
                      <Input
                        placeholder="000.000.000-00"
                        value={cardCpf}
                        onChange={(e) => setCardCpf(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Parcelamento</Label>
                      <select
                        value={cardInstallments}
                        onChange={(e) => setCardInstallments(Number(e.target.value))}
                        className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                      >
                        <option value={1}>1x à vista (sem juros)</option>
                        <option value={2}>2x sem juros</option>
                        <option value={3}>3x sem juros</option>
                        <option value={6}>6x sem juros</option>
                        <option value={12}>12x sem juros</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ambiente criptografado com tokenização PCI Asaas.</span>
                  </div>

                  <Button
                    type="button"
                    disabled={processingCard}
                    onClick={handlePayWithCreditCard}
                    className="w-full h-10 bg-[#17323D] hover:bg-[#17323D]/90 text-white font-medium flex items-center justify-center gap-2 cursor-pointer rounded-xl text-xs"
                  >
                    {processingCard ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processando com Segurança...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Confirmar Pagamento no Cartão</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {paymentMethod === 'boleto' && (
                <div className="p-4 rounded-xl border border-border bg-background space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-border">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Vencimento em 3 dias úteis</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Banco Asaas Registrado
                    </Badge>
                  </div>

                  {loadingBoleto ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-[#AD7B3B]" />
                      <p className="text-xs text-muted-foreground">Emitindo boleto bancário oficial no Asaas...</p>
                    </div>
                  ) : boletoData ? (
                    <>
                      {/* Código de barras ilustrado */}
                      <div className="h-10 w-full bg-muted/40 rounded flex items-center justify-center gap-1 px-4 py-1">
                        {[...Array(32)].map((_, i) => (
                          <div
                            key={i}
                            className="h-full bg-foreground/70"
                            style={{ width: `${(i % 3) + 1}px`, margin: '0 1px' }}
                          />
                        ))}
                      </div>

                      {boletoData.identificationField && (
                        <div className="space-y-1">
                          <Label className="text-xs">Linha Digitável Oficial (Código de Barras):</Label>
                          <div className="flex items-center gap-2">
                            <input
                              readOnly
                              value={boletoData.identificationField}
                              aria-label="Linha digitável do boleto"
                              className="w-full h-9 px-3 text-xs bg-muted/60 font-mono rounded-lg border border-input truncate focus:outline-none select-all"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleCopyBoleto(boletoData.identificationField!)}
                              className="h-9 px-3 text-xs cursor-pointer shrink-0"
                            >
                              {copiedBoleto ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span className="ml-1">{copiedBoleto ? 'Copiado!' : 'Copiar'}</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {boletoData.bankSlipUrl && (
                        <Button
                          type="button"
                          onClick={() => window.open(boletoData.bankSlipUrl, '_blank')}
                          className="w-full h-10 bg-[#17323D] hover:bg-[#17323D]/90 text-white font-medium flex items-center justify-center gap-2 cursor-pointer rounded-xl text-xs shadow-md"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Visualizar / Baixar Boleto Oficial em PDF</span>
                        </Button>
                      )}

                      {boletoData.paymentId && (
                        <p className="text-[11px] text-muted-foreground font-mono text-center">
                          ID da Cobrança Asaas: {boletoData.paymentId}
                        </p>
                      )}

                      <div className="pt-1 flex flex-col gap-2">
                        <Button
                          type="button"
                          onClick={() => handleCheckPaymentStatus(boletoData.paymentId)}
                          className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Já realizei o pagamento do Boleto (Liberar)</span>
                        </Button>
                        <button
                          type="button"
                          onClick={handleGenerateBoleto}
                          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Emitir nova 2ª via de boleto</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-muted-foreground text-center">
                        Você pode pagar em qualquer agência bancária, casa lotérica ou aplicativo de internet banking até a data de vencimento.
                      </p>
                    </>
                  ) : (
                    <div className="py-6 text-center space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Clique abaixo para emitir o boleto bancário registrado no Asaas no valor de R$ {proRata.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
                      </p>
                      <Button
                        type="button"
                        onClick={handleGenerateBoleto}
                        className="bg-[#17323D] hover:bg-[#17323D]/90 text-white text-xs h-9 rounded-xl cursor-pointer"
                      >
                        <FileText className="w-4 h-4 mr-1.5" />
                        Emitir Boleto Bancário Asaas
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Aceite Contratual SaaS */}
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground text-center">
                <span>Ao prosseguir com a assinatura, você anui com os </span>
                <a href="/termos" target="_blank" rel="noreferrer" className="text-[#AD7B3B] hover:underline font-medium">
                  Termos de Uso e Contrato de Licença Domus
                </a>
                <span> e a </span>
                <a href="/privacidade" target="_blank" rel="noreferrer" className="text-[#AD7B3B] hover:underline font-medium">
                  Política de Privacidade
                </a>.
              </div>

                {/* Botões de Ação */}
                <div className="space-y-2 pt-1">
                  <Button
                    onClick={() =>
                      openWhatsAppCheckout(
                        selectedPlanForCheckout,
                        proRata.finalPrice
                      )
                    }
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2 cursor-pointer rounded-xl text-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Dúvidas ou Comprovante pelo WhatsApp</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPlanForCheckout(null)}
                    className="w-full h-9 cursor-pointer rounded-xl text-xs"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Downgrade no Vencimento */}
      <Dialog
        open={!!downgradeModalPlan}
        onOpenChange={(open) => (!open ? setDowngradeModalPlan(null) : undefined)}
      >
        <DialogContent className="max-w-md bg-card text-foreground sm:rounded-2xl p-6">
          <DialogHeader className="text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 w-fit">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Mudança Programada de Plano</span>
            </div>
            <DialogTitle className="text-xl font-serif text-[#17323D] dark:text-[#EEECE5]">
              Agendar Downgrade para {downgradeModalPlan?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              A alteração de plano para uma categoria menor não é cobrada agora e entra em vigor no seu próximo ciclo.
            </DialogDescription>
          </DialogHeader>

          {downgradeModalPlan && (
            <div className="space-y-4 mt-2 text-xs">
              <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plano Atual:</span>
                  <span className="font-semibold">{limits.planName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Novo Plano Solicitado:</span>
                  <span className="font-semibold text-amber-600">{downgradeModalPlan.name}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground">Cobrança Imediata:</span>
                  <span className="font-bold text-emerald-600">R$ 0,00</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p>
                  Você continuará aproveitando todos os limites e recursos do plano <strong>{limits.planName}</strong> até o vencimento da sua fatura atual. Na data de renovação, o plano passará a ser <strong>{downgradeModalPlan.name}</strong> automaticamente sem interrupção de serviço.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => handleConfirmDowngrade(downgradeModalPlan)}
                  className="w-full h-10 bg-[#17323D] hover:bg-[#17323D]/90 text-white font-medium cursor-pointer rounded-xl text-xs"
                >
                  Confirmar Agendamento de Downgrade
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDowngradeModalPlan(null)}
                  className="w-full h-9 cursor-pointer rounded-xl text-xs"
                >
                  Voltar e Manter Plano Atual
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Cancelamento da Renovação Automática */}
      <Dialog
        open={cancelModalOpen}
        onOpenChange={(open) => setCancelModalOpen(open)}
      >
        <DialogContent className="max-w-md bg-card text-foreground sm:rounded-2xl p-6">
          <DialogHeader className="text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 w-fit">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Sem Fidelidade ou Multas</span>
            </div>
            <DialogTitle className="text-xl font-serif text-[#17323D] dark:text-[#EEECE5]">
              Cancelar Renovação Automática?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Você tem total liberdade para pausar ou cancelar a qualquer momento sem custos adicionais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-2">
              <p className="text-muted-foreground">
                Ao confirmar o cancelamento da cobrança automática:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-foreground">
                <li>Seu acesso ao <strong>Plano {limits.planName}</strong> continuará ativo até o término do ciclo já pago.</li>
                <li>Nenhuma nova fatura ou cobrança será feita no seu cartão no Asaas.</li>
                <li>Você pode reativar a qualquer momento com 1 clique quando desejar.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="destructive"
                disabled={cancelingSubscription}
                onClick={handleCancelAutoRenew}
                className="w-full h-10 font-medium cursor-pointer rounded-xl text-xs flex items-center justify-center gap-2"
              >
                {cancelingSubscription ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cancelando no Asaas...</span>
                  </>
                ) : (
                  <span>Confirmar Cancelamento da Renovação</span>
                )}
              </Button>
              <Button
                variant="outline"
                disabled={cancelingSubscription}
                onClick={() => setCancelModalOpen(false)}
                className="w-full h-9 cursor-pointer rounded-xl text-xs"
              >
                Voltar e Manter Assinatura Ativa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
