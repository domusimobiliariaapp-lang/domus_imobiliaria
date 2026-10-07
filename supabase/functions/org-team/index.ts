import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Gestão da equipe pelo admin da própria imobiliária.
 *
 * O dev-admin faz quase o mesmo, mas exige is_dev() — só a conta DEV entra.
 * Sem esta função, o admin de uma imobiliária que não é a DEV não tem como
 * cadastrar o corretor que vai operar o sistema dele.
 *
 * A diferença em relação ao dev-admin não é a implementação: é a autorização.
 * Aqui quem pode criar conta é o admin de uma org, e apenas para a PRÓPRIA org,
 * e nunca para o papel 'dev'. Um admin da org A que conseguisse passar org_id
 * da org B criaria uma conta de administrador em outra imobiliária — daí o
 * org_id vir do token, nunca do corpo, e a checagem explícita do papel.
 *
 * A service role ignora a RLS, então a validação do token é a única barreira.
 */

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

/** Papéis que o admin da imobiliária pode conceder. 'dev' fica de fora de propósito. */
const CONCEDIVEIS = ['admin', 'corretor', 'financeiro', 'juridico', 'cliente']

function authMessage(code: string, fallback: string): string {
  switch (code) {
    case 'email_exists':
      return 'Já existe uma conta com este e-mail.'
    case 'email_not_confirmed':
      return 'O e-mail desta conta ainda não foi confirmado.'
    case 'weak_password':
      return 'A senha é muito fraca. Use ao menos 8 caracteres.'
    default:
      return fallback
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  const adminActions = new Set(['list_team', 'create_user', 'set_password', 'toggle_active'])

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!serviceKey) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, 503)

    const authorization = req.headers.get('Authorization') || ''
    if (!authorization) return json({ error: 'Sessão inválida.' }, 401)

    // Antes de qualquer uso da service role: quem está chamando, e de qual
    // imobiliária. Sem org, é a conta DEV — que não administra equipe alheia
    // por aqui, e sim pelo painel /dev.
    const caller = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user: callerUser }, error: authError } = await caller.auth.getUser(
      authorization.replace(/^Bearer\s+/i, ''),
    )
    if (authError || !callerUser) return json({ error: 'Sessão inválida. Entre novamente.' }, 401)

    // get_current_user_role e current_org_id leem de profiles, então dizem a
    // papel real do Domus — auth.jwt()->>'role' é sempre 'authenticated' e não
    // serve para nada aqui.
    const [{ data: callerRole }, { data: callerOrg }] = await Promise.all([
      caller.rpc('get_current_user_role'),
      caller.rpc('current_org_id'),
    ])

    if (callerRole !== 'admin') {
      return json({ error: 'Apenas o administrador da imobiliária gerencia a equipe.' }, 403)
    }
    if (!callerOrg) {
      return json({ error: 'Sua conta não está vinculada a uma imobiliária.' }, 403)
    }

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
    // Listar a equipe
    // ------------------------------------------------------------------

    if (action === 'list_team') {
      // auth.admin.listUsers lista o banco inteiro; filtrar por org aqui é o
      // que impede a tela de mostrar o nome de outra imobiliária. A RLS não
      // protege este ponto porque a service role a ignora.
      const { data: profiles, error: profilesError } = await admin
        .from('profiles')
        .select('id, role, full_name, email, created_at')
        .eq('org_id', callerOrg)
        .neq('role', 'dev')
        .order('created_at', { ascending: false })

      if (profilesError) return json({ error: 'Não foi possível listar a equipe.' }, 500)

      const ids = (profiles ?? []).map((p) => p.id as string)
      // listUsers é paginado; sem percorrer as páginas, uma equipe maior que
      // uma página apareceria incompleta sem nenhum aviso.
      const byId = new Map<string, { last_sign_in_at: string | null; banned: unknown }>()
      let page = 1
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
        if (error) break
        for (const u of data.users) {
          if (ids.includes(u.id)) {
            byId.set(u.id, {
              last_sign_in_at: u.last_sign_in_at,
              banned: (u.app_metadata as Record<string, unknown> | undefined)?.banned,
            })
          }
        }
        if (data.users.length < 200) break
        page += 1
        if (page > 20) break
      }

      return json({
        team: (profiles ?? []).map((p) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          role: p.role,
          created_at: p.created_at,
          last_sign_in_at: byId.get(p.id as string)?.last_sign_in_at ?? null,
          active: !(typeof byId.get(p.id as string)?.banned === 'string'
            && byId.get(p.id as string)?.banned !== 'none'),
        })),
      })
    }

    // ------------------------------------------------------------------
    // Criar conta
    // ------------------------------------------------------------------

    if (action === 'create_user') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      const role = typeof body.role === 'string' ? body.role : ''
      const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''

      if (!EMAIL_RE.test(email)) return json({ error: 'E-mail inválido.' }, 400)
      if (password.length < 8 || password.length > 72) {
      // 72 é o limite do bcrypt: acima disso o Supabase recusa a conta com
      // "Password cannot be longer than 72 characters" e o admin só vê isso
      // depois de clicar.
      return json({ error: 'A senha deve ter entre 8 e 72 caracteres.' }, 400)
    }
      // 'dev' não está em CONCEDIVEIS, e a checagem é explícita mesmo assim: é
      // a diferença entre "não foi pensado" e "não é permitido".
      if (!CONCEDIVEIS.includes(role) || role === 'dev') {
        return json({ error: 'Papel inválido.' }, 400)
      }

      // org_id vem do token. Ignorar o do corpo é o que impede um admin de
      // criar conta em outra imobiliária.
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || email },
        // requires_password_change é o que segura a conta no primeiro acesso.
        // Sem ele, o admin define uma senha provisória, conta isso ao funcionário
        // por telefone, e essa senha — que o funcionário não escolheu — continua
        // valendo até alguém lembrar de trocar.
        //
        // Vive em app_metadata e não em user_metadata por dois motivos: só
        // service role escreve app_metadata (user_metadata pode ser reescrita
        // pelo próprio usuário via updateUser, e aí o flag viraria uma forma de
        // se proteger de trocar a senha), e é o mesmo lugar onde já vivem role e
        // org_id.
        app_metadata: { role, org_id: callerOrg, requires_password_change: true },
      })

      if (createError) {
        return json(
          { error: authMessage(createError.message.toLowerCase().replace(/\s+/g, '_'), 'Não foi possível criar a conta.') },
          400,
        )
      }

      // O trigger handle_new_user já cria o profile a partir do app_metadata;
      // o UPDATE cobre o caso em que ele não rodou e garante o vínculo.
      if (created?.user) {
        await admin
          .from('profiles')
          .update({ role, org_id: callerOrg, full_name: fullName || email })
          .eq('id', created.user.id)
      }

      await admin.from('admin_audit_log').insert({
        actor_id: callerUser.id,
        action: 'org_create_user',
        target_type: 'auth.users',
        target_id: created?.user?.id,
        details: { email, role, org_id: callerOrg },
      })

      return json({ success: true, id: created?.user?.id })
    }

    // ------------------------------------------------------------------
    // Senha e status
    // ------------------------------------------------------------------

    if (action === 'set_password' || action === 'toggle_active') {
      const userId = typeof body.user_id === 'string' ? body.user_id : ''
      if (!userId) return json({ error: 'Conta não informada.' }, 400)
      if (userId === callerUser.id) {
        return json({ error: 'Você não pode alterar a própria conta por aqui.' }, 400)
      }

      // Mesma checagem da criação: a conta precisa ser da própria org. Sem
      // isto, o admin poderia trocar a senha de qualquer conta do sistema
      // bastando conhecer o UUID.
      const { data: target } = await admin
        .from('profiles')
        .select('org_id')
        .eq('id', userId)
        .maybeSingle()

      if (!target || target.org_id !== callerOrg) {
        return json({ error: 'Conta não encontrada nesta imobiliária.' }, 404)
      }

      if (action === 'set_password') {
        const password = typeof body.password === 'string' ? body.password : ''
        if (password.length < 8 || password.length > 72) {
          // 72 é o limite do bcrypt: acima disso o Supabase recusa a conta com
          // "Password cannot be longer than 72 characters" e o admin só vê isso
          // depois de clicar.
          return json({ error: 'A senha deve ter entre 8 e 72 caracteres.' }, 400)
        }

        const { error } = await admin.auth.admin.updateUserById(userId, { password })
        if (error) return json({ error: authMessage(error.message.toLowerCase().replace(/\s+/g, '_'), 'Não foi possível trocar a senha.') }, 400)

        // Redefinir é o mesmo que criar de novo: a senha que o admin acabou de
        // digitar é provisória, e o funcionário precisa trocar no próximo
        // acesso. Sem reerguer o flag, o silêncio aqui significaria que a
        // conta fica com senha escolhida pelo admin em vez da escolhida pelo
        // dono dela.
        await admin.auth.admin.updateUserById(userId, {
          app_metadata: { requires_password_change: true },
        })
      } else {
        const active = body.active === true
        // 100 anos é praticamente permanente: um ban curto expira sozinho e a
        // conta volta sem ninguém pedir.
        const { error } = await admin.auth.admin.updateUserById(userId, {
          ban_duration: active ? 'none' : '876000h',
        })
        if (error) return json({ error: 'Não foi possível alterar o status da conta.' }, 500)
        if (!active) await admin.auth.admin.signOut(userId, 'global')
      }

      await admin.from('admin_audit_log').insert({
        actor_id: callerUser.id,
        action: action === 'set_password' ? 'org_set_password' : 'org_toggle_active',
        target_type: 'auth.users',
        target_id: userId,
        details: { org_id: callerOrg },
      })

      return json({ success: true })
    }

    return json({ error: 'Ação não suportada.' }, 400)
  } catch (error) {
    console.error('org-team:', error)
    return json({ error: 'Erro interno.' }, 500)
  }
})
