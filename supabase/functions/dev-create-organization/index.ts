import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': import.meta.env.VITE_APP_URL ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Mesmo padrão de validação do CHECK da tabela: minúsculo, hífen, 2-40 chars.
const SLUG_RE = /^[a-z0-9-]{2,40}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!serviceKey) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, 503)

    const authorization = req.headers.get('Authorization') || ''
    if (!authorization) return json({ error: 'Sessão inválida.' }, 401)

    // ------------------------------------------------------------------------
    // Autorização primeiro, e com o token do CHAMADOR — nunca com a service role.
    //
    // A service role contorna a RLS, então a checagem is_dev() é a única coisa
    // segurando esta função. Precisa vir antes de qualquer leitura do body, e
    // precisa usar um cliente que respeite RLS para não poder se autoaprovar.
    // ------------------------------------------------------------------------
    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })

    const { data: { user }, error: authError } = await callerClient.auth.getUser(
      authorization.replace(/^Bearer\s+/i, ''),
    )
    if (authError || !user) return json({ error: 'Sessão inválida. Entre novamente.' }, 401)

    const { data: isDev, error: devError } = await callerClient.rpc('is_dev')
    if (devError) return json({ error: 'Falha ao verificar permissões.' }, 500)
    if (isDev !== true) return json({ error: 'Apenas a conta DEV pode criar imobiliárias.' }, 403)

    // A partir daqui a service role é legítima.
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return json({ error: 'JSON inválido.' }, 400)
    }

    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const adminName = typeof body.admin_name === 'string' ? body.admin_name.trim() : ''
    const email = typeof body.admin_email === 'string' ? body.admin_email.trim().toLowerCase() : ''
    const password = typeof body.admin_password === 'string' ? body.admin_password : ''
    const planId = typeof body.plan_id === 'string' ? body.plan_id.trim() : 'pro'
    const subscriptionStatus = typeof body.subscription_status === 'string' ? body.subscription_status.trim() : 'active'

    if (!SLUG_RE.test(slug)) {
      return json({ error: 'Slug inválido: use de 2 a 40 caracteres minúsculos, números e hífens.' }, 400)
    }
    if (name.length < 2 || name.length > 120) {
      return json({ error: 'Informe o nome da imobiliária (entre 2 e 120 caracteres).' }, 400)
    }
    if (adminName.length < 2) {
      return json({ error: 'Informe o nome do administrador.' }, 400)
    }
    if (!EMAIL_RE.test(email)) {
      return json({ error: 'Informe um e-mail válido para o administrador.' }, 400)
    }
    if (password.length < 8) {
      return json({ error: 'A senha do administrador deve ter ao menos 8 caracteres.' }, 400)
    }

    const { data: existing } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (existing) return json({ error: 'Já existe uma imobiliária com este slug.' }, 409)

    // app_metadata, e não user_metadata: só a service role escreve aqui, e é
    // daqui que o handle_new_user() lê a role e a org. Um cliente que se
    // cadastrasse não conseguiria se colocar como admin de outra imobiliária.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: adminName },
      app_metadata: { role: 'admin' },
    })

    if (createError) {
      const message = createError.message.toLowerCase()
      if (message.includes('already') || message.includes('registered')) {
        return json({ error: 'Já existe uma conta com este e-mail.' }, 409)
      }
      console.error('Falha ao criar usuário admin:', createError.message)
      return json({ error: `Não foi possível criar a conta do administrador: ${createError.message}` }, 500)
    }

    // O trigger handle_new_user deveria criar a linha em profiles. Se ele falhar,
    // o UPDATE logo abaixo não daria erro — afetaria zero linhas e a função
    // reportaria sucesso, deixando um admin sem org, que não enxerga nada.
    //
    // Em vez de abortar, criamos o profile aqui. A trigger é conveniência, não
    // requisito: o que importa é que exista profile, e a service role escreve
    // sem passar pela RLS. O motivo da falha da trigger fica registrado em
    // app_error_logs para ser investigado sem interromper o cadastro.
    const { data: profileRow } = await admin
      .from('profiles')
      .select('id')
      .eq('id', created!.user.id)
      .maybeSingle()

    if (!profileRow) {
      const { error: insertError } = await admin.from('profiles').insert({
        id: created!.user.id,
        role: 'admin',
        full_name: adminName || email,
        email,
      })

      if (insertError) {
        await admin.auth.admin.deleteUser(created!.user.id)
        console.error('Falha ao criar profile:', insertError.message)
        return json({
          error: `Não foi possível criar o perfil: ${insertError.message}`,
        }, 500)
      }

      await admin.from('app_error_logs').insert({
        source: 'edge:dev-create-organization',
        message: 'A trigger handle_new_user não criou o profile; criado manualmente.',
        severity: 'warning',
        context: { email },
      })
    }

    // A org nasce aqui, não antes: se a criação da conta falhar, não sobra uma
    // imobiliária órfã.
    const trialEndsAt = subscriptionStatus === 'trial'
      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        slug,
        name,
        plan_id: planId,
        subscription_status: subscriptionStatus,
        trial_ends_at: trialEndsAt,
      })
      .select()
      .single()

    if (orgError || !org) {
      // Compensa: remove a conta recém-criada para não deixar admin sem org.
      if (created?.user) await admin.auth.admin.deleteUser(created.user.id)
      console.error('Falha ao criar organização:', orgError?.message)
      return json({ error: 'Não foi possível criar a imobiliária.' }, 500)
    }

    // Vincula admin + org no profile e no app_metadata. O app_metadata é o que
    // o handle_new_user() lê: assim, se a conta for recriada, ela já nasce
    // admin da org certa em vez de precisar deste UPDATE.
    // O .select() é necessário: sem ele, um UPDATE que casa zero linhas
    // retorna error=null, e a função seguiria como se tivesse vinculado.
    const { data: linked, error: linkError } = await admin
      .from('profiles')
      .update({ role: 'admin', org_id: org.id, full_name: adminName })
      .eq('id', created!.user.id)
      .select('id, org_id, role')
      .single()

    if (linkError || !linked) {
      await admin.auth.admin.deleteUser(created!.user.id)
      await admin.from('organizations').delete().eq('id', org.id)
      console.error('Falha ao vincular admin à organização:', linkError.message)
      return json({ error: 'Não foi possível vincular o administrador à imobiliária.' }, 500)
    }

    // Deixa o app_metadata consistente com o profile, para que a conta se
    // comporte corretamente mesmo que seja recriada depois.
    await admin.auth.admin.updateUserById(created!.user.id, {
      app_metadata: { role: 'admin', org_id: org.id },
    })

    // company_settings é lido pela tela administrativa e pela vitrine pública.
    const { error: settingsError } = await admin.from('company_settings').insert({
      org_id: org.id,
      company_name: name,
    })

    if (settingsError) {
      await admin.auth.admin.deleteUser(created!.user.id)
      await admin.from('organizations').delete().eq('id', org.id)
      console.error('Falha ao criar configurações da organização:', settingsError.message)
      return json({ error: 'Não foi possível criar as configurações da imobiliária.' }, 500)
    }

    return json({
      success: true,
      organization: { id: org.id, slug: org.slug, name: org.name },
      admin: { id: created!.user.id, email },
    })
  } catch (error) {
    console.error(
      'Erro em dev-create-organization:',
      error instanceof Error ? error.name : 'Erro desconhecido',
    )
    return json({ error: 'Erro interno do servidor.' }, 500)
  }
})
