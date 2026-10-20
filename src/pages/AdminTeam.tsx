import { useEffect, useState } from 'react'
import { Users, UserPlus, KeyRound, Power, PowerOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { orgTeam, OrgTeamError, TEAM_ROLES, ROLE_LABELS, type TeamMember } from '@/lib/orgTeam'

/**
 * Equipe da imobiliária.
 *
 * Só o admin da própria org chega aqui — a edge function confere, porque a
 * service role ignora a RLS e essa checagem no servidor é a única barreira.
 * Esconder o botão na interface não seria segurança, seria teatro.
 *
 * As contas criadas aqui aparecem na aba Contas do painel /dev do DEV, com a
 * org e o papel certos: o app_metadata é escrito pela mesma edge function.
 */

function formatDate(value: string | null): string {
  if (!value) return 'nunca entrou'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminTeam() {
  const { addToast } = useToast()
  const { profile } = useAuth()
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'corretor' })
  const [passwordFor, setPasswordFor] = useState<TeamMember | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const isAdmin = profile?.role === 'admin'

  const load = async () => {
    setLoading(true)
    try {
      const { team: members } = await orgTeam.list()
      setTeam(members)
    } catch (error) {
      addToast(
        error instanceof OrgTeamError ? error.message : 'Falha ao carregar a equipe.',
        'error',
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) load()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await orgTeam.create({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
      })
      addToast(`Acesso de ${form.email} criado.`, 'success')
      setForm({ full_name: '', email: '', password: '', role: 'corretor' })
      setCreating(false)
      load()
    } catch (error) {
      addToast(
        error instanceof OrgTeamError ? error.message : 'Falha ao criar o acesso.',
        'error',
      )
      setCreating(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordFor) return
    try {
      await orgTeam.setPassword(passwordFor.id, newPassword)
      addToast(`Senha de ${passwordFor.email} alterada.`, 'success')
      setPasswordFor(null)
      setNewPassword('')
    } catch (error) {
      addToast(
        error instanceof OrgTeamError ? error.message : 'Falha ao trocar a senha.',
        'error',
      )
    }
  }

  const handleToggle = async (member: TeamMember) => {
    try {
      await orgTeam.toggleActive(member.id, !member.active)
      addToast(
        member.active ? `${member.full_name} foi desativado.` : `${member.full_name} foi reativado.`,
        'success',
      )
      load()
    } catch (error) {
      addToast(
        error instanceof OrgTeamError ? error.message : 'Falha ao alterar o status.',
        'error',
      )
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 text-destructive bg-destructive/10 rounded-md p-4">
            <Users className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Apenas o administrador gerencia a equipe</p>
              <p className="text-sm">
                Sua conta não tem permissão para criar ou alterar acessos. Peça ao
                administrador da imobiliária.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const roleDescription = TEAM_ROLES.find((r) => r.value === form.role)?.description

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl flex items-center gap-2">
          <Users className="h-6 w-6" />
          Equipe
        </h2>
        <p className="text-sm text-muted-foreground">
          {team.length} {team.length === 1 ? 'pessoa com acesso' : 'pessoas com acesso'} ·
          estas contas aparecem também no painel do suporte
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Novo acesso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Conceder acesso
            </CardTitle>
            <CardDescription>
              Cria um login para um funcionário da sua imobiliária. Ele entra pelo
              e-mail e senha em /login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team_name">Nome</Label>
                <Input
                  id="team_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_email">E-mail</Label>
                <Input
                  id="team_email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="funcionario@imobiliaria.com.br"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_password">Senha provisória</Label>
                <Input
                  id="team_password"
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo de 8 caracteres"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Combine a troca no primeiro acesso com o funcionário.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_role">Permissão</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger id="team_role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {roleDescription && (
                  <p className="text-xs text-muted-foreground">{roleDescription}</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {creating ? 'Criando...' : 'Criar acesso'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista da equipe */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : team.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum acesso criado ainda.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {team.map((member) => (
                <li
                  key={member.id}
                  className="p-4 rounded-md border border-border bg-card text-card-foreground"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Último acesso: {formatDate(member.last_sign_in_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{ROLE_LABELS[member.role] || member.role}</Badge>
                        {!member.active && (
                          <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">
                            Desativado
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Trocar senha"
                          title="Trocar senha"
                          onClick={() => { setPasswordFor(member); setNewPassword('') }}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={member.active ? 'Desativar acesso' : 'Reativar acesso'}
                          title={member.active ? 'Desativar acesso' : 'Reativar acesso'}
                          onClick={() => handleToggle(member)}
                        >
                          {member.active
                            ? <PowerOff className="h-4 w-4" />
                            : <Power className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Troca de senha */}
      {passwordFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPasswordFor(null)}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-md rounded-md bg-card text-card-foreground shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-border/40 bg-[#F7F5F0] rounded-t-md">
              <div>
                <h3 className="text-lg font-serif font-medium text-primary">
                  Trocar senha
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {passwordFor.full_name} · {passwordFor.email}
                </p>
              </div>
              <button
                type="button"
                className="absolute right-4 top-4 p-1 rounded-sm text-muted-foreground hover:text-foreground"
                onClick={() => setPasswordFor(null)}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSetPassword} className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">Nova senha</Label>
                <Input
                  id="new_password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  required
                  minLength={8}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setPasswordFor(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white"
                >
                  Alterar senha
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
