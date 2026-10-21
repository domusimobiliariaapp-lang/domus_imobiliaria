import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  try {
    const payload = await req.json()
    const {
      apiKey,
      environment = 'sandbox',
      billingType = 'CREDIT_CARD',
      value,
      description,
      externalReference,
      customer,
      creditCard,
      creditCardHolderInfo,
      planId,
    } = payload

    if (!apiKey) {
      return json({ error: 'Chave de API do Asaas não fornecida.' }, 400)
    }

    const asaasUrl =
      environment === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3'

    const asaasHeaders = {
      access_token: apiKey.trim(),
      'Content-Type': 'application/json',
    }

    // 1. Procura ou cria cliente no Asaas
    let customerId = ''
    const cleanCpf = (customer?.cpfCnpj || '').replace(/\D/g, '')

    if (cleanCpf) {
      try {
        const findRes = await fetch(`${asaasUrl}/customers?cpfCnpj=${cleanCpf}`, {
          method: 'GET',
          headers: asaasHeaders,
        })
        if (findRes.ok) {
          const findData = await findRes.json()
          if (findData.data && findData.data.length > 0) {
            customerId = findData.data[0].id
          }
        }
      } catch (err) {
        console.warn('Erro ao buscar cliente por CPF no Asaas:', err)
      }
    }

    if (!customerId) {
      const createCustRes = await fetch(`${asaasUrl}/customers`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify({
          name: customer?.name || 'Cliente Domus',
          email: customer?.email || 'contato@domusimobiliaria.com.br',
          cpfCnpj: cleanCpf || '00000000000',
          phone: customer?.phone || '11999999999',
          externalReference: externalReference || '',
        }),
      })

      if (!createCustRes.ok) {
        const errCust = await createCustRes.json().catch(() => ({}))
        const msg = errCust.errors?.[0]?.description || 'Erro ao registrar cliente no Asaas'
        return json({ error: msg }, 400)
      }

      const custData = await createCustRes.json()
      customerId = custData.id
    }

    // 2. Data de vencimento (hoje)
    const dueDate = new Date().toISOString().split('T')[0]

    // 3. Monta payload de pagamento
    const paymentBody: Record<string, unknown> = {
      customer: customerId,
      billingType: billingType,
      value: Number(value || 0),
      dueDate: dueDate,
      description: description || 'Assinatura Plano Domus',
      externalReference: externalReference || '',
    }

    if (billingType === 'CREDIT_CARD' && creditCard) {
      paymentBody.creditCard = {
        holderName: creditCard.holderName,
        number: creditCard.number.replace(/\s+/g, ''),
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv,
      }
      paymentBody.creditCardHolderInfo = {
        name: creditCardHolderInfo?.name || creditCard.holderName,
        email: creditCardHolderInfo?.email || customer?.email || 'contato@domusimobiliaria.com.br',
        cpfCnpj: cleanCpf || creditCardHolderInfo?.cpfCnpj?.replace(/\D/g, '') || '00000000000',
        postalCode: creditCardHolderInfo?.postalCode || '01310-100',
        addressNumber: creditCardHolderInfo?.addressNumber || '100',
        phone: creditCardHolderInfo?.phone || customer?.phone || '11999999999',
      }
    }

    // 4. Cria a cobrança no Asaas
    const payRes = await fetch(`${asaasUrl}/payments`, {
      method: 'POST',
      headers: asaasHeaders,
      body: JSON.stringify(paymentBody),
    })

    const payData = await payRes.json().catch(() => ({}))

    if (!payRes.ok) {
      const msg = payData.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas'
      return json({ error: msg, details: payData }, 400)
    }

    let pixDetails = null
    // Se for PIX, busca o QR Code e código Copia e Cola
    if (billingType === 'PIX' && payData.id) {
      try {
        const pixRes = await fetch(`${asaasUrl}/payments/${payData.id}/pixQrCode`, {
          method: 'GET',
          headers: asaasHeaders,
        })
        if (pixRes.ok) {
          pixDetails = await pixRes.json()
        }
      } catch (err) {
        console.warn('Erro ao obter QR Code PIX:', err)
      }
    }

    // Se o pagamento no cartão já foi confirmado ou recebido, atualiza a organização no Supabase
    const isApproved =
      payData.status === 'CONFIRMED' ||
      payData.status === 'RECEIVED' ||
      payData.status === 'ACTIVE'

    if (isApproved && externalReference) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (supabaseUrl && serviceKey) {
          const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
          await admin
            .from('organizations')
            .update({
              subscription_status: 'active',
              plan_id: planId || 'pro',
              trial_ends_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', externalReference)
        }
      } catch (err) {
        console.error('Erro ao atualizar organização após cobrança Asaas:', err)
      }
    }

    return json({
      success: true,
      payment: payData,
      pix: pixDetails,
      isApproved,
    })
  } catch (err: any) {
    return json({ error: err.message || 'Erro inesperado ao processar Asaas.' }, 500)
  }
})
