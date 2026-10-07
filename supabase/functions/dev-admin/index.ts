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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Traduz erro do auth admin para português, sem vazar detalhe interno. */
function authMessage(code: string, fallback: string): string {
  switch (code) {
    case 'email_exists':
      return 'Já existe uma conta com este e-mail.'
    case 'email_not_confirmed':
      return 'O e-mail desta conta ainda não foi confirmado.'
    case 'user_not_found':
      return 'Conta não encontrada.'
    case 'weak_password':
      return 'A senha é muito fraca. Use ao menos 8 caracteres.'
    default:
      return fallback
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  const adminActions = new Set([
    'list_users',
    'create_user',
    'update_user',
    'set_password',
    'toggle_active',
    'delete_user',
    'delete_organization',
    'update_organization',
    'clear_error_logs',
  ])

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!serviceKey) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, 503)

    const authorization = req.headers.get('Authorization') || ''
    if (!authorization) return json({ error: 'Sessão inválida.' }, 401)

    // Autorização com o token de quem chama, antes de qualquer uso da service
    // role. A service role ignora a RLS, então esta checagem é a única
    // barreira entre a internet e auth.admin.
    const caller = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user: callerUser }, error: authError } = await caller.auth.getUser(
      authorization.replace(/^Bearer\s+/i, ''),
    )
    if (authError || !callerUser) return json({ error: 'Sessão inválida. Entre novamente.' }, 401)

    const { data: isDev, error: devError } = await caller.rpc('is_dev')
    if (devError) return json({ error: 'Falha ao verificar permissões.' }, 500)
    if (isDev !== true) return json({ error: 'Apenas a conta DEV pode gerenciar contas.' }, 403)

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return json({ error: 'JSON inválido.' }, 400)
    }

    const action = typeof body.action === 'string' ? body.action : ''
    if (!adminActions.has(action)) return json({ error: 'Ação desconhecida.' }, 400)

    // ------------------------------------------------------------------
    // Ações somente-leitura
    // ------------------------------------------------------------------

    if (action === 'list_users') {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
      if (error) return json({ error: 'Não foi possível listar as contas.' }, 500)

      // O perfil traz org_id e role; o histórico de login só existe em
      // auth.users, que o browser não lê.
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, role, full_name, email, org_id, created_at')

      const byId = new Map((profiles ?? []).map((p) => [p.id, p]))

      const users = data.users.map((u) => {
        const profile = byId.get(u.id) as Record<string, unknown> | undefined
        return {
          id: u.id,
          email: u.email,
          // Um usuário que nunca entrou no app não tem profile de forma útil;
          // mostrar os dados do auth evita uma linha vazia na tabela.
          full_name: (profile?.full_name as string) || u.user_metadata?.full_name || '',
          role: (profile?.role as string) ?? 'cliente',
          org_id: (profile?.org_id as string) ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          // Metadata escrita por auth.admin, não pelo app.
          dev_metadata: u.app_metadata ?? {},
        }
      })

      return json({ users })
    }

    // ------------------------------------------------------------------
    // Criação de conta
    // ------------------------------------------------------------------

    if (action === 'create_user') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      const role = typeof body.role === 'string' ? body.role : 'cliente'
      const orgId = typeof body.org_id === 'string' && body.org_id ? body.org_id : null
      const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''

      if (!EMAIL_RE.test(email)) return json({ error: 'E-mail inválido.' }, 400)
      if (password.length < 8) return json({ error: 'A senha deve ter ao menos 8 caracteres.' }, 400)
      if (!['dev', 'admin', 'corretor', 'financeiro', 'juridico', 'cliente'].includes(role)) {
        return json({ error: 'Papel inválido.' }, 400)
      }
      // Só o DEV fica sem org. Qualquer outro papel sem org entraria no sistema
      // sem conseguir ver nada, porque toda policy exige in_current_org().
      if (role !== 'dev' && !orgId) {
        return json({ error: 'Escolha a imobiliária da conta.' }, 400)
      }

      if (orgId) {
        const { data: org } = await admin
          .from('organizations')
          .select('id')
          .eq('id', orgId)
          .maybeSingle()
        if (!org) return json({ error: 'Imobiliária não encontrada.' }, 404)
      }

      // app_metadata: é daqui que o handle_new_user() lê a role e a org.
      // User_metadata é controlado pelo cliente e não serve para isso.
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || email },
        app_metadata: { role, org_id: orgId },
      })

      if (createError) {
        return json(
          { error: authMessage(createError.message.toLowerCase().replace(/\s+/g, '_'), 'Não foi possível criar a conta.') },
          400,
        )
      }

      // O trigger já cria o profile; o UPDATE cobre os casos em que ele não
      // rodou (conta importada) e garante o vínculo com a org.
      if (created?.user) {
        await admin
          .from('profiles')
          .update({ role, org_id: orgId, full_name: fullName || email })
          .eq('id', created.user.id)
      }

      await admin.from('admin_audit_log').insert({
        actor_id: callerUser.id,
        action: 'create_user',
        target_type: 'auth.users',
        target_id: created?.user?.id,
        details: { email, role, org_id: orgId },
      })

      return json({ success: true, id: created?.user?.id })
    }

    // ------------------------------------------------------------------
    // Edição de conta
    // ------------------------------------------------------------------

    if (action === 'update_user') {
      const userId = typeof body.user_id === 'string' ? body.user_id : ''
      if (!userId) return json({ error: 'Conta não informada.' }, 400)

      const patch: Record<string, unknown> = {}
      if (typeof body.full_name === 'string') patch.full_name = body.full_name.trim()
      if (typeof body.role === 'string' && body.role !== '') patch.role = body.role
      if ('org_id' in body) patch.org_id = body.org_id || null

      if (patch.role !== undefined && !['dev', 'admin', 'corretor', 'financeiro', 'juridico', 'cliente'].includes(patch.role as string)) {
        return json({ error: 'Papel inválido.' }, 400)
      }
      if (patch.org_id) {
        const { data: org } = await admin
          .from('organizations')
          .select('id')
          .eq('id', patch.org_id)
          .maybeSingle()
        if (!org) return json({ error: 'Imobiliária não encontrada.' }, 404)
      }

      const { error } = await admin.from('profiles').update(patch).eq('id', userId)
      if (error) return json({ error: 'Não foi possível atualizar a conta.' }, 500)

      // app_metadata é a fonte que o handle_new_user() consulta; deixar ela
      // divergente do profile quebra a recriação futura da conta.
      const appPatch: Record<string, unknown> = {}
      if (patch.role !== undefined) appPatch.role = patch.role
      if ('org_id' in patch) appPatch.org_id = patch.org_id
      if (Object.keys(appPatch).length) {
        await admin.auth.admin.updateUserById(userId, { app_metadata: appPatch })
      }

      await admin.from('admin_audit_log').insert({
        actor_id: callerUser.id,
        action: 'update_user',
        target_type: 'auth.users',
        target_id: userId,
        details: patch,
      })

      return json({ success: true })
    }

    if (action === 'set_password') {
      const userId = typeof body.user_id === 'string' ? body.user_id : ''
      const password = typeof body.password === 'string' ? body.password : ''
      if (!userId) return json({ error: 'Conta não informada.' }, 400)
      if (password.length < 8) return json({ error: 'A senha deve ter ao menos 8 caracteres.' }, 400)

      const { error } = await admin.auth.admin.updateUserById(userId, { password })
      if (error) {
        return json({ error: authMessage(error.message.toLowerCase().replace(/\s+/g, '_'), 'Não foi possível trocar a senha.') }, 400)
      }

      await admin.from('admin_audit_log').insert({
        actor_id: callerUser.id,
        action: 'set_password',
        target_type: 'auth.users',
        target_id: userId,
      })

      return json({ success: true })
    }

    // ------------------------------------------------------------------
    // Ativar / desativar
    // ------------------------------------------------------------------

    if (action === 'toggle_active') {
      const userId = typeof body.user_id === 'string' ? body.user_id : ''
      const active = body.active === true
      if (!userId) return json({ error: 'Conta não informada.' }, 400)

      if (userId === callerUser.id) {
        return json({ error: 'Você não pode desativar a própria conta.' }, 400)
      }

      // Desativar é banir, não deletar: o histórico e os dados do usuário
      // permanecem vinculados. ban_duration é o que o GoTrue entende — não
      // há campo "active" em auth.users.
      // 100 anos é Effectively permanente: um ban curto expira sozinho e a
      // conta volta sem ninguém pedir.
      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: active ? 'none' : '876000h',
      })

      if (error) {
        return json({ error: 'Não foi possível alterar o status da conta.' }, 500)
      }

      if (!active) {
        // Derruba as sessões já abertas, senão o usuário logado continua
        // trabalhando com o token que já tem.
        await admin.auth.admin.signOut(userId, 'global')
      }

      await admin.from('admin_audit_log').insert({
        actor_id: callerUser.id,
        action: active ? 'activate_user' : 'deactivate_user',
        target_type: 'auth.users',
        target_id: userId,
      })

      return json({ success: true, active })
    }

    // ------------------------------------------------------------------
    // Exclusão
    // ------------------------------------------------------------------

    if (action === 'delete_user') {
      const userId = typeof body.user_id === 'string' ? body.user_id : ''
      if (!userId) return json({ error: 'Conta não informada.' }, 400)
      if (userId === callerUser.id) {
        return json({ error: 'Você não pode excluir a própria conta.' }, 400)
      }

      const { data: target } = await admin
        .from('profiles')
        .select('id, role, email, full_name')
        .eq('id', userId)
        .maybeSingle()

      // Um dev secundário é tanto removível quanto destrutivo demais por
      // accident: ele não tem org, mas a política o deixa fazer tudo aqui.
      if (target?.role === 'dev') {
        return json({
          error: 'Esta é uma conta DEV. Remova o acesso dela com outro DEV antes de excluir, ou mantenha-a como redundância.',
        }, 400)
      }

      // Contrato, imóvel ou cliente vinculado impede a exclusão: apagar a conta
      // deixaria o registro apontando para um id inexistente. O RLS impede o
      // DELETE, mas aqui é melhor devolver um motivo legível.
      const { data: profile } = await admin
        .from('profiles')
        .select('role, org_id')
        .eq('id', userId)
        .maybeSingle()

      if (profile?.role === 'cliente' || profile?.role === 'corretor') {
        const [{ count: leaseCount }, { count: propCount }] = await Promise.all([
          admin.from('leases').select('id', { count: 'exact', head: true })
            .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`),
          admin.from('properties').select('id', { count: 'exact', head: true })
            .eq('owner_id', userId),
        ])
        if ((leaseCount ?? 0) > 0 || (propCount ?? 0) > 0) {
          return json({
            error: 'Esta conta está vinculada a contratos ou imóveis. Desative-a em vez de excluir, para preservar o histórico.',
          }, 400)
        }
      }

      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) {
        return json({ error: authMessage(error.message.toLowerCase().replace(/\s+/g, '_'), 'Não foi possível excluir a conta.') }, 400)
      }

      await admin.from('admin_audit_log').insert({
        actor_id: callerUser.id,
        action: 'delete_user',
        target_type: 'auth.users',
        target_id: userId,
        details: { email: target?.email, role: target?.role },
      })

      return json({ success: true })
    }

    if (action === 'update_organization') {
      const orgId = typeof body.org_id === 'string' ? body.org_id : ''
      if (!orgId) return json({ error: 'Imobiliária não informada.' }, 400)

      const patch: Record<string, unknown> = {}
      for (const field of ['name', 'cnpj', 'phone', 'whatsapp', 'email', 'logo_url', 'address']) {
        if (typeof body[field] === 'string') patch[field] = body[field]
      }
      if (typeof body.slug === 'string' && body.slug !== '') {
        const slug = body.slug.trim().toLowerCase()
        if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
          return json({ error: 'Slug inválido: use de 2 a 40 caracteres minúsculos, números e hífens.' }, 400)
        }
        const { data: clash } = await admin
          .from('organizations')
          .select('id')
          .eq('slug', slug)
          .neq('id', orgId)
          .maybeSingle()
        if (clash) return json({ error: 'Já existe uma imobiliária com este slug.' }, 409)
        patch.slug = slug
      }

      if (Object.keys(patch).length === 0) return json({ error: 'Nada para atualizar.' }, 400)

      const { error } = await admin.from('organizations').update(patch).eq('id', orgId)
      if (error) return json({ error: 'Não foi possível atualizar a imobiliária.' }, 500)

      await admin.from('admin_audit_log').insert({
        actor_id: callerUser.id,
        action: 'update_organization',
        target_type: 'organizations',
        target_id: orgId,
        details: patch,
      })

      return json({ success: true })
    }

    if (action === 'delete_organization') {
      const orgId = typeof body.org_id === 'string' ? body.org_id : ''
      // Confirmação em texto: excluir leva junto contratos, pagamentos e o
      // histórico de todos os usuários daquela imobiliária. Um botão de um
      // clique não é proteção suficiente para isso.
      const confirm = typeof body.confirm_name === 'string' ? body.confirm_name.trim() : ''
      if (!orgId) return json({ error: 'Imobiliária não informada.' }, 400)
      if (!confirm) return json({ error: 'Confirme digitando o nome da imobiliária.' }, 400)

      const { data: org } = await admin
        .from('organizations')
        .select('id, name, slug')
        .eq('id', orgId)
        .maybeSingle()
      if (!org) return json({ error: 'Imobiliária não encontrada.' }, 404)

      if (confirm !== org.name) {
        return json({ error: 'O nome não confere. Nada foi excluído.' }, 400)
      }

      const { error } = await admin.from('organizations').delete().eq('id', orgId)
      if (error) {
        return json({
          error: 'Não foi possível excluir. A imobiliária tem dados vinculados — prefira desativá-la.',
        }, 500)
      }

      await admin.from('admin_audit_log').insert({
        actor_id: callerUser.id,
        action: 'delete_organization',
        target_type: 'organizations',
        target_id: orgId,
        details: { name: org.name, slug: org.slug },
      })

      return json({ success: true })
    }

    if (action === 'clear_error_logs') {
      // Só a service role apaga — a tabela não tem policy de DELETE. A limpeza
      // é registrada para não haver forma de sumir com um rastro sem registro.
      const { error } = await admin.from('app_error_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) return json({ error: 'Não foi possível limpar os logs.' }, 500)

      await admin.from('admin_audit_log').insert({
        actor_id: callerUser.id,
        action: 'clear_error_logs',
        target_type: 'app_error_logs',
      })

      return json({ success: true })
    }

    return json({ error: 'Ação não implementada.' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    // Vai para app_error_logs, que só o DEV lê. O console.log sozinho morre com
    // a invocação e nunca chega ao painel. Um logger que lançasse aqui criaria
    // um erro novo dentro do tratamento de erro, então ele é engolido.
    try {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      await admin.from('app_error_logs').insert({
        source: 'edge:dev-admin',
        message,
        stack: error instanceof Error ? error.stack ?? null : null,
      })
    } catch { /* engolido de propósito */ }
    console.error('Erro em dev-admin:', message)
    return json({ error: 'Erro interno do servidor.' }, 500)
  }
})
