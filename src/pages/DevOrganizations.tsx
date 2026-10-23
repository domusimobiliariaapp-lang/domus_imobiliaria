import { useEffect, useState } from 'react'
import { Building2, Plus, Copy, Check, Pencil, X, Power, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/integrations/supabase/client'
import { devAdmin, DevAdminError, type OrgStats } from '@/lib/devAdmin'
import { formatCpfCnpj, formatBrazilianPhone } from '@/lib/inputMasks'
import type { Organization } from '@/types'

const emptyForm = {
  name: '',
  slug: '',
  admin_name: '',
  admin_email: '',
  admin_password: '',
  plan_id: 'pro',
  subscription_status: 'trial',
}

/** Deriva um slug válido do nome, como sugestão enquanto o usuário digita. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function DevOrganizations() {
  const { addToast } = useToast()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [stats, setStats] = useState<Map<string, OrgStats>>(new Map())
  const [loadingList, setLoadingList] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', slug: '', cnpj: '', phone: '', whatsapp: '' })
  const [deleting, setDeleting] = useState<Organization | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const [changingPlanOrg, setChangingPlanOrg] = useState<Organization | null>(null)
  const [modalPlanId, setModalPlanId] = useState('pro')
  const [modalStatus, setModalStatus] = useState('active')
  const [modalExtendDays, setModalExtendDays] = useState(3)
  const [savingSubscription, setSavingSubscription] = useState(false)

  const openPlanModal = (org: Organization) => {
    setChangingPlanOrg(org)
    setModalPlanId(org.plan_id || 'pro')
    setModalStatus(org.subscription_status || 'active')
    setModalExtendDays(3)
  }

  const handleSaveSubscription = async () => {
    if (!changingPlanOrg) return
    setSavingSubscription(true)
    try {
      await devAdmin.setOrgSubscription(
        changingPlanOrg.id,
        modalPlanId,
        modalStatus,
        modalStatus === 'trial' ? modalExtendDays : 0
      )
      addToast(`Assinatura de ${changingPlanOrg.name} atualizada.`, 'success')
      setChangingPlanOrg(null)
      loadOrganizations()
    } catch (err: any) {
      addToast(`Erro ao atualizar assinatura: ${err.message}`, 'error')
    } finally {
      setSavingSubscription(false)
    }
  }

  const loadOrganizations = async () => {
    setLoadingList(true)
    setLoadError(null)
    const [orgsResult, statsResult] = await Promise.all([
      // Pela RPC, e não pela tabela: a DEV não pertence a nenhuma org, então a
      // policy de SELECT (id = current_org_id() OR is_dev()) atenderia, mas
      // depender do GRANT da tabela é um segundo ponto de falha. A RPC é
      // SECURITY DEFINER com is_dev() dentro e devolve exatamente o necessário.
      supabase.rpc('dev_org_names'),
      devAdmin.orgStats().catch(() => [] as OrgStats[]),
    ])

    if (orgsResult.error) {
      const message = `Erro ao carregar imobiliárias: ${orgsResult.error.message}`
      setLoadError(message)
      addToast(message, 'error')
    } else {
      setOrganizations((orgsResult.data ?? []) as Organization[])
      setStats(new Map(statsResult.map((s) => [s.org_id, s])))
    }
    setLoadingList(false)
  }

  useEffect(() => {
    loadOrganizations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      // Enquanto o usuário não editar o slug à mão, ele acompanha o nome.
      slug: slugTouched ? prev.slug : slugify(value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setCreateError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setCreateError('Sessão expirada. Entre novamente.')
        return
      }

      // Criar a conta exige service role, que não pode viver no navegador.
      // A função checa is_dev() no token de quem chama antes de qualquer coisa.
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dev-create-organization`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(form),
        },
      )

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        // A causa precisa aparecer na tela. Um toast genérico de 3 segundos
        // obrigava a adivinar entre 500 da função, 403 do is_dev() e erro de
        // validação no formulário.
        const detail = payload.error
          ?? (response.status === 404
            ? 'A função dev-create-organization não está publicada. Rode: supabase functions deploy dev-create-organization'
            : `Erro ${response.status}`)
        setCreateError(detail)
        addToast(detail, 'error')
        return
      }

      addToast(`${payload.organization.name} criada. Administrador: ${payload.admin.email}`, 'success')
      setForm(emptyForm)
      setSlugTouched(false)
      loadOrganizations()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'erro desconhecido'
      setCreateError(`Falha de rede ao chamar a função: ${message}`)
      addToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/${slug}/imoveis`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(slug)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      addToast(`Não foi possível copiar. O endereço é ${url}`, 'error')
    }
  }

  const startEdit = (org: Organization) => {
    setEditing(org.id)
    setEditForm({
      name: org.name,
      slug: org.slug,
      cnpj: org.cnpj ?? '',
      phone: org.phone ?? '',
      whatsapp: org.whatsapp ?? '',
    })
  }

  const saveEdit = async (orgId: string) => {
    try {
      await devAdmin.updateOrganization(orgId, editForm)
      addToast('Imobiliária atualizada.', 'success')
      setEditing(null)
      loadOrganizations()
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao salvar.', 'error')
    }
  }

  const toggleActive = async (org: Organization) => {
    try {
      await supabase.from('organizations').update({ active: !org.active }).eq('id', org.id)
      addToast(
        org.active
          ? `${org.name} desativada: some da vitrine e ninguém mais entra.`
          : `${org.name} reativada.`,
        'success',
      )
      loadOrganizations()
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Falha ao alterar status.', 'error')
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await devAdmin.deleteOrganization(deleting.id, deleteConfirm)
      addToast(`${deleting.name} excluída definitivamente.`, 'success')
      setDeleting(null)
      setDeleteConfirm('')
      loadOrganizations()
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao excluir.', 'error')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-serif">
            <Plus className="h-5 w-5" />
            Nova imobiliária
          </CardTitle>
          <CardDescription>
            Cria a imobiliária e a conta do primeiro administrador. Ninguém além
            desta tela pode criar uma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {createError && (
              <Alert variant="error" title="Não foi possível criar" className="mb-4">
                {createError}
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da imobiliária</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Imobiliária Central"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Endereço do site</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                }}
                placeholder="imobiliaria-central"
                required
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                A vitrine pública ficará em <code>/{form.slug || 'slug'}/imoveis</code>
              </p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium">Administrador inicial</p>

              <div className="space-y-2">
                <Label htmlFor="admin_name">Nome</Label>
                <Input
                  id="admin_name"
                  value={form.admin_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, admin_name: e.target.value }))}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_email">E-mail</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={form.admin_email}
                  onChange={(e) => setForm((prev) => ({ ...prev, admin_email: e.target.value }))}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_password">Senha provisória</Label>
                <Input
                  id="admin_password"
                  type="password"
                  value={form.admin_password}
                  onChange={(e) => setForm((prev) => ({ ...prev, admin_password: e.target.value }))}
                  required
                  minLength={8}
                  disabled={submitting}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo de 8 caracteres. Passe esta senha ao administrador por um canal seguro.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="plan_id" className="text-xs font-medium">Plano Inicial</Label>
                  <select
                    id="plan_id"
                    value={form.plan_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, plan_id: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                    disabled={submitting}
                  >
                    <option value="starter">Starter (até 35 imóveis)</option>
                    <option value="pro">Profissional (até 150)</option>
                    <option value="enterprise">Enterprise (ilimitado)</option>
                    <option value="lifetime">Licença Vitalícia (Sem Mensalidade)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="subscription_status" className="text-xs font-medium">Status Inicial</Label>
                  <select
                    id="subscription_status"
                    value={form.subscription_status}
                    onChange={(e) => setForm((prev) => ({ ...prev, subscription_status: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                    disabled={submitting}
                  >
                    <option value="trial">Período de Teste (3 dias)</option>
                    <option value="active">Assinatura Ativa</option>
                  </select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#17323D] text-white hover:bg-[#17323D]/90 rounded-md"
            >
              {submitting ? 'Criando...' : 'Criar imobiliária'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-serif">
            <Building2 className="h-5 w-5" />
            Cadastradas
          </CardTitle>
          <CardDescription>{organizations.length} no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loadError && (
            <Alert variant="error" title="Erro ao carregar" className="mb-4">
              {loadError}
            </Alert>
          )}
          {loadingList ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma imobiliária cadastrada ainda.</p>
          ) : (
            <ul className="divide-y">
              {organizations.map((org) => {
                const stat = stats.get(org.id)
                const isEditing = editing === org.id
                return (
                  <li key={org.id} className="py-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Nome"
                        />
                        <Input
                          value={editForm.slug}
                          onChange={(e) => setEditForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                          placeholder="slug"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={formatCpfCnpj(editForm.cnpj)}
                            onChange={(e) => setEditForm((p) => ({ ...p, cnpj: formatCpfCnpj(e.target.value) }))}
                            placeholder="CPF ou CNPJ"
                            inputMode="numeric"
                            maxLength={18}
                          />
                          <Input
                            value={formatBrazilianPhone(editForm.whatsapp)}
                            onChange={(e) => setEditForm((p) => ({ ...p, whatsapp: formatBrazilianPhone(e.target.value) }))}
                            placeholder="WhatsApp"
                            inputMode="tel"
                            maxLength={15}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(org.id)} className="rounded-md">
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditing(null)}
                            className="rounded-md"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{org.name}</span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  org.plan_id === 'starter'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : org.plan_id === 'enterprise'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : 'bg-[#AD7B3B]/15 text-[#AD7B3B]'
                                }`}
                              >
                                {org.plan_id === 'starter' ? 'Starter' : org.plan_id === 'enterprise' ? 'Enterprise' : 'Profissional'}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  org.subscription_status === 'trial'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : org.subscription_status === 'blocked'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                                }`}
                              >
                                {org.subscription_status === 'trial' ? 'Trial 3d' : org.subscription_status === 'blocked' ? 'Bloqueado' : 'Ativo'}
                              </span>
                              {!org.active && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  inativa
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">/{org.slug}</p>
                            {stat && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {stat.profiles} contas · {stat.properties} imóveis ·{' '}
                                {stat.leases} contratos · {stat.sales} vendas
                                {stat.tickets > 0 && ` · ${stat.tickets} chamados`}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md shrink-0 text-[#AD7B3B] hover:text-[#AD7B3B]"
                              onClick={() => openPlanModal(org)}
                              title="Gerenciar Plano e Assinatura"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md shrink-0"
                              onClick={() => copyLink(org.slug)}
                              title="Copiar endereço da vitrine"
                            >
                              {copied === org.slug ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md shrink-0"
                              onClick={() => startEdit(org)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md shrink-0"
                              onClick={() => toggleActive(org)}
                              title={org.active ? 'Desativar' : 'Reativar'}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md shrink-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleting(org)
                                setDeleteConfirm('')
                              }}
                              title="Excluir"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-md rounded-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-destructive">
                Excluir {deleting.name}?
              </CardTitle>
              <CardDescription>
                Isso apaga permanentemente todos os imóveis, contratos, pagamentos
                e clientes desta imobiliária. Não há como desfazer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se só quiser tirar a imobiliária do ar, use o botão de desativar —
                os dados são preservados e a operação é reversível.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm">
                  Digite <strong>{deleting.name}</strong> para confirmar
                </Label>
                <Input
                  id="confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleting(null)
                    setDeleteConfirm('')
                  }}
                  className="rounded-md"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={deleteConfirm !== deleting.name}
                  className="rounded-md bg-destructive text-white hover:bg-destructive/90"
                >
                  Excluir definitivamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {changingPlanOrg && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-md rounded-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-serif">
                Gerenciar Assinatura de {changingPlanOrg.name}
              </CardTitle>
              <CardDescription>
                Altere o plano, o status da conta ou estenda o período de testes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="change-plan">Plano da Imobiliária</Label>
                <select
                  id="change-plan"
                  value={modalPlanId}
                  onChange={(e) => setModalPlanId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="starter">Starter (até 35 imóveis)</option>
                  <option value="pro">Profissional (até 150 imóveis)</option>
                  <option value="enterprise">Enterprise (ilimitado)</option>
                  <option value="lifetime">Licença Vitalícia (Sem Mensalidade)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="change-status">Status da Conta</Label>
                <select
                  id="change-status"
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="active">Ativo (acesso regular)</option>
                  <option value="trial">Período de Teste (Trial)</option>
                  <option value="blocked">Bloqueado (inadimplente / suspenso)</option>
                </select>
              </div>

              {modalStatus === 'trial' && (
                <div className="space-y-1.5">
                  <Label htmlFor="extend-days">Dias de Teste (a partir de hoje)</Label>
                  <Input
                    id="extend-days"
                    type="number"
                    min={1}
                    max={90}
                    value={modalExtendDays}
                    onChange={(e) => setModalExtendDays(Number(e.target.value))}
                    className="h-9 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Define a nova data de expiração para o período de testes.
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setChangingPlanOrg(null)}
                  disabled={savingSubscription}
                  className="rounded-md"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveSubscription}
                  disabled={savingSubscription}
                  className="rounded-md bg-[#17323D] text-white hover:bg-[#17323D]/90"
                >
                  {savingSubscription ? 'Salvando...' : 'Salvar Assinatura'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default DevOrganizations
