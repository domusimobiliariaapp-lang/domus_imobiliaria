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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!serviceKey) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, 503)

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const payload = await req.json()
    const {
      name,
      email,
      password,
      phone = '',
      agencyName,
      subdomain,
      portfolioSize = '31-100',
      planId = 'lifetime',
      paymentMethod = 'pix',
      isDirectPurchase = true,
    } = payload

    if (!email || !agencyName || !subdomain) {
      return json({ error: 'Dados obrigatórios incompletos (email, imobiliária, subdomínio).' }, 400)
    }

    const cleanSlug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')

    // 1. Cria ou busca a organização
    let orgId = ''
    const { data: existingOrg } = await admin
      .from('organizations')
      .select('id, name, slug, plan_id, subscription_status')
      .eq('slug', cleanSlug)
      .maybeSingle()

    if (existingOrg) {
      orgId = existingOrg.id
      // Atualiza plano para lifetime se for compra direta
      if (isDirectPurchase || planId === 'lifetime') {
        await admin
          .from('organizations')
          .update({
            plan_id: 'lifetime',
            name: agencyName,
            phone: phone || existingOrg.phone,
            email: email || existingOrg.email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId)
      }
    } else {
      const { data: newOrg, error: orgError } = await admin
        .from('organizations')
        .insert({
          name: agencyName,
          slug: cleanSlug,
          phone,
          email,
          active: true,
          plan_id: isDirectPurchase ? 'lifetime' : planId,
          subscription_status: 'trial',
        })
        .select('id, name, slug')
        .single()

      if (orgError) {
        console.error('[saas-signup] Erro ao criar organização:', orgError)
        return json({ error: `Erro ao criar imobiliária: ${orgError.message}` }, 500)
      }
      orgId = newOrg.id
    }

    // 2. Cria ou atualiza o usuário no Auth (GARANTINDO SEMPRE ROLE ADMIN)
    let userId = ''
    const userPassword = password && password.length >= 8 ? password : `Domus@${Math.floor(100000 + Math.random() * 900000)}`

    // Verifica se usuário já existe
    const { data: userListData } = await admin.auth.admin.listUsers()
    const existingUser = userListData?.users?.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    )

    if (existingUser) {
      userId = existingUser.id
      // Promove explicitamente para ADMIN da organização no app_metadata!
      await admin.auth.admin.updateUserById(userId, {
        password: userPassword,
        email_confirm: true,
        user_metadata: { full_name: name, phone },
        app_metadata: { role: 'admin', org_id: orgId },
      })
      console.log(`[saas-signup] Usuário existente ${email} promovido para admin da org ${cleanSlug}.`)
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: email.trim(),
        password: userPassword,
        email_confirm: true,
        user_metadata: { full_name: name, phone },
        app_metadata: { role: 'admin', org_id: orgId },
      })

      if (createError) {
        console.error('[saas-signup] Erro ao criar usuário no Auth:', createError)
        return json({ error: `Erro ao criar conta de acesso: ${createError.message}` }, 500)
      }
      userId = created.user.id
      console.log(`[saas-signup] Usuário ${email} criado como admin da org ${cleanSlug}.`)
    }

    // 3. Atualiza ou insere na tabela profiles com role 'admin' e is_client = false
    await admin.from('profiles').upsert({
      id: userId,
      email: email.trim(),
      full_name: name || agencyName,
      role: 'admin',
      org_id: orgId,
      is_client: false,
      updated_at: new Date().toISOString(),
    })

    // 4. Salva ou atualiza saas_leads com status 'novo' (válido pelo check constraint)
    await admin.from('saas_leads').insert({
      name,
      email: email.trim(),
      phone,
      agency_name: agencyName,
      subdomain: cleanSlug,
      portfolio_size: portfolioSize,
      plan_id: isDirectPurchase ? 'lifetime' : planId,
      status: 'novo',
      notes: `[CADASTRO SAAS DIRETO] Forma: ${paymentMethod.toUpperCase()} • Organização: ${orgId} • Role: admin • Criado em ${new Date().toLocaleString('pt-BR')}`,
    })

    return json({
      success: true,
      orgId,
      userId,
      role: 'admin',
      slug: cleanSlug,
      message: 'Organização e conta de Administrador criadas com sucesso!',
    })
  } catch (err: any) {
    console.error('[saas-signup] Exceção:', err)
    return json({ error: err.message || 'Erro interno no cadastro.' }, 500)
  }
})
