import * as React from 'react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, Check } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { DomusLogo } from '@/components/brand/DomusLogo'

export function LoginAdmin() {
  const [searchParams] = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''
  const [email, setEmail] = useState(emailFromUrl)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      // Recupera a role do perfil recém-criado/atualizado pra
      // redirecionar cada tipo de usuário pro destino correto.
      const { data: { user } } = await supabase.auth.getUser()
      const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role as string | undefined
      setTimeout(() => {
        if (role === 'dev') {
          navigate('/dev', { replace: true })
        } else if (role === 'cliente') {
          navigate('/portal/dashboard', { replace: true })
        } else {
          navigate('/admin', { replace: true })
        }
      }, 400)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#EEECE5] dark:bg-[#0E1E24]">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#17323D] via-[#1A3845] to-[#0d1f26] text-white relative overflow-hidden shadow-2xl">
        {/* Brand */}
        <div className="relative z-10">
          <DomusLogo size="lg" className="[&_span]:text-white [&_p]:text-white/70" />
        </div>

        {/* Tagline */}
        <div className="max-w-md relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B]/20 text-[#AD7B3B] border border-[#AD7B3B]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sistema Multi-Tenant Isolado</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-white leading-tight">
            Gestão patrimonial completa para imobiliárias de alta performance.
          </h2>
          <p className="text-sm leading-relaxed text-white/80">
            Controle contratos, réguas de cobrança por PIX, conciliação e repasses aos proprietários sem dor de cabeça no fim do mês.
          </p>
        </div>

        {/* Footer */}
        <div className="text-xs text-white/50 relative z-10 flex items-center justify-between">
          <span>Sistema Domus • Uso interno autorizado</span>
          <span>Criptografia de ponta a ponta</span>
        </div>

        {/* Blueprint Illustration */}
        <BlueprintIllustration />
      </div>

      {/* Right Panel - Neumorphic Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Elementos de ambientação suave em Neumorphism no fundo */}
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

          {/* Ícone de Cadeado em Relevo com gradiente Ouro Domus */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full neumorph-btn flex items-center justify-center text-[#AD7B3B] shadow-md">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#AD7B3B] to-[#C89551] flex items-center justify-center text-white shadow-inner">
                <Lock className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>
          </div>

          {/* Título e Subtítulo */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-serif font-bold tracking-tight text-[#17323D] dark:text-[#EEECE5]">
              Bem-vindo ao Domus
            </h1>
            <p className="text-xs text-[#6B6375] dark:text-muted-foreground mt-1">
              Área administrativa — digite seus dados para entrar
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 text-xs text-red-700 bg-red-100/80 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-xl"
              role="alert"
            >
              {error}
            </motion.div>
          )}

          {/* Formulário Neumórfico Real */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input E-mail */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#17323D] dark:text-[#EEECE5] block pl-1">
                E-mail
              </label>
              <div className="w-full h-12 rounded-2xl neumorph-inset flex items-center px-4 transition-all focus-within:ring-2 focus-within:ring-[#AD7B3B]/40">
                <Mail className="w-4 h-4 text-[#6B6375] mr-3 shrink-0" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@imobiliaria.com.br"
                  disabled={loading}
                  autoComplete="email"
                  className="w-full bg-transparent text-sm text-[#17323D] dark:text-white placeholder:text-muted-foreground focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#17323D] dark:text-[#EEECE5] block pl-1">
                Senha
              </label>
              <div className="w-full h-12 rounded-2xl neumorph-inset flex items-center px-4 transition-all focus-within:ring-2 focus-within:ring-[#AD7B3B]/40">
                <Lock className="w-4 h-4 text-[#6B6375] mr-3 shrink-0" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-[#17323D] dark:text-white placeholder:text-muted-foreground focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#6B6375] hover:text-[#17323D] dark:hover:text-white transition-colors p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Lembrar-me */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#6B6375] dark:text-muted-foreground font-medium">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded neumorph-inset flex items-center justify-center transition-all ${
                    rememberMe ? 'text-[#AD7B3B] font-bold' : 'text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                Lembrar neste navegador
              </label>
            </div>

            {/* Botão de Entrar Neumórfico */}
            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl neumorph-btn-primary font-semibold text-white hover:bg-[#1f4250] text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : success ? (
                  <span className="text-[#AD7B3B] flex items-center gap-2 font-bold">
                    <Check className="w-4 h-4 stroke-[3]" /> Acesso Autorizado!
                  </span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Links e Alternâncias */}
          <div className="mt-6 pt-4 border-t border-[#D4D0C8]/60 dark:border-[#2D4A51] space-y-3 text-center text-xs">
            <p className="text-muted-foreground">
              Acesso restrito para equipe interna (admin, corretor, financeiro, jurídico).
            </p>
            <a
              href="/portal/login"
              className="inline-flex items-center justify-center text-xs font-semibold text-[#AD7B3B] hover:text-[#8C6027] transition-colors"
            >
              É inquilino ou proprietário? Acesse o Portal sem Senha →
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Blueprint Illustration Component
function BlueprintIllustration() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        <defs>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.6; }
              50% { transform: scale(1.4); opacity: 0.9; }
            }
            .pulse-1 { animation: pulse 3.5s ease-in-out infinite; transform-origin: center; }
            .pulse-2 { animation: pulse 4s ease-in-out infinite 0.8s; transform-origin: center; }
            .pulse-3 { animation: pulse 3.8s ease-in-out infinite 1.6s; transform-origin: center; }
          ` }} />
        </defs>

        {/* Grid base sutil */}
        <g stroke="#AD7B3B" strokeWidth="0.3" strokeOpacity="0.08">
          <line x1="50" y1="50" x2="750" y2="50" />
          <line x1="50" y1="550" x2="750" y2="550" />
          <line x1="50" y1="50" x2="50" y2="550" />
          <line x1="750" y1="50" x2="750" y2="550" />
        </g>

        {/* Paredes externas (grossas) */}
        <g stroke="#AD7B3B" strokeWidth="3" strokeOpacity="0.2" fill="none">
          <rect x="80" y="80" width="580" height="380" rx="4" />
        </g>

        {/* Paredes internas (finas) */}
        <g stroke="#AD7B3B" strokeWidth="1.5" strokeOpacity="0.18" fill="none">
          <line x1="300" y1="80" x2="300" y2="300" />
          <line x1="300" y1="300" x2="520" y2="300" />
          <line x1="520" y1="80" x2="520" y2="300" />
          <line x1="80" y1="300" x2="300" y2="300" />
        </g>

        {/* Porta entrada principal (com arco de abertura) */}
        <g stroke="#AD7B3B" strokeWidth="2" strokeOpacity="0.22" fill="none">
          <line x1="80" y1="200" x2="80" y2="270" />
          <path d="M80 270 A40 40 0 0 1 120 270" />
          <path d="M80 255 A25 25 0 0 1 105 255" strokeOpacity="0.12" strokeWidth="1" />
        </g>

        {/* Porta quarto */}
        <g stroke="#AD7B3B" strokeWidth="1.5" strokeOpacity="0.18" fill="none">
          <line x1="300" y1="140" x2="300" y2="190" />
          <path d="M300 190 A25 25 0 0 1 275 190" />
        </g>

        {/* Porta banheiro */}
        <g stroke="#AD7B3B" strokeWidth="1.5" strokeOpacity="0.18" fill="none">
          <line x1="400" y1="300" x2="400" y2="340" />
          <path d="M400 340 A20 20 0 0 1 380 340" />
        </g>

        {/* Porta cozinha */}
        <g stroke="#AD7B3B" strokeWidth="1.5" strokeOpacity="0.18" fill="none">
          <line x1="520" y1="140" x2="520" y2="190" />
          <path d="M520 190 A25 25 0 0 0 545 190" />
        </g>

        {/* Janelas (linhas cruzadas) */}
        <g stroke="#AD7B3B" strokeWidth="1" strokeOpacity="0.15" fill="none">
          {/* Janela sala (esquerda) */}
          <line x1="80" y1="110" x2="80" y2="180" />
          <line x1="60" y1="130" x2="100" y2="130" />
          <line x1="60" y1="160" x2="100" y2="160" />

          {/* Janela quarto (esquerda) */}
          <line x1="80" y1="280" x2="80" y2="350" />
          <line x1="60" y1="300" x2="100" y2="300" />
          <line x1="60" y1="330" x2="100" y2="330" />

          {/* Janela sala (direita) */}
          <line x1="660" y1="110" x2="660" y2="180" />
          <line x1="640" y1="130" x2="680" y2="130" />
          <line x1="640" y1="160" x2="680" y2="160" />

          {/* Janela cozinha (direita) */}
          <line x1="660" y1="280" x2="660" y2="350" />
          <line x1="640" y1="300" x2="680" y2="300" />
          <line x1="640" y1="330" x2="680" y2="330" />

          {/* Janela banheiro (topo) */}
          <line x1="380" y1="80" x2="440" y2="80" />
          <line x1="395" y1="60" x2="395" y2="100" />
          <line x1="425" y1="60" x2="425" y2="100" />
        </g>

        {/* Rótulos dos ambientes (muito sutis) */}
        <g fontFamily="monospace" fontSize="9" fill="#AD7B3B" fillOpacity="0.12" textAnchor="middle">
          <text x="190" y="220">SALA</text>
          <text x="410" y="220">QUARTO</text>
          <text x="600" y="220">QUARTO</text>
          <text x="190" y="400">COZINHA</text>
          <text x="410" y="420">BANHEIRO</text>
        </g>

        {/* Pins de interesse (círculos com pulso) */}
        <g>
          {/* Pin 1 - Sala */}
          <circle className="pulse-1" cx="190" cy="220" r="6" fill="#AD7B3B" fillOpacity="0.6" />
          <circle cx="190" cy="220" r="10" stroke="#AD7B3B" strokeWidth="1" fill="none" strokeOpacity="0.3" />

          {/* Pin 2 - Cozinha */}
          <circle className="pulse-2" cx="190" cy="400" r="6" fill="#AD7B3B" fillOpacity="0.6" />
          <circle cx="190" cy="400" r="10" stroke="#AD7B3B" strokeWidth="1" fill="none" strokeOpacity="0.3" />

          {/* Pin 3 - Quarto principal */}
          <circle className="pulse-3" cx="410" cy="220" r="6" fill="#AD7B3B" fillOpacity="0.6" />
          <circle cx="410" cy="220" r="10" stroke="#AD7B3B" strokeWidth="1" fill="none" strokeOpacity="0.3" />
        </g>

        {/* Linhas de cota (dimensões) - muito sutis */}
        <g stroke="#AD7B3B" strokeWidth="0.5" strokeOpacity="0.1" fill="none">
          <line x1="120" y1="50" x2="680" y2="50" />
          <line x1="120" y1="55" x2="120" y2="50" />
          <line x1="680" y1="55" x2="680" y2="50" />
          <line x1="30" y1="120" x2="30" y2="460" />
          <line x1="25" y1="120" x2="30" y2="120" />
          <line x1="25" y1="460" x2="30" y2="460" />
        </g>

        {/* Título da planta (muito sutil) */}
        <text x="400" y="35" fontFamily="monospace" fontSize="8" fill="#AD7B3B" fillOpacity="0.1" textAnchor="middle" letterSpacing="4">
          PLANTA BAIXA - APARTAMENTO TIPO
        </text>
      </svg>
    </div>
  )
}

export default LoginAdmin