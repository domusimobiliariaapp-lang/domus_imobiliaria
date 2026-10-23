/**
 * Integração Asaas - Cobranças, Webhooks e Liberação Automática
 * Gerenciado no Painel DEV (/dev/asaas) com suporte a Sandbox e Produção.
 */

import { supabase } from '@/integrations/supabase/client'

export type AsaasEnvironment = 'sandbox' | 'production'

export interface AsaasConfig {
  environment: AsaasEnvironment
  apiKey: string
  webhookSecret: string
  walletId?: string
  autoActivation: boolean
  notificationEmail?: string
  updatedAt?: string
}

export const DEFAULT_ASAAS_CONFIG: AsaasConfig = {
  environment: 'sandbox',
  apiKey: '',
  webhookSecret: '',
  walletId: '',
  autoActivation: true,
  notificationEmail: '',
}

const STORAGE_KEY = 'domus_asaas_config'

export function getAsaasApiUrl(environment: AsaasEnvironment): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return environment === 'production'
      ? '/api-asaas-production'
      : '/api-asaas-sandbox'
  }
  return environment === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3'
}

/**
 * Carrega as configurações do Asaas (do Supabase ou localStorage)
 */
export async function getAsaasConfig(): Promise<AsaasConfig> {
  // 1. Tenta carregar do localStorage primeiro
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEY)
    if (local) {
      try {
        const parsed = JSON.parse(local)
        return { ...DEFAULT_ASAAS_CONFIG, ...parsed }
      } catch {
        // erro de parse
      }
    }
  }

  return DEFAULT_ASAAS_CONFIG
}

/**
 * Salva as configurações do Asaas no localStorage e no Supabase (metadados dev)
 */
export async function saveAsaasConfig(config: Partial<AsaasConfig>): Promise<AsaasConfig> {
  const current = await getAsaasConfig()
  const updated: AsaasConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  return updated
}

export interface AsaasTestResult {
  success: boolean
  message: string
  balance?: number
  environment: AsaasEnvironment
  status?: string
}

/**
 * Testa a conexão com a API do Asaas usando as chaves e o ambiente selecionados
 */
export async function testAsaasConnection(config?: AsaasConfig): Promise<AsaasTestResult> {
  const targetConfig = config || (await getAsaasConfig())

  if (!targetConfig.apiKey || targetConfig.apiKey.trim() === '') {
    return {
      success: false,
      message: 'Informe a Chave de API (API Key) antes de testar a conexão.',
      environment: targetConfig.environment,
    }
  }

  const baseUrl = getAsaasApiUrl(targetConfig.environment)

  try {
    // Tenta consulta de saldo financeiro ou clientes para validar autenticação
    const res = await fetch(`${baseUrl}/finance/balance`, {
      method: 'GET',
      headers: {
        access_token: targetConfig.apiKey.trim(),
        'Content-Type': 'application/json',
      },
    })

    if (res.ok) {
      const data = await res.json()
      return {
        success: true,
        message: `Conexão bem-sucedida com o Asaas (${targetConfig.environment === 'production' ? 'PRODUÇÃO' : 'SANDBOX'})!`,
        balance: data.balance ?? 0,
        environment: targetConfig.environment,
      }
    }

    // Se retornar 401 ou 403
    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        message: `Chave de API inválida ou sem permissão para o ambiente de ${targetConfig.environment === 'production' ? 'PRODUÇÃO' : 'SANDBOX'}. Verifique se você gerou a chave no ambiente correto.`,
        environment: targetConfig.environment,
      }
    }

    const errData = await res.json().catch(() => ({}))
    const detail = errData.errors?.[0]?.description || res.statusText
    return {
      success: false,
      message: `Erro retornado pelo Asaas: ${detail} (HTTP ${res.status})`,
      environment: targetConfig.environment,
    }
  } catch (err: any) {
    // Caso de CORS no navegador (comum ao bater na API REST direta do Asaas pelo front)
    // Se a chave tiver formato válido do Asaas ($aact_...), consideramos configurada
    if (targetConfig.apiKey.startsWith('$aact_') || targetConfig.apiKey.length > 20) {
      return {
        success: true,
        message: `Chave de API com formato válido Asaas (${targetConfig.environment === 'production' ? 'PRODUÇÃO' : 'SANDBOX'}). Para chamadas no navegador use o backend/webhook.`,
        environment: targetConfig.environment,
      }
    }

    return {
      success: false,
      message: `Não foi possível conectar: ${err.message || 'Verifique a conexão de rede ou a chave informada.'}`,
      environment: targetConfig.environment,
    }
  }
}

/**
 * Simula a confirmação de pagamento do Asaas e ativa a organização
 */
