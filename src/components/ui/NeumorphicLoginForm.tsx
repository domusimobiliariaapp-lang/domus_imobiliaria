import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff, Plus, Check } from 'lucide-react'

interface NeumorphicLoginFormProps {
  onSuccess?: (email: string) => void
}

export function NeumorphicLoginForm({ onSuccess }: NeumorphicLoginFormProps) {
  const [email, setEmail] = useState('contato@domus.com.br')
  const [password, setPassword] = useState('••••••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLogged, setIsLogged] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsLogged(true)
      if (onSuccess) onSuccess(email)
    }, 1200)
  }

  return (
    <div className="relative w-full max-w-md mx-auto p-4 flex items-center justify-center">
      {/* Círculos de ambientação suave em Neumorphism no fundo (como no print) */}
      <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full neumorph-card opacity-70 pointer-events-none" />
      <div className="absolute -bottom-8 -right-8 w-52 h-52 rounded-full neumorph-card opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 -right-16 w-24 h-24 rounded-full neumorph-card opacity-50 pointer-events-none" />

      {/* Cartão Neumórfico Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full rounded-[2.5rem] p-10 neumorph-card border border-white/60"
      >
        {/* Ícone de Cadeado em Relevo com gradiente Ouro Domus (#AD7B3B) */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full neumorph-btn flex items-center justify-center text-[#AD7B3B] shadow-md">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#AD7B3B] to-[#C89551] flex items-center justify-center text-white shadow-inner">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Título e Subtítulo */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#17323D] font-serif">
            Bem-vindo ao Domus
          </h2>
          <p className="text-xs text-[#6B6375] mt-1 font-medium">
            Acesse o sistema com suas credenciais
          </p>
        </div>

        {/* Formulário com Inputs em Baixo-Relevo (Inset) */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input E-mail */}
          <div className="relative">
            <div className="w-full h-14 rounded-2xl neumorph-inset flex items-center px-4 transition-all">
              <Mail className="w-4 h-4 text-[#6B6375] mr-3 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail profissional"
                className="w-full bg-transparent text-sm text-[#17323D] placeholder:text-[#8C8694] focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Input Senha */}
          <div className="relative">
            <div className="w-full h-14 rounded-2xl neumorph-inset flex items-center px-4 transition-all">
              <Lock className="w-4 h-4 text-[#6B6375] mr-3 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha de acesso"
                className="w-full bg-transparent text-sm text-[#17323D] placeholder:text-[#8C8694] focus:outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#6B6375] hover:text-[#17323D] transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Lembrar-me e Esqueci Senha */}
          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[#6B6375] font-medium">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded neumorph-inset flex items-center justify-center transition-all ${
                  rememberMe ? 'text-[#AD7B3B] font-bold' : 'text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              Lembrar-me
            </label>

            <a
              href="#forgot"
              onClick={(e) => e.preventDefault()}
              className="text-[#AD7B3B] hover:text-[#8C6027] font-semibold transition-colors"
            >
              Esqueceu a senha?
            </a>
          </div>

          {/* Botão de Login Neumórfico - Azul Petróleo Domus com toque ouro */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 rounded-2xl neumorph-btn-primary font-semibold text-white hover:bg-[#1f4250] text-sm tracking-wide cursor-pointer flex items-center justify-center transition-all shadow-md"
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : isLogged ? (
                <span className="text-[#AD7B3B] flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 stroke-[3]" /> Conectado com Sucesso!
                </span>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </div>

          {/* Rodapé: Don't have an account? + */}
          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-[#6B6375]">
            <span>Precisa de suporte ou novo acesso?</span>
            <button
              type="button"
              className="w-7 h-7 rounded-full neumorph-btn flex items-center justify-center text-[#AD7B3B] hover:text-[#17323D] transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  )
}
