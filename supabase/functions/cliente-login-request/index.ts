import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  return `${local.slice(0, 2)}***@${domain}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client with anon key for auth operations
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Admin client for reading configs
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { cpf_cnpj, telefone, slug } = await req.json()

    if (!cpf_cnpj || !telefone) {
      return new Response(JSON.stringify({ error: 'CPF/CNPJ e telefone são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Clean CPF/CNPJ (remove non-digits)
    const cpfCnpjLimpo = cpf_cnpj.replace(/\D/g, '')

    // Clean phone to E.164 format (assuming Brazil +55)
    let telefoneE164 = telefone.replace(/\D/g, '')
    if (!telefoneE164.startsWith('55')) {
      telefoneE164 = '55' + telefoneE164
    }

    // O slug é obrigatório: sem ele, um mesmo CPF/CNPJ cadastrado em duas
    // imobiliárias seria ambíguo e o código cairia na carteira errada.
    if (!slug || typeof slug !== 'string') {
      return new Response(JSON.stringify({ error: 'Imobiliária não informada. Acesse o link recebido da sua imobiliária.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, slug, name, active')
      .eq('slug', slug)
      .maybeSingle()

    if (orgError || !org || !org.active) {
      return new Response(JSON.stringify({ error: 'Imobiliária não encontrada.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find profile by cpf_cnpj_limpo and telefone_e164 within this organization
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('org_id', org.id)
      .eq('cpf_cnpj_limpo', cpfCnpjLimpo)
      .eq('telefone_e164', telefoneE164)
      .eq('role', 'cliente')
      .limit(2)

    if (profileError || !profiles || profiles.length === 0) {
      // Mensagem uniforme: não revela se o CPF/telefone existem.
      return new Response(JSON.stringify({ error: 'Se os dados forem válidos, enviaremos um código. Verifique seu e-mail.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Ainda ambíguo dentro da mesma imobiliária: duas contas com o mesmo CPF e
    // telefone. Escolher uma delas enviaria o código para a pessoa errada.
    if (profiles.length > 1) {
      return new Response(JSON.stringify({ error: 'Se os dados forem válidos, enviaremos um código. Verifique seu e-mail.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const profile = profiles[0]

    // Check if client has email
    if (!profile.email) {
      return new Response(JSON.stringify({ error: 'Se os dados forem válidos, enviaremos um código. Verifique seu e-mail.' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send OTP via email
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: profile.email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (otpError) {
      return new Response(JSON.stringify({ error: 'Erro ao enviar código. Tente novamente.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        email: profile.email,
        email_masked: maskEmail(profile.email),
        message: `Enviamos um código de verificação para ${maskEmail(profile.email)}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Error in cliente-login-request:', err)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})