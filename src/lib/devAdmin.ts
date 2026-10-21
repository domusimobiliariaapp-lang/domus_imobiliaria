import { supabase } from '@/integrations/supabase/client'
import type { SaasPlan } from '@/types'

/**
 * Cliente das edge functions de administração.
 *
 * Criar conta, trocar senha e listar logins exigem service role, que não pode
 * viver no navegador. Tudo que é sensível demais para a RLS passa por aqui —
 * e cada função revalida is_dev() no token de quem chama, porque a service role
 * ignora a RLS.
 */

export interface DevUser {
  id: string
  email: string
  full_name: string
  role: string
  org_id: string | null
  created_at: string
  last_sign_in_at: string | null
  /** app_metadata do auth.users — traz `banned` quando a conta está desativada. */
  dev_metadata: Record<string, unknown>
}

export interface OrgStats {
  org_id: string
  org_name: string
  org_slug: string
  active: boolean
  created_at: string
  profiles: number
  properties: number
  leases: number
  sales: number
  tickets: number
}

export interface AppErrorLog {
  id: string
  source: string
  message: string
  stack: string | null
  context: Record<string, unknown> | null
  severity: 'error' | 'warning' | 'info'
  user_id: string | null
  org_id: string | null
  created_at: string
}

export interface SupportTicket {
  id: string
  org_id: string
  opened_by: string
  subject: string
  status: 'aberto' | 'respondido' | 'fechado'
  last_reply_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface SupportMessage {
  id: string
  ticket_id: string
  author_id: string
  body: string
  is_dev: boolean
  created_at: string
}

export class DevAdminError extends Error {}

/** Chama a edge function com o token da sessão e propaga a mensagem de erro. */
async function call<T>(fn: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new DevAdminError('Sessão expirada. Entre novamente.')

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
    throw new DevAdminError(data.error ?? 'Erro inesperado na administração.')
  }
  return data as T
}

