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

    const { cpf_cnpj, telefone } = await req.json()

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

    // Find profile by cpf_cnpj_limpo and telefone_e164
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('cpf_cnpj_limpo', cpfCnpjLimpo)
      .eq('telefone_e164', telefoneE164)
      .eq('role', 'cliente')
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Cliente não encontrado. Verifique os dados informados.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if client has email
    if (!profile.email) {
      // Get contact phone from configuracoes
      const { data: config } = await supabaseAdmin
        .from('configuracoes')
        .select('telefone_contato')
        .single()

      const telefoneContato = config?.telefone_contato || '(11) 99999-9999'

      return new Response(
        JSON.stringify({
          error: 'sem_email',
          message: `Este cliente não possui e-mail cadastrado. Por favor, entre em contato com a imobiliária pelo telefone ${telefoneContato} para atualizar seu cadastro.`,
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
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