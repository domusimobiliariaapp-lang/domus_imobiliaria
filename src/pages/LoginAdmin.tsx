import * as React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'

export function LoginAdmin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
      navigate('/admin', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#17323D] to-[#0d1f26] text-white relative overflow-hidden">
        {/* Brand */}
        <div>
          <span className="font-serif text-4xl font-medium tracking-tight">
            Domus<span className="text-[#AD7B3B]">.</span>
          </span>
        </div>

        {/* Tagline */}
        <div className="max-w-md">
          <p className="text-lg leading-relaxed opacity-90">
            Gestão completa de locações e vendas para sua imobiliária.
            Controle contratos, pagamentos, documentos e clientes em um só lugar.
          </p>
        </div>

        {/* Footer */}
        <div className="text-sm opacity-50">
          Sistema de Gestão Imobiliária · Uso interno
        </div>

        {/* Blueprint Illustration */}
        <BlueprintIllustration />
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bem-vindo ao Domus</CardTitle>
            <CardDescription>Área administrativa — faça login para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full bg-[#17323D] text-white hover:bg-[#17323D]/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AD7B3B] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Separator />
            <p className="text-center text-sm text-muted-foreground">
              Acesso para equipe interna (admin, corretor, financeiro, jurídico)
            </p>
            <Button variant="ghost" className="w-full" asChild>
              <a href="/portal/login">É cliente? Acesse o portal →</a>
            </Button>
          </CardFooter>
        </Card>
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