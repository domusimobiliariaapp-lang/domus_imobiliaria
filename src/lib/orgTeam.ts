import { supabase } from '@/integrations/supabase/client'

/**
 * Gestão da equipe da própria imobiliária.
 *
 * Vai para a edge function `org-team`, e não para o `dev-admin` que o painel
 * /dev usa: aquele exige is_dev(), então o admin de uma imobiliária comum não
 * entra. Aqui a autorização é invertida — admin da org, só para a própria org,
 * e nunca para o papel dev.
 *
 * A org_id nunca vem do front: a edge function tira do token. Passar o id pelo
 * formulário só criaria a ilusão de que dá para escolher a imobiliária.
 */

export class OrgTeamError extends Error {}

export interface TeamMember {
  id: string
  full_name: string
  email: string | null
  role: string
  created_at: string
  last_sign_in_at: string | null
  active: boolean
}

/** Papéis que o admin pode conceder. 'dev' é exclusivo do painel /dev. */
export const TEAM_ROLES: { value: string; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrador', description: 'Acesso total, inclusive configurações da empresa e equipe' },
  { value: 'corretor', label: 'Corretor', description: 'Imóveis, clientes, locações, vendas e contratos' },
  { value: 'financeiro', label: 'Financeiro', description: 'Pagamentos, financeiro e contratos' },
  { value: 'juridico', label: 'Jurídico', description: 'Documentos, contratos e parte jurídica' },
  { value: 'cliente', label: 'Cliente', description: 'Acesso ao portal, sem acesso administrativo' },
]

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  TEAM_ROLES.map((r) => [r.value, r.label]),
)

async function call<T>(fn: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new OrgTeamError('Sessão expirada. Entre novamente.')

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new OrgTeamError(data.error ?? 'Erro inesperado ao gerenciar a equipe.')
  }
  return data as T
}

export const orgTeam = {
  list: () => call<{ team: TeamMember[] }>('org-team', { action: 'list_team' }),

  create: (input: { email: string; password: string; full_name: string; role: string }) =>
    call<{ success: true; id: string }>('org-team', { action: 'create_user', ...input }),

  setPassword: (userId: string, password: string) =>
    call<{ success: true }>('org-team', { action: 'set_password', user_id: userId, password }),

  toggleActive: (userId: string, active: boolean) =>
    call<{ success: true }>('org-team', { action: 'toggle_active', user_id: userId, active }),
}
