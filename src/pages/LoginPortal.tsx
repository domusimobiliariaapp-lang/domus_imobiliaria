import * as React from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  KeyRound, 
  Smartphone, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Mail, 
  Check, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { DomusLogo } from '@/components/brand/DomusLogo'
import { formatCpfCnpj, formatBrazilianPhone, toBrazilianE164 } from '@/lib/inputMasks'

export function LoginPortal() {
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'request' | 'verify' | 'sem_email'>('request')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailMasked, setEmailMasked] = useState('')
  const [emailReal, setEmailReal] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const navigate = useNavigate()
  
  // A tela do portal recebe o slug da imobiliária. "/portal/login" sem slug
  // continua valendo, assumindo a Domus, para não quebrar links já enviados.
  const { slug = 'domus' } = useParams<{ slug?: string }>()

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cliente-login-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          cpf_cnpj: cpfCnpj,
          telefone: toBrazilianE164(phone),
          slug: slug,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'sem_email') {
          setStep('sem_email')
          setContactMessage(data.message)
        } else {
          setError(data.message || data.error || 'Erro ao enviar código de acesso.')
        }
      } else {
        setEmailMasked(data.email_masked)
        setEmailReal(data.email)
        setStep('verify')
      }
    } catch {
      setError('Erro de conexão ao servidor. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { supabase } = await import('@/integrations/supabase/client')
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: emailReal,
        token: code.trim(),
        type: 'email',
      })

      if (verifyError) {
        setError('Código inválido ou expirado. Tente novamente.')
      } else {
        navigate('/portal/dashboard', { replace: true })
      }
    } catch {
      setError('Erro ao verificar código. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#EEECE5] dark:bg-[#0E1E24]">
      {/* Left Panel - Brand & Atmosphere */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#17323D] via-[#1A3845] to-[#0d1f26] text-white relative overflow-hidden shadow-2xl">
        {/* Brand */}
        <div className="relative z-10">
          <DomusLogo size="lg" className="[&_span]:text-white [&_p]:text-white/70" />
        </div>

        {/* Tagline */}
        <div className="max-w-md relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B]/20 text-[#AD7B3B] border border-[#AD7B3B]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Portal do Cliente • Acesso Seguro sem Senha</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-white leading-tight">
            Transparência e comodidade para você acompanhar seu patrimônio.
          </h2>
          <p className="text-sm leading-relaxed text-white/80">
            Consulte seus contratos, emita 2ª via de boletos, envie comprovantes e acompanhe os repasses da sua locação em tempo real.
          </p>
        </div>

        {/* Footer */}
        <div className="text-xs text-white/50 relative z-10 flex items-center justify-between">
          <span>Portal do Cliente · Domus</span>
          <span>Autenticação criptografada OTP</span>
        </div>

        {/* Blueprint Illustration */}
        <PortalBlueprintIllustration />
      </div>

      {/* Right Panel - Neumorphic Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Elementos decorativos suaves */}
        <div className="absolute -top-12 -left-12 w-52 h-52 rounded-full neumorph-card opacity-60 pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full neumorph-card opacity-50 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 w-full max-w-md rounded-[2.5rem] p-8 sm:p-10 neumorph-card border border-white/80 dark:border-white/10 shadow-xl"
        >
          {/* Logo Mobile */}
          <div className="lg:hidden flex justify-center mb-6">
            <DomusLogo size="md" />
          </div>

          {/* Ícone Neumórfico Central em Relevo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full neumorph-btn flex items-center justify-center text-[#AD7B3B] shadow-md">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#AD7B3B] to-[#C89551] flex items-center justify-center text-white shadow-inner">
                {step === 'verify' ? (
                  <Mail className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <KeyRound className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>
            </div>
          </div>

          {/* Título e Subtítulo */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-serif font-bold tracking-tight text-[#17323D] dark:text-[#EEECE5]">
              {step === 'verify' ? 'Código de Confirmação' : 'Acesse seu Portal'}
            </h1>
            <p className="text-xs text-[#6B6375] dark:text-muted-foreground mt-1">
              {step === 'verify'
                ? `Digite o código de 6 dígitos enviado para ${emailMasked}`
                : 'Identifique-se com seu CPF/CNPJ e celular cadastrado'}
            </p>
          </div>

          {/* Mensagem de Erro com Animação */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-5 p-3.5 text-xs text-red-700 bg-red-100/80 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Passo 1: Informar CPF/CNPJ e Telefone */}
          {step === 'request' && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#17323D] dark:text-[#EEECE5] mb-1.5">
                  CPF ou CNPJ
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-[#AD7B3B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                    disabled={loading}
                    maxLength={18}
                    inputMode="numeric"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl neumorph-input text-[#17323D] dark:text-white placeholder:text-neutral-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#17323D] dark:text-[#EEECE5] mb-1.5">
                  Celular / WhatsApp
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#AD7B3B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatBrazilianPhone(e.target.value))}
                    disabled={loading}
                    maxLength={15}
                    inputMode="tel"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl neumorph-input text-[#17323D] dark:text-white placeholder:text-neutral-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#17323D] to-[#254A59] hover:from-[#1D3E4B] hover:to-[#2F5B6D] transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#C5A880]" />
                    <span>Localizando cadastro...</span>
                  </>
                ) : (
                  <>
                    <span>Receber Código de Acesso</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#C5A880]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Passo 2: Digitar Código OTP recebido por e-mail */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#17323D] dark:text-[#EEECE5] mb-1.5">
                  Código de 6 Dígitos
                </label>
                <input
                  type="text"
                  required
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="w-full px-4 py-3.5 text-center tracking-[0.5em] font-mono text-xl font-bold rounded-xl neumorph-input text-[#17323D] dark:text-white placeholder:text-neutral-300 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#17323D] to-[#254A59] hover:from-[#1D3E4B] hover:to-[#2F5B6D] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#C5A880]" />
                    <span>Verificando código...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Entrar no Portal</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                disabled={loading}
                className="w-full py-2.5 text-xs text-[#AD7B3B] hover:underline flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Corrigir dados ou reenviar código</span>
              </button>
            </form>
          )}

          {/* Passo 3: Sem e-mail cadastrado */}
          {step === 'sem_email' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {contactMessage || 'Não localizamos um e-mail cadastrado para este CPF. Por favor, entre em contato com a imobiliária para atualizar seus dados.'}
              </div>
              <button
                onClick={() => setStep('request')}
                className="w-full py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
              >
                Tentar com outros dados
              </button>
            </div>
          )}

          {/* Rodapé do Cartão */}
          <div className="mt-8 pt-5 border-t border-slate-200/60 dark:border-white/10 text-center space-y-2">
            <p className="text-[11px] text-[#6B6375] dark:text-muted-foreground">
              Acesso exclusivo para clientes (locatários, proprietários, compradores e fiadores)
            </p>
            <a
              href="/login"
              className="inline-block text-xs font-semibold text-[#AD7B3B] hover:underline"
            >
              É da equipe interna? Acesse o painel corporativo →
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function PortalBlueprintIllustration() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
      <svg className="w-full h-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="gridPortal" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#AD7B3B" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridPortal)" />
        <g stroke="#AD7B3B" strokeWidth="1.2" strokeOpacity="0.5" fill="none">
          <rect x="100" y="80" width="600" height="440" rx="4" />
          <line x1="300" y1="80" x2="300" y2="520" />
          <line x1="500" y1="80" x2="500" y2="520" />
          <line x1="100" y1="280" x2="700" y2="280" />
        </g>
      </svg>
    </div>
  )
}

export default LoginPortal
