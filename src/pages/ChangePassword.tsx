/**
 * Troca de senha obrigatória no primeiro acesso.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTA TELA EXISTE
 * ---------------------------------------------------------------------------
 *
 * A conta da equipe nasce pela edge function org-team, que define uma senha
 * provisória para o funcionário nunca ter que criar conta sozinho. O problema
 * é que essa senha é escolhida pelo admin, não por quem vai usar — e ela continua
 * valendo até alguém lembrar de trocar. O admin conta por telefone, o
 * funcionário anota no celular, e a conta fica com uma senha que nenhuma das
 * duas pessoas considera sua.
 *
 * O flag que dispara esta tela vive em app_metadata, e é o que separa "acabei de
 * criar essa conta" de "já trocou a senha uma vez".
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELA APARECE NO LUGAR DE UM MODAL
 * ---------------------------------------------------------------------------
 *
 * Ela é uma tela cheia, não um modal sobre o admin. Quem entra com senha
 * provisória não deveria enxergar uma única linha da área interna — nem por
 * um segundo, e nem "só para conferir". Se a tela é um modal, o conteúdo atrás
 * carregou, com dados de imóveis e de outros clientes, antes de a troca ser
 * exigida.
 */

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** Regras mínimas. O limite de 72 é do bcrypt, não escolha nossa. */
function validarSenha(senha: string): string | null {
  if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
  if (senha.length > 72) return 'A senha deve ter no máximo 72 caracteres.'
  if (!/[a-zA-Z]/.test(senha)) return 'Inclua pelo menos uma letra.'
  if (!/\d/.test(senha)) return 'Inclua pelo menos um número.'
  return null
}

export function ChangePassword() {
  const { profile, user, updatePassword, signOut, requiresPasswordChange } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!requiresPasswordChange && profile) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [requiresPasswordChange, profile, navigate])

  const [atual, setAtual] = React.useState('')
  const [nova, setNova] = React.useState('')
  const [confirmacao, setConfirmacao] = React.useState('')
  const [erro, setErro] = React.useState<string | null>(null)
  const [salvando, setSalvando] = React.useState(false)
  const [concluido, setConcluido] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (nova !== confirmacao) {
      setErro('A confirmação não bate com a nova senha.')
      return
    }

    const problema = validarSenha(nova)
    if (problema) {
      setErro(problema)
      return
    }

    if (nova === atual) {
      setErro('A nova senha precisa ser diferente da atual.')
      return
    }

    setSalvando(true)
    const { error } = await updatePassword(nova, atual)
    setSalvando(false)

    if (error) {
      setErro(error.message)
      return
    }
    setConcluido(true)
  }

  const handleSair = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  if (concluido) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <div>
              <h1 className="text-xl font-serif font-medium text-primary">Senha atualizada</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Você já pode usar o sistema normalmente.
              </p>
            </div>
            <Button
              onClick={() => navigate('/admin', { replace: true })}
              className="w-full bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white"
            >
              Ir para o painel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-xl">Defina sua senha</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {profile?.full_name || user?.email}, sua conta foi criada com uma senha
            provisória. Troque-a agora para uma senha só sua.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/30 flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="senha-atual">Senha provisória</Label>
              <Input
                id="senha-atual"
                type="password"
                value={atual}
                onChange={(e) => setAtual(e.target.value)}
                placeholder="A senha que o administrador passou"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="senha-nova">Nova senha</Label>
              <Input
                id="senha-nova"
                type="password"
                value={nova}
                onChange={(e) => setNova(e.target.value)}
                placeholder="Pelo menos 8 caracteres, com letra e número"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="senha-confirmar">Confirmar nova senha</Label>
              <Input
                id="senha-confirmar"
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={salvando}
              className="w-full bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white"
            >
              {salvando ? 'Salvando…' : 'Salvar nova senha'}
            </Button>

            <button
              type="button"
              onClick={handleSair}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sair e entrar depois
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
