import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Cadastro de cliente.
 *
 * Não dá para criar cliente direto na tabela profiles: profiles.id é
 * REFERENCES auth.users(id) e não tem default, então um INSERT sem id viola o
 * NOT NULL. profiles é uma extensão da conta de login, não uma tabela
 * independente.
 *
 * E a conta de login não é opcional. O cliente entra no portal por
 * CPF/CNPJ + telefone, mas a função cliente-login-request manda o código de
 * verificação por e-mail com shouldCreateUser: false — o e-mail é a chave de
 * entrada. Sem linha em auth.users o cliente cadastrado nunca consegue entrar,
 * e a tela de cadastro não tem como detectar isso.
 *
 * Por isso a criação passa por service role: é a única operação do sistema que
 * precisa criar em auth.users. A RLS não tem como expressar "crie também a
 * conta de autenticação".
 *
 * Autorização: quem pode criar é a equipe interna, e o org_id vem do token.
 * Um corretor da org A que mandasse org_id da org B criaria cliente na carteira
 * errada — daí org_id nunca ser lido do corpo, e o papel 'cliente' nunca ser
 * concedido como role de quem opera o sistema.
 */

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

/** Só dígitos. */
function digitos(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\D/g, '') : ''
}

/** Texto opcional, limitado, sem espaço nas pontas. */
function texto(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t) return null
  return t.slice(0, max)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!serviceKey) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, 503)

    const authorization = req.headers.get('Authorization') || ''
    if (!authorization) return json({ error: 'Sessão inválida.' }, 401)

    // Antes de qualquer uso da service role: quem está chamando. A service role
    // ignora a RLS, então esta checagem é a única barreira.
    const caller = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user: callerUser }, error: authError } = await caller.auth.getUser(
      authorization.replace(/^Bearer\s+/i, ''),
    )
    if (authError || !callerUser) return json({ error: 'Sessão inválida. Entre novamente.' }, 401)

    // get_current_user_role e current_org_id leem de profiles: auth.jwt()->>'role'
    // é a role do PostgREST, sempre 'authenticated', e não diz nada sobre o
    // papel no Domus.
    const [{ data: callerRole }, { data: callerOrg }] = await Promise.all([
      caller.rpc('get_current_user_role'),
      caller.rpc('current_org_id'),
    ])

    if (!['admin', 'corretor', 'financeiro', 'juridico'].includes(callerRole ?? '')) {
      return json({ error: 'Apenas a equipe da imobiliária cadastra clientes.' }, 403)
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

    const fullName = texto(body.full_name, 200)
    if (!fullName) return json({ error: 'Informe o nome ou razão social do cliente.' }, 400)

    const email = (texto(body.email, 200) ?? '').toLowerCase()
    if (!EMAIL_RE.test(email)) {
      return json({ error: 'Informe um e-mail válido — é por ele que o cliente recebe o código de acesso ao portal.' }, 400)
    }

    const cpf = digitos(body.cpf_cnpj_limpo)
    if (cpf.length !== 11 && cpf.length !== 14) {
      return json({ error: 'CPF deve ter 11 dígitos e CNPJ 14.' }, 400)
    }

    let telefone = digitos(body.telefone_e164)
    if (telefone && !telefone.startsWith('55')) telefone = `55${telefone}`
    // O portal identifica por CPF/CNPJ + telefone, então o telefone não é
    // opcional: sem ele o cliente não consegue nem pedir o código.
    if (telefone.length < 12 || telefone.length > 13) {
      return json({ error: 'Informe um telefone válido com DDD — é por ele que o cliente entra no portal.' }, 400)
    }

    const estado = (texto(body.endereco_state, 2) ?? '').toUpperCase()
    if (estado && !UFS.includes(estado)) {
      return json({ error: 'UF inválida.' }, 400)
    }

    // O mesmo CPF/CNPJ não pode entrar duas vezes na mesma imobiliária: o
    // login do portal busca por (cpf, telefone) e devolve "ambíguo" quando
    // acha duas linhas, o que tranca o acesso de quem não é o homônimo.
    const { data: duplicado } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('org_id', callerOrg)
      .eq('cpf_cnpj_limpo', cpf)
      .eq('role', 'cliente')
      .maybeSingle()

    if (duplicado) {
      return json({ error: `Já existe um cliente com este CPF/CNPJ: ${duplicado.full_name}.` }, 409)
    }

    // Senha aleatória e nunca comunicada: o cliente não entra por senha, e sim
    // pelo código de verificação que chega no e-mail. Criar com senha previsível
    // seria criar uma porta que ninguém pediu.
    //
    // 36 caracteres (um UUID), não 73. O bcrypt trunca em 72 bytes e recusava a
    // criação com "Password cannot be longer than 72 characters" — e a conta
    // ficava pela metade, sem perfil nem retorno de erro útil. 122 bits de
    // aleatoriedade não usados é mais do que suficiente para uma senha que
    // ninguém vai conhecer.
    const senha = crypto.randomUUID()

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { role: 'cliente', org_id: callerOrg },
    })

    if (createError) {
      const msg = createError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered')) {
        return json({ error: 'Já existe uma conta com este e-mail.' }, 409)
      }
      return json({ error: `Não foi possível criar a conta de acesso: ${createError.message}` }, 400)
    }

    const userId = created?.user?.id
    if (!userId) return json({ error: 'A conta de acesso não foi criada.' }, 500)

    // O handle_new_user já cria o profile a partir do app_metadata; o UPSERT
    // completa os campos que só a tela de cadastro conhece e cobre o caso em
    // que o trigger não rodou.
    const { error: upsertError } = await admin.from('profiles').upsert(
      {
        id: userId,
        role: 'cliente',
        org_id: callerOrg,
        full_name: fullName,
        email,
        cpf_cnpj_limpo: cpf,
        telefone_e164: telefone,
        tipo_relacao: texto(body.tipo_relacao, 30),
        categoria: texto(body.categoria, 2),
        status: body.status === 'inativo' ? 'inativo' : 'ativo',
        observacoes: texto(body.observacoes, 1000),
        endereco: texto(body.endereco, 400),
        endereco_cep: digitos(body.endereco_cep) || null,
        endereco_street: texto(body.endereco_street, 200),
        endereco_number: texto(body.endereco_number, 20),
        endereco_complement: texto(body.endereco_complement, 120),
        endereco_neighborhood: texto(body.endereco_neighborhood, 120),
        endereco_city: texto(body.endereco_city, 120),
        endereco_state: estado || null,
      },
      { onConflict: 'id' },
    )

    if (upsertError) {
      // Deixar o profile pela metade é pior do que falhar: a conta existe no
      // auth e o cadastro não. A tela de equipe mostra e resolve; aqui o erro
      // precisa dizer isso, senão o usuário só tenta de novo e esbarra no
      // e-mail já cadastrado.
      return json(
        { error: `A conta foi criada mas o cadastro não foi salvo: ${upsertError.message}` },
        500,
      )
    }

    await admin.from('admin_audit_log').insert({
      actor_id: callerUser.id,
      action: 'create_client',
      target_type: 'auth.users',
      target_id: userId,
      details: { org_id: callerOrg, cpf_cnpj_limpo: cpf },
    })

    return json({ success: true, id: userId })
  } catch (error) {
    console.error('cliente-create:', error)
    return json({ error: 'Erro interno.' }, 500)
  }
})
