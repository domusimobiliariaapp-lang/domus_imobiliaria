import * as React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertCircle } from 'lucide-react'

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

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

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
        body: JSON.stringify({ cpf_cnpj: cpfCnpj, telefone: phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'sem_email') {
          setStep('sem_email')
          setContactMessage(data.message)
        } else {
          setError(data.error || 'Erro ao enviar código')
        }
      } else {
        setEmailMasked(data.email_masked)
        setEmailReal(data.email)
        setStep('verify')
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
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
      const { error } = await supabase.auth.verifyOtp({
        email: emailReal,
        token: code,
        type: 'email',
      })

      if (error) {
        setError('Código inválido ou expirado. Tente novamente.')
      } else {
        navigate('/portal/dashboard')
      }
    } catch (err) {
      setError('Erro ao verificar código. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#17323D] to-[#0d1f26] text-white relative overflow-hidden">
        <div>
          <span className="font-serif text-4xl font-medium tracking-tight">
            Domus<span className="text-[#AD7B3B]">.</span>
          </span>
        </div>

        <div className="max-w-md">
          <p className="text-lg leading-relaxed opacity-90">
            Acesse seus contratos, pagamentos, documentos e comunicados
            da sua imobiliária de forma simples e segura.
          </p>
        </div>

        <div className="text-sm opacity-50">
          Portal do Cliente · Domus
        </div>

        <div className="absolute bottom-0 right-0 w-full h-1/2 opacity-5" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="gradPortal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#AD7B3B" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#17323D" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points="0,100 100,0 100,100" fill="url(#gradPortal)" />
          </svg>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Portal do Cliente</CardTitle>
            <CardDescription>CPF/CNPJ + telefone + código por e-mail</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2" role="alert">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {step === 'request' && (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    type="text"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                    required
                    disabled={loading}
                    maxLength={18}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    required
                    disabled={loading}
                    maxLength={15}
                  />
                </div>
                <Button type="submit" className="w-full bg-[#17323D] text-white hover:bg-[#17323D]/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AD7B3B] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar código por e-mail'}
                </Button>
              </form>
            )}

            {step === 'sem_email' && (
              <div className="space-y-4 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-amber-600" />
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {contactMessage}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setStep('request')}>
                  Tentar com outros dados
                </Button>
              </div>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código de verificação</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    Enviamos um código para <strong>{emailMasked}</strong>
                  </div>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={loading}
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#17323D] text-white hover:bg-[#17323D]/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AD7B3B] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none" disabled={loading}>
                  {loading ? 'Verificando...' : 'Verificar e entrar'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep('request')}
                  disabled={loading}
                >
                  Reenviar código
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Separator />
            <p className="text-center text-sm text-muted-foreground">
              Acesso para clientes (locatário, proprietário, comprador, fiador)
            </p>
            <Button variant="ghost" className="w-full" asChild>
              <a href="/login">É da equipe? Acesse a área administrativa →</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}