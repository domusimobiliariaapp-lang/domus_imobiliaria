import { useEffect, useState } from 'react'
import { 
  Plus, KeyRound, Power, Trash2, Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/integrations/supabase/client'
import { devAdmin, DevAdminError, type DevUser } from '@/lib/devAdmin'
import type { Organization } from '@/types'

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'corretor', label: 'Corretor' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'juridico', label: 'Jurídico' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'dev', label: 'DEV' },
]

const ROLE_LABELS = Object.fromEntries(ROLES.map((r) => [r.value, r.label]))

function formatDateTime(value: string | null): string {
  if (!value) return 'nunca entrou'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DevUsers() {
  const { addToast } = useToast()
  const [users, setUsers] = useState<DevUser[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'corretor', org_id: '' })

  const [passwordFor, setPasswordFor] = useState<DevUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', role: '', org_id: '' })

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [{ users: userList }, { data: orgList }] = await Promise.all([
        devAdmin.listUsers(),
        // A tabela organizations só é legível pela própria org, e a DEV não tem
        // org — a query direto voltaria vazia por RLS. A RPC é SECURITY DEFINER
        // e filtrada por is_dev() no servidor.
        supabase.rpc('dev_org_names'),
      ])
      setUsers(userList)
      setOrgs((orgList ?? []) as Organization[])
      // organizations só é legível pela própria org (ou DEV via policy). Um
      // erro aqui não impede a listagem de contas, só a coluna de imobiliária.
      if (orgList.error) {
        setLoadError(
          `Não foi possível carregar as imobiliárias: ${orgList.error.message}`,
        )
      }
    } catch (error) {
      const message =
        error instanceof DevAdminError ? error.message : 'Falha ao carregar contas.'
      setLoadError(message)
      addToast(message, 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const orgName = (orgId: string | null) =>
    orgs.find((o) => o.id === orgId)?.name ?? (orgId ? '—' : 'sem imobiliária')

  const isBanned = (user: DevUser) => {
    const banned = user.dev_metadata?.banned as string | undefined
    return typeof banned === 'string' && banned !== 'none'
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await devAdmin.createUser({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        org_id: form.role === 'dev' ? null : form.org_id,
      })
      addToast(`Conta ${form.email} criada.`, 'success')
      setForm({ email: '', password: '', full_name: '', role: 'corretor', org_id: '' })
      setCreating(false)
      load()
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao criar conta.', 'error')
    }
  }

  const handleSetPassword = async () => {
    if (!passwordFor) return
    try {
      await devAdmin.setPassword(passwordFor.id, newPassword)
      addToast(`Senha de ${passwordFor.email} alterada.`, 'success')
      setPasswordFor(null)
      setNewPassword('')
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao trocar a senha.', 'error')
    }
  }

  const handleToggle = async (user: DevUser) => {
    try {
      const next = !isBanned(user)
      await devAdmin.toggleActive(user.id, !next)
      addToast(
        next ? `${user.email} desativado. Sessões encerradas.` : `${user.email} reativado.`,
        'success',
      )
      load()
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao alterar status.', 'error')
    }
  }

  const handleDelete = async (user: DevUser) => {
    if (!confirm(`Excluir a conta ${user.email}? Esta ação não pode ser desfeita.`)) return
    try {
      await devAdmin.deleteUser(user.id)
      addToast(`Conta ${user.email} excluída.`, 'success')
      load()
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao excluir.', 'error')
    }
  }

  const handleSaveEdit = async (userId: string) => {
    try {
      await devAdmin.updateUser({
        user_id: userId,
        full_name: editForm.full_name,
        role: editForm.role,
        org_id: editForm.role === 'dev' ? null : editForm.org_id || null,
      })
      addToast('Conta atualizada.', 'success')
      setEditing(null)
      load()
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao salvar.', 'error')
    }
  }

  const filtered = users.filter((user) => {
    const term = search.toLowerCase()
    return (
      term === '' ||
      user.email.toLowerCase().includes(term) ||
      user.full_name.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl">Contas</h2>
          <p className="text-sm text-muted-foreground">
            {users.length} contas no sistema
          </p>
        </div>
        <Button
          onClick={() => setCreating((v) => !v)}
          className="rounded-md bg-[#17323D] text-white hover:bg-[#17323D]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova conta
        </Button>
      </div>

      {creating && (
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Criar conta</CardTitle>
            <CardDescription>
              A conta entra já vinculada à imobiliária escolhida e pode entrar
              imediatamente — o e-mail nasce confirmado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new_email">E-mail</Label>
                <Input
                  id="new_email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_name">Nome</Label>
                <Input
                  id="new_name"
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Senha provisória</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_role">Papel</Label>
                <select
                  id="new_role"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {form.role !== 'dev' && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new_org">Imobiliária</Label>
                  <select
                    id="new_org"
                    value={form.org_id}
                    onChange={(e) => setForm((p) => ({ ...p, org_id: e.target.value }))}
                    required
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                  >
                    <option value="">Selecione...</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setCreating(false)} className="rounded-md">
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-md bg-[#17323D] text-white hover:bg-[#17323D]/90">
                  Criar conta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-md">
        <CardContent className="pt-6">
          {loadError && (
            <Alert variant="error" title="Erro ao carregar" className="mb-4">
              {loadError}
            </Alert>
          )}
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="mb-4"
          />

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="pb-2 pr-3 font-medium">Conta</th>
                    <th className="pb-2 pr-3 font-medium">Papel</th>
                    <th className="pb-2 pr-3 font-medium">Imobiliária</th>
                    <th className="pb-2 pr-3 font-medium">Último acesso</th>
                    <th className="pb-2 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const banned = isBanned(user)
                    if (editing === user.id) {
                      return (
                        <tr key={user.id} className="border-b">
                          <td colSpan={5} className="py-3">
                            <div className="grid gap-2 sm:grid-cols-3">
                              <Input
                                value={editForm.full_name}
                                onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                                placeholder="Nome"
                              />
                              <select
                                value={editForm.role}
                                onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                                className="h-9 px-3 rounded-md border bg-background text-sm"
                              >
                                {ROLES.map((r) => (
                                  <option key={r.value} value={r.value}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                              {editForm.role !== 'dev' && (
                                <select
                                  value={editForm.org_id}
                                  onChange={(e) => setEditForm((p) => ({ ...p, org_id: e.target.value }))}
                                  className="h-9 px-3 rounded-md border bg-background text-sm"
                                >
                                  <option value="">Sem imobiliária</option>
                                  {orgs.map((o) => (
                                    <option key={o.id} value={o.id}>
                                      {o.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditing(null)}
                                className="rounded-md"
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(user.id)}
                                className="rounded-md bg-[#17323D] text-white"
                              >
                                Salvar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                    return (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-3">
                          <p className="font-medium">{user.full_name || user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                            {ROLE_LABELS[user.role] ?? user.role}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                          <span className={banned ? 'text-destructive' : undefined}>
                            {banned ? 'desativada' : formatDateTime(user.last_sign_in_at)}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md shrink-0"
                              title="Editar"
                              onClick={() => {
                                setEditing(user.id)
                                setEditForm({
                                  full_name: user.full_name,
                                  role: user.role,
                                  org_id: user.org_id ?? '',
                                })
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md shrink-0"
                              title="Trocar senha"
                              onClick={() => {
                                setPasswordFor(user)
                                setNewPassword('')
                              }}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md shrink-0"
                              title={banned ? 'Reativar' : 'Desativar'}
                              onClick={() => handleToggle(user)}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md shrink-0 text-destructive hover:text-destructive disabled:opacity-30"
                              title="Excluir"
                              onClick={() => handleDelete(user)}
                              disabled={user.role === 'dev'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {passwordFor && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-md rounded-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Trocar senha</CardTitle>
              <CardDescription>
                {passwordFor.email} entra com a nova senha imediatamente. As
                sessões abertas desta conta não são encerradas por esta troca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pwd">Nova senha</Label>
                <Input
                  id="pwd"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPasswordFor(null)
                    setNewPassword('')
                  }}
                  className="rounded-md"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSetPassword}
                  disabled={newPassword.length < 8}
                  className="rounded-md bg-[#17323D] text-white hover:bg-[#17323D]/90"
                >
                  Alterar senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default DevUsers