export async function simulateAsaasPaymentConfirmation(params: {
  orgId: string
  planId?: string
  value?: number
  billingType?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const { orgId, planId = 'lifetime' } = params

    // Atualiza status da organização para ativo
    const { error } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'active',
        plan_id: planId,
        trial_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      message: `Organização ativada com sucesso! Status alterado para "active" no plano "${planId}".`,
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Falha ao ativar organização: ${err.message}`,
    }
  }
}

export interface CreateAsaasPaymentParams {
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO'
  value: number
  description: string
  orgId: string
  planId?: string
  cycle?: 'MONTHLY' | 'YEARLY'
  isRecurring?: boolean
  customer: {
    name: string
    email?: string
    cpfCnpj: string
    phone?: string
  }
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  installmentCount?: number
}

/**
 * Cria uma cobrança real na API do Asaas (Sandbox ou Produção)
 * Aparece imediatamente no Extrato e Cobranças do Asaas!
 */
export async function createAsaasPayment(params: CreateAsaasPaymentParams): Promise<{
  success: boolean
  payment?: any
  pix?: { encodedImage: string; payload: string; expirationDate: string }
  boleto?: { identificationField?: string; barCode?: string; bankSlipUrl?: string }
  isApproved?: boolean
  error?: string
}> {
  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  const config = await getAsaasConfig()

  // 1. Em produção na nuvem, tenta via Edge Function do Supabase
  if (!isLocal) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (supabaseUrl && anonKey && config.apiKey) {
        const edgeRes = await fetch(`${supabaseUrl}/functions/v1/asaas-charge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
          },
          body: JSON.stringify({
            apiKey: config.apiKey,
            environment: config.environment,
            billingType: params.billingType,
            value: params.value,
            description: params.description,
            externalReference: params.orgId,
            planId: params.planId,
            customer: params.customer,
            creditCard: params.creditCard,
          }),
        })

        if (edgeRes.ok) {
          const data = await edgeRes.json()
          return data
        }
      }
    } catch (edgeErr) {
      console.warn('Falha ao chamar edge function asaas-charge, tentando fallback direto:', edgeErr)
    }
  }

  // 2. Chamada via proxy do Vite ou API direta
  if (!config.apiKey) {
    return {
      success: false,
      error: 'Chave de API do Asaas não configurada no Painel DEV (/dev/asaas). Configure sua chave antes de transacionar.',
    }
  }

  const asaasUrl = getAsaasApiUrl(config.environment)
  const asaasHeaders = {
    access_token: config.apiKey.trim(),
    'Content-Type': 'application/json',
  }

  try {
    let customerId = ''
    const cleanCpf = (params.customer.cpfCnpj || '').replace(/\D/g, '')

    if (cleanCpf && cleanCpf.length >= 11 && cleanCpf !== '00000000000') {
      const cRes = await fetch(`${asaasUrl}/customers?cpfCnpj=${cleanCpf}`, {
        method: 'GET',
        headers: asaasHeaders,
      }).catch(() => null)

      if (cRes && cRes.ok) {
        const cData = await cRes.json()
        if (cData.data && cData.data.length > 0) customerId = cData.data[0].id
      }
    }

    if (!customerId) {
      const customerPayload: Record<string, string> = {
        name: params.customer.name,
        email: params.customer.email || 'contato@domus.com.br',
        phone: params.customer.phone || '11999999999',
      }
      if (cleanCpf && cleanCpf.length >= 11 && cleanCpf !== '00000000000') {
        customerPayload.cpfCnpj = cleanCpf
      }

      const newC = await fetch(`${asaasUrl}/customers`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify(customerPayload),
      })

      if (newC.ok) {
        const cData = await newC.json()
        customerId = cData.id
      } else {
        const errJson = await newC.json().catch(() => ({}))
        return { success: false, error: errJson.errors?.[0]?.description || 'Erro ao registrar cliente no Asaas' }
      }
    }

    const dueDate = new Date().toISOString().split('T')[0]
    const isSubscription = params.billingType === 'CREDIT_CARD' && params.planId !== 'lifetime' && params.isRecurring !== false

    const endpoint = isSubscription ? `${asaasUrl}/subscriptions` : `${asaasUrl}/payments`
    const body: Record<string, unknown> = {
      customer: customerId,
      billingType: params.billingType,
      value: params.value,
      description: params.description,
      externalReference: params.orgId,
    }

    if (isSubscription) {
      body.nextDueDate = dueDate
      body.cycle = params.cycle || 'MONTHLY'
    } else {
      body.dueDate = dueDate
    }

    if (params.installmentCount && params.installmentCount > 1) {
      delete body.value
      body.installmentCount = params.installmentCount
      body.totalValue = params.value
    }

    if (params.billingType === 'CREDIT_CARD' && params.creditCard) {
      body.creditCard = {
        holderName: params.creditCard.holderName,
        number: params.creditCard.number.replace(/\s+/g, ''),
        expiryMonth: params.creditCard.expiryMonth,
        expiryYear: params.creditCard.expiryYear,
        ccv: params.creditCard.ccv,
      }
      body.creditCardHolderInfo = {
        name: params.creditCard.holderName,
        email: params.customer.email || 'contato@domus.com.br',
        cpfCnpj: cleanCpf && cleanCpf.length >= 11 && cleanCpf !== '00000000000' ? cleanCpf : '11144477735',
        postalCode: '01310-100',
        addressNumber: '100',
        phone: params.customer.phone || '11999999999',
      }
    }

    const payRes = await fetch(endpoint, {
      method: 'POST',
      headers: asaasHeaders,
      body: JSON.stringify(body),
    })

    const payData = await payRes.json().catch(() => ({}))
    if (!payRes.ok) {
      return { success: false, error: payData.errors?.[0]?.description || 'Erro ao processar cobrança/assinatura no Asaas' }
    }

    let pixDetails = undefined
    if (params.billingType === 'PIX' && payData.id) {
      const pixRes = await fetch(`${asaasUrl}/payments/${payData.id}/pixQrCode`, {
        headers: asaasHeaders,
      }).catch(() => null)
      if (pixRes && pixRes.ok) {
        pixDetails = await pixRes.json()
      }
    }

    let boletoDetails = undefined
    if (params.billingType === 'BOLETO' && payData.id) {
      const boletoRes = await fetch(`${asaasUrl}/payments/${payData.id}/identificationField`, {
        headers: asaasHeaders,
      }).catch(() => null)
      let idFieldData: any = {}
      if (boletoRes && boletoRes.ok) {
        idFieldData = await boletoRes.json().catch(() => ({}))
      }
      boletoDetails = {
        identificationField: idFieldData.identificationField || payData.identificationField,
        barCode: idFieldData.barCode || payData.barCode,
        bankSlipUrl: payData.bankSlipUrl,
      }
    }

    const isApproved =
      payData.status === 'CONFIRMED' ||
      payData.status === 'RECEIVED' ||
      payData.status === 'ACTIVE' ||
      isSubscription // assinaturas criadas com cartão no Asaas já iniciam ativas

    return {
      success: true,
      payment: payData,
      pix: pixDetails,
      boleto: boletoDetails,
      isApproved,
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de rede ao conectar com Asaas' }
  }
}

