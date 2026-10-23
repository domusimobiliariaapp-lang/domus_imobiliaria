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

// Validador de formato UUID para evitar erro de sintaxe no Postgres (22P02: invalid input syntax for type uuid)
const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

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
      customer: payment.customer,
    })

    // Eventos que confirmam pagamento e liberam o sistema
    const isPaymentSuccess = event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED'

    if (isPaymentSuccess) {
      const extRef = (payment.externalReference || '').replace(/^org:/, '').trim()

      // 1. Tenta localizar a organização pelo ID ou pelo Slug
      let orgMatch = null
      if (extRef) {
        let query = admin
          .from('organizations')
          .select('id, name, slug, plan_id, subscription_status')

        if (isUuid(extRef)) {
          query = query.eq('id', extRef)
        } else {
          query = query.eq('slug', extRef.toLowerCase())
        }

        const { data, error } = await query.maybeSingle()
        if (error) {
          console.warn('[Asaas Webhook] Erro ao buscar organização:', error)
        }
        orgMatch = data
      }

      // 2. Se não achou por ID/Slug, tenta localizar nos leads (Landing Page)
      if (!orgMatch) {
        const customerEmail = (payment.customerEmail || payment.email || '').trim().toLowerCase()
        
        let leadQuery = admin.from('saas_leads').select('*')
        if (extRef) {
          if (isUuid(extRef)) {
            leadQuery = leadQuery.eq('id', extRef)
          } else {
            leadQuery = leadQuery.eq('subdomain', extRef.toLowerCase())
          }
        } else if (customerEmail) {
          leadQuery = leadQuery.eq('email', customerEmail)
        } else {
          // Se não veio extRef nem email na cobrança direta: busca o pedido de compra mais recente
          leadQuery = leadQuery.eq('status', 'compra_iniciada')
        }

        const { data: lead } = await leadQuery.order('created_at', { ascending: false }).limit(1).maybeSingle()

        if (lead) {
          // Atualiza o lead como convertido
          await admin
            .from('saas_leads')
            .update({
              status: 'convertido',
              notes: `Pagamento Asaas confirmado (${payment.id}) no valor de R$ ${payment.value}. Ativado via Webhook em ${new Date().toLocaleString('pt-BR')}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', lead.id)

          // Procura se já tem organização criada com esse subdomain
          const { data: orgBySlug } = await admin
            .from('organizations')
            .select('id, name, slug, plan_id, subscription_status')
            .eq('slug', lead.subdomain.toLowerCase())
            .maybeSingle()

          if (orgBySlug) {
            orgMatch = orgBySlug
          } else {
            // Se a organização ainda não existia, cria-a automaticamente no banco!
            console.log(`[Asaas Webhook] Auto-criando organização para o lead ${lead.name} (${lead.subdomain})`)
            const { data: createdOrg, error: createOrgError } = await admin
              .from('organizations')
              .insert({
                name: lead.agency_name || lead.name,
                slug: lead.subdomain.toLowerCase(),
                plan_id: 'lifetime',
                subscription_status: 'active',
              })
              .select('id, name, slug, plan_id, subscription_status')
              .single()

            if (!createOrgError && createdOrg) {
              orgMatch = createdOrg
              
              // Cria ou atualiza o usuário administrador do lead
              try {
                const tempPassword = `Domus@${Math.floor(100000 + Math.random() * 900000)}`
                await admin.auth.admin.createUser({
                  email: lead.email,
                  password: tempPassword,
                  email_confirm: true,
                  user_metadata: { name: lead.name, phone: lead.phone },
                  app_metadata: { role: 'admin', org_id: createdOrg.id },
                })
                console.log(`[Asaas Webhook] Usuário administrador ${lead.email} criado com sucesso.`)
              } catch (userErr) {
                console.warn('[Asaas Webhook] Usuário já existia ou erro ao criar:', userErr)
              }
            } else {
              console.error('[Asaas Webhook] Erro ao criar organização para o lead:', createOrgError)
            }
          }
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
          : 'lifetime'

        const updateData: Record<string, unknown> = {
          subscription_status: 'active',
          trial_ends_at: null,
          plan_id: detectedPlan,
          updated_at: new Date().toISOString(),
        }

        const { error: updateError } = await admin
          .from('organizations')
          .update(updateData)
          .eq('id', orgMatch.id)

        if (updateError) {
          console.error('[Asaas Webhook] Erro ao ativar organização:', updateError)
          return json({ error: 'Erro ao ativar organização' }, 500)
        }

        console.log(`[Asaas Webhook] SUCESSO: Organização ${orgMatch.name} (${orgMatch.id}) ativada no plano ${detectedPlan}!`)

        // 3. Garante que o usuário responsável seja promovido a ADMIN da empresa (nunca cliente!)
        try {
          // Busca o e-mail do lead ou do pagador
          const targetEmail = lead?.email
          const { data: userListData } = await admin.auth.admin.listUsers()

          if (targetEmail && userListData?.users) {
            const foundUser = userListData.users.find(
              (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
            )

            if (foundUser) {
              await admin.auth.admin.updateUserById(foundUser.id, {
                app_metadata: { role: 'admin', org_id: orgMatch.id },
              })
              await admin.from('profiles').update({
                role: 'admin',
                org_id: orgMatch.id,
                is_client: false,
                updated_at: new Date().toISOString(),
              }).eq('id', foundUser.id)
              console.log(`[Asaas Webhook] Usuário ${targetEmail} promovido a ADMIN da empresa com sucesso!`)
            }
          }

          // Varre perfis vinculados a esta organização que possam estar marcados como cliente
          const { data: orgProfiles } = await admin
            .from('profiles')
            .select('id, email, role')
            .eq('org_id', orgMatch.id)

          if (orgProfiles && orgProfiles.length > 0) {
            for (const prof of orgProfiles) {
              if (prof.role === 'cliente') {
                await admin.auth.admin.updateUserById(prof.id, {
                  app_metadata: { role: 'admin', org_id: orgMatch.id },
                })
                await admin.from('profiles').update({
                  role: 'admin',
                  is_client: false,
                  updated_at: new Date().toISOString(),
                }).eq('id', prof.id)
                console.log(`[Asaas Webhook] Perfil ${prof.email} corrigido de cliente para ADMIN.`)
              }
            }
          }
        } catch (promoteError) {
          console.warn('[Asaas Webhook] Aviso ao promover usuário a admin:', promoteError)
        }

        return json({
          success: true,
          activated: true,
          orgId: orgMatch.id,
          orgName: orgMatch.name,
          plan: detectedPlan,
        })
      } else {
        console.warn(`[Asaas Webhook] Organização não identificada para o externalReference: ${extRef}`)
      }
    }

    // Tratamento de Inadimplência / Atraso (Carência de 5 dias)
    if (event === 'PAYMENT_OVERDUE') {
      const extRef = (payment.externalReference || '').replace(/^org:/, '').trim()
      if (extRef) {
        let updateQuery = admin.from('organizations').update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        if (isUuid(extRef)) {
          updateQuery = updateQuery.eq('id', extRef)
        } else {
          updateQuery = updateQuery.eq('slug', extRef.toLowerCase())
        }
        await updateQuery
        console.log(`[Asaas Webhook] Organização ${extRef} marcada como past_due por atraso de fatura.`)
      }
    }

    // Tratamento de Cancelamento de Assinatura
    if (event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_INACTIVATED') {
      const extRef = (payment.externalReference || '').replace(/^org:/, '').trim()
      if (extRef) {
        let updateQuery = admin.from('organizations').update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        if (isUuid(extRef)) {
          updateQuery = updateQuery.eq('id', extRef)
        } else {
          updateQuery = updateQuery.eq('slug', extRef.toLowerCase())
        }
        await updateQuery
        console.log(`[Asaas Webhook] Assinatura da organização ${extRef} cancelada.`)
      }
    }

    return json({ success: true, processed: true, event })
  } catch (err: any) {
    console.error('[Asaas Webhook] Exceção:', err)
    return json({ error: err.message }, 500)
  }
})
