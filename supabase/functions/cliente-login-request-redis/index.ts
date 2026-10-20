import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getRateLimiter } from '../../scripts/redis-rate-limiter.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': import.meta.env.VITE_APP_URL ?? 'http://localhost:5173',
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

function getClientIP(req: Request): string {
  // Tenta obter IP de headers comuns
  const headers = req.headers
  const ip = headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             headers.get('x-real-ip') ||
             'unknown'

  return ip
}

function normalizeCPFCNPJ(cpfCnpj: string): string {
  return cpfCnpj.replace(/\D/g, '')
}

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, '')
  if (!normalized.startsWith('55')) {
    normalized = '55' + normalized
  }
  return normalized
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

    // O slug é obrigatório: sem ele, um mesmo CPF/CNPJ cadastrado em duas
    // imobiliárias seria ambíguo e o código cairia na carteira errada.
    if (!slug || typeof slug !== 'string') {
      return new Response(JSON.stringify({ error: 'Imobiliária não informada. Acesse o link recebido da sua imobiliária.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ============================================================
    // RATE LIMITING DISTRIBUÍDO
    // ============================================================

    const rateLimiter = getRateLimiter()
    const clientIP = getClientIP(req)

    // Rate limiting por IP (evita brute force)
    const ipRateLimit = await rateLimiter.checkRateLimit(
      `ip:${clientIP}`,
      {
        windowMs: 60 * 1000,    // 1 minuto
        maxRequests: 10,        // 10 requisições por minuto por IP
        message: 'Muitas tentativas. Tente novamente em 1 minuto.',
      },
      'cliente-login-request'
    )

    if (!ipRateLimit.success) {
      return new Response(
        JSON.stringify({
          error: ipRateLimit.message,
          retryAfter: ipRateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': ipRateLimit.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': ipRateLimit.limit.toString(),
            'X-RateLimit-Remaining': ipRateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(ipRateLimit.reset / 1000).toString(),
          },
        }
      )
    }

    // Rate limiting por CPF/CNPJ (evita targeting específico)
    const cpfCnpjLimpo = normalizeCPFCNPJ(cpf_cnpj)
    const cpfRateLimit = await rateLimiter.checkRateLimit(
      `cpf:${cpfCnpjLimpo}`,
      {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: 3,           // 3 tentativas por CPF/CNPJ a cada 15 minutos
        message: 'Muitas tentativas para este CPF/CNPJ. Tente novamente mais tarde.',
      },
      'cliente-login-request'
    )

    if (!cpfRateLimit.success) {
      return new Response(
        JSON.stringify({
          error: cpfRateLimit.message,
          retryAfter: cpfRateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': cpfRateLimit.retryAfter?.toString() || '900',
            'X-RateLimit-Limit': cpfRateLimit.limit.toString(),
            'X-RateLimit-Remaining': cpfRateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(cpfRateLimit.reset / 1000).toString(),
          },
        }
      )
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

    // Rate limiting por organização
    const orgRateLimit = await rateLimiter.checkOrgRateLimit(
      org.id,
      'cliente-login-request',
      {
        windowMs: 60 * 1000,    // 1 minuto
        maxRequests: 30,        // 30 requisições por minuto por organização
        message: 'Limite de requisições para esta imobiliária atingido.',
      }
    )

    if (!orgRateLimit.success) {
      return new Response(
        JSON.stringify({
          error: orgRateLimit.message,
          retryAfter: orgRateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': orgRateLimit.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': orgRateLimit.limit.toString(),
            'X-RateLimit-Remaining': orgRateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(orgRateLimit.reset / 1000).toString(),
          },
        }
      )
    }

    // Find profile by cpf_cnpj_limpo and telefone_e164 within this organization
    const telefoneE164 = normalizePhone(telefone)

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

    // Rate limiting por email (última camada)
    const emailRateLimit = await rateLimiter.checkRateLimit(
      `email:${profile.email}`,
      {
        windowMs: 5 * 60 * 1000, // 5 minutos
        maxRequests: 2,          // 2 emails a cada 5 minutos
        message: 'Código já enviado recentemente. Verifique seu e-mail.',
      },
      'cliente-login-request'
    )

    if (!emailRateLimit.success) {
      return new Response(
        JSON.stringify({
          error: emailRateLimit.message,
          retryAfter: emailRateLimit.retryAfter,
          email_masked: maskEmail(profile.email),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': emailRateLimit.retryAfter?.toString() || '300',
            'X-RateLimit-Limit': emailRateLimit.limit.toString(),
            'X-RateLimit-Remaining': emailRateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(emailRateLimit.reset / 1000).toString(),
          },
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
      // Não conta como falha para rate limiting se foi erro do sistema
      return new Response(JSON.stringify({ error: 'Erro ao enviar código. Tente novamente.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log de sucesso (opcional para auditoria)
    await supabaseAdmin.from('admin_audit_log').insert({
      action: 'cliente_login_request',
      details: {
        org_id: org.id,
        cpf_cnpj_masked: cpfCnpjLimpo.slice(0, 3) + '***',
        email_masked: maskEmail(profile.email),
        ip: clientIP,
        rate_limit_hit: false,
      },
      created_by: null, // Sistema
    })

    return new Response(
      JSON.stringify({
        email: profile.email,
        email_masked: maskEmail(profile.email),
        message: `Enviamos um código de verificação para ${maskEmail(profile.email)}`,
        rate_limit_info: {
          ip_remaining: ipRateLimit.remaining,
          cpf_remaining: cpfRateLimit.remaining,
          org_remaining: orgRateLimit.remaining,
          email_remaining: emailRateLimit.remaining,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-IP-Limit': ipRateLimit.limit.toString(),
          'X-RateLimit-IP-Remaining': ipRateLimit.remaining.toString(),
          'X-RateLimit-IP-Reset': Math.ceil(ipRateLimit.reset / 1000).toString(),
          'X-RateLimit-CPF-Limit': cpfRateLimit.limit.toString(),
          'X-RateLimit-CPF-Remaining': cpfRateLimit.remaining.toString(),
          'X-RateLimit-CPF-Reset': Math.ceil(cpfRateLimit.reset / 1000).toString(),
        },
      }
    )
  } catch (err) {
    console.error('Error in cliente-login-request:', err)

    // Log de erro
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

      await supabaseAdmin.from('app_error_logs').insert({
        error_type: 'edge_function_error',
        function_name: 'cliente-login-request-redis',
        error_message: err instanceof Error ? err.message : String(err),
        stack_trace: err instanceof Error ? err.stack : undefined,
        metadata: {
          timestamp: new Date().toISOString(),
          environment: 'production',
        },
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})