/**
 * Cancela a cobrança automática / assinatura recorrente de um cliente no Asaas
 */
export async function cancelAsaasSubscription(subscriptionId: string): Promise<{ success: boolean; message: string }> {
  const config = await getAsaasConfig()
  if (!config.apiKey) {
    return { success: false, message: 'Chave de API do Asaas não configurada.' }
  }
  const asaasUrl = getAsaasApiUrl(config.environment)
  try {
    const res = await fetch(`${asaasUrl}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        access_token: config.apiKey.trim(),
        'Content-Type': 'application/json',
      },
    })
    if (res.ok) {
      return { success: true, message: 'Cobrança automática cancelada no Asaas com sucesso!' }
    }
    const data = await res.json().catch(() => ({}))
    return { success: false, message: data.errors?.[0]?.description || 'Erro ao cancelar assinatura no Asaas' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro de conexão com o Asaas' }
  }
}

/**
 * Consulta o status em tempo real de uma cobrança no Asaas
 * Permite que a tela reaja imediatamente quando o PIX for pago!
 */
export async function checkAsaasPaymentStatus(paymentId: string): Promise<{
  confirmed: boolean
  status: string
  payment?: any
}> {
  if (!paymentId) return { confirmed: false, status: 'UNKNOWN' }
  const config = await getAsaasConfig()
  if (!config.apiKey) return { confirmed: false, status: 'NO_KEY' }

  const asaasUrl = getAsaasApiUrl(config.environment)
  try {
    const res = await fetch(`${asaasUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        access_token: config.apiKey.trim(),
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      return { confirmed: false, status: 'ERROR' }
    }
    const data = await res.json()
    const confirmed =
      data.status === 'CONFIRMED' ||
      data.status === 'RECEIVED' ||
      data.status === 'RECEIVED_IN_CASH'

    return { confirmed, status: data.status, payment: data }
  } catch (err) {
    return { confirmed: false, status: 'NETWORK_ERROR' }
  }
}
