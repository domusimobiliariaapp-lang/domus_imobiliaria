import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!serviceKey) return json({ error: 'Service role key não configurada.' }, 503)

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    const payload = await req.json()
    const event = payload.event
    const payment = payload.payment || {}

    console.log(`[Asaas Webhook] Evento recebido: ${event}`, {
      paymentId: payment.id,
      value: payment.value,
      externalReference: payment.externalReference,
    })

    // Eventos que confirmam pagamento e liberam o sistema
    const isPaymentSuccess = event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED'

    if (isPaymentSuccess) {
      const extRef = (payment.externalReference || '').trim()
      let orgId = extRef

      if (extRef.startsWith('org:')) {
        orgId = extRef.replace(/^org:/, '')
      }

      // 1. Tenta localizar a organização pelo ID ou pelo Slug
      let orgMatch = null
      if (orgId) {
        const { data } = await admin
          .from('organizations')
          .select('id, name, slug, plan_id, subscription_status')
          .or(`id.eq.${orgId},slug.eq.${orgId}`)
          .maybeSingle()
        orgMatch = data
      }

      // 2. Se não achou por ID/Slug, tenta por e-mail nos leads
      if (!orgMatch && payment.customer) {
        // Tenta achar lead com esse e-mail ou externalReference
        const { data: lead } = await admin
          .from('saas_leads')
          .select('*')
          .or(`id.eq.${extRef},email.eq.${payment.customerEmail || ''}`)
          .maybeSingle()

        if (lead) {
          // Atualiza o lead como convertido
          await admin
            .from('saas_leads')
            .update({
              status: 'convertido',
              notes: `Pagamento Asaas confirmado (${payment.id}) no valor de R$ ${payment.value}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', lead.id)

          // Procura se já tem organização criada com esse subdomain
          const { data: orgBySlug } = await admin
            .from('organizations')
            .select('id, name, slug')
            .eq('slug', lead.subdomain)
            .maybeSingle()

          orgMatch = orgBySlug
        }
      }

      if (orgMatch) {
        // Define o plano com base na descrição ou valor
        const desc = (payment.description || '').toLowerCase()
        const isLifetime =
          payment.value >= 2500 ||
          desc.includes('vital') ||
          desc.includes('vitalício')

        const detectedPlan = isLifetime
          ? 'lifetime'
          : desc.includes('enterprise')
          ? 'enterprise'
          : desc.includes('starter')
          ? 'starter'
          : desc.includes('pro') || desc.includes('profissional')
          ? 'pro'
          : undefined

        const updateData: Record<string, unknown> = {
          subscription_status: 'active',
          trial_ends_at: null,
          updated_at: new Date().toISOString(),
        }

        if (detectedPlan) {
          updateData.plan_id = detectedPlan
        }

        const { error: updateError } = await admin
          .from('organizations')
          .update(updateData)
          .eq('id', orgMatch.id)

        if (updateError) {
          console.error('[Asaas Webhook] Erro ao ativar organização:', updateError)
          return json({ error: 'Erro ao ativar organização' }, 500)
        }

        console.log(`[Asaas Webhook] SUCESSO: Organização ${orgMatch.name} (${orgMatch.id}) ativada com sucesso!`)

        return json({
          success: true,
          activated: true,
          orgId: orgMatch.id,
          orgName: orgMatch.name,
        })
      } else {
        console.warn(`[Asaas Webhook] Organização não identificada para o externalReference: ${extRef}`)
      }
    }

    // Tratamento de Inadimplência / Atraso (Carência de 5 dias)
    if (event === 'PAYMENT_OVERDUE') {
      const extRef = (payment.externalReference || '').replace(/^org:/, '').trim()
      if (extRef) {
        await admin
          .from('organizations')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${extRef},slug.eq.${extRef}`)
        console.log(`[Asaas Webhook] Organização ${extRef} marcada como past_due por atraso de fatura.`)
      }
    }

    // Tratamento de Cancelamento de Assinatura
    if (event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_INACTIVATED') {
      const extRef = (payment.externalReference || '').replace(/^org:/, '').trim()
      if (extRef) {
        await admin
          .from('organizations')
          .update({
            subscription_status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${extRef},slug.eq.${extRef}`)
        console.log(`[Asaas Webhook] Assinatura da organização ${extRef} cancelada.`)
      }
    }

    return json({ success: true, processed: true, event })
  } catch (err: any) {
    console.error('[Asaas Webhook] Exceção:', err)
    return json({ error: err.message }, 500)
  }
})