export const devAdmin = {
  listUsers: () => call<{ users: DevUser[] }>('dev-admin', { action: 'list_users' }),

  createUser: (input: {
    email: string
    password: string
    full_name: string
    role: string
    org_id: string | null
  }) => call<{ success: true; id: string }>('dev-admin', { action: 'create_user', ...input }),

  updateUser: (input: { user_id: string; full_name?: string; role?: string; org_id?: string | null }) =>
    call<{ success: true }>('dev-admin', { action: 'update_user', ...input }),

  setPassword: (userId: string, password: string) =>
    call<{ success: true }>('dev-admin', { action: 'set_password', user_id: userId, password }),

  toggleActive: (userId: string, active: boolean) =>
    call<{ success: true }>('dev-admin', { action: 'toggle_active', user_id: userId, active }),

  deleteUser: (userId: string) =>
    call<{ success: true }>('dev-admin', { action: 'delete_user', user_id: userId }),

  updateOrganization: (orgId: string, patch: Record<string, string>) =>
    call<{ success: true }>('dev-admin', { action: 'update_organization', org_id: orgId, ...patch }),

  /**
   * Excluir é irreversível e leva junto contratos, pagamentos e histórico.
   * O backend exige que o nome seja digitado corretamente — o nome não vem daqui
   * por segurança, ele é conferido contra o registro no servidor.
   */
  deleteOrganization: (orgId: string, confirmName: string) =>
    call<{ success: true }>('dev-admin', {
      action: 'delete_organization',
      org_id: orgId,
      confirm_name: confirmName,
    }),

  orgStats: async () => {
    const { data, error } = await supabase.rpc('dev_org_stats')
    if (error) throw new DevAdminError(error.message)
    return (data ?? []) as OrgStats[]
  },

  errorLogs: async (limit = 100) => {
    const { data, error } = await supabase
      .from('app_error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new DevAdminError(error.message)
    return (data ?? []) as AppErrorLog[]
  },

  clearErrorLogs: async () => {
    // DELETE não tem policy no RLS de propósito: só a service role limpa, e a
    // limpeza é logada.
    return call<{ success: true }>('dev-admin', { action: 'clear_error_logs' })
  },

  tickets: async () => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new DevAdminError(error.message)
    return (data ?? []) as SupportTicket[]
  },

  ticketMessages: async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    if (error) throw new DevAdminError(error.message)
    return (data ?? []) as SupportMessage[]
  },

  setTicketStatus: async (ticketId: string, status: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status,
        closed_at: status === 'fechado' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
    if (error) throw new DevAdminError(error.message)
  },

  /** Abre um chamado em nome da imobiliária do usuário. */
  openTicket: async (subject: string, body: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new DevAdminError('Sessão expirada.')

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({ subject, opened_by: user.id })
      .select()
      .single()
    if (error) throw new DevAdminError(error.message)

    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({ ticket_id: data.id, author_id: user.id, body, is_dev: false })
    if (msgError) throw new DevAdminError(msgError.message)

    return data as SupportTicket
  },

  replyTicket: async (ticketId: string, body: string, isDev: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new DevAdminError('Sessão expirada.')

    const { error } = await supabase
      .from('support_messages')
      .insert({ ticket_id: ticketId, author_id: user.id, body, is_dev: isDev })
    if (error) throw new DevAdminError(error.message)

    await supabase
      .from('support_tickets')
      .update({
        status: isDev ? 'respondido' : 'aberto',
        last_reply_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
  },

  /** Lista todos os planos de assinatura SaaS configurados */
  getPlans: async () => {
    try {
      const { data, error } = await supabase
        .from('saas_plans')
        .select('*')
        .order('price_monthly', { ascending: true })

      if (!error && data && data.length > 0) {
        return data as SaasPlan[]
      }
    } catch {
      // Ignora erro de tabela não criada no schema cache
    }

    // Fallback padrão para exibição sem travar a interface
    return [
      {
        id: 'starter',
        name: 'Starter',
        description: 'Para corretores autônomos e imobiliárias boutique com até 35 contratos de aluguel.',
        price_monthly: 229,
        price_annual_monthly: 189,
        max_properties: 35,
        max_users: 2,
        features: { subdomain: true, portal: true, crm: false, vistorias: false, custom_domain: false },
        popular: false,
        badge: null,
        active: true,
      },
      {
        id: 'pro',
        name: 'Profissional',
        description: 'Gestão completa para imobiliárias em expansão com automação de ponta a ponta.',
        price_monthly: 489,
        price_annual_monthly: 389,
        max_properties: 150,
        max_users: 6,
        features: { subdomain: true, portal: true, crm: true, vistorias: true, custom_domain: false },
        popular: true,
        badge: 'Mais Escolhido',
        active: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Estrutura robusta para grandes carteiras, franquias e redes imobiliárias.',
        price_monthly: 980,
        price_annual_monthly: 790,
        max_properties: null,
        max_users: null,
        features: { subdomain: true, portal: true, crm: true, vistorias: true, custom_domain: true },
        popular: false,
        badge: 'Sem Limites',
        active: true,
      },
    ] as SaasPlan[]
  },

  /** Atualiza valores, limites e recursos de um plano pelo painel DEV */
  updatePlan: async (plan: Partial<SaasPlan> & { id: string }) => {
    const { data, error } = await supabase.rpc('dev_update_plan', {
      p_plan_id: plan.id,
      p_price_monthly: plan.price_monthly,
      p_price_annual_monthly: plan.price_annual_monthly,
      p_max_properties: plan.max_properties ?? null,
      p_max_users: plan.max_users ?? null,
      p_features: plan.features ?? {},
      p_popular: Boolean(plan.popular),
      p_badge: plan.badge ?? null,
      p_active: plan.active ?? true,
    })
    if (error) throw new DevAdminError(error.message)
    return data
  },

  /** Altera plano, status de assinatura ou estende dias de trial de uma imobiliária */
  setOrgSubscription: async (orgId: string, planId: string, status: string, extendDays = 0) => {
    const { data, error } = await supabase.rpc('dev_set_org_subscription', {
      p_org_id: orgId,
      p_plan_id: planId,
      p_subscription_status: status,
      p_extend_days: extendDays,
    })
    if (error) throw new DevAdminError(error.message)
    return data
  },
}
