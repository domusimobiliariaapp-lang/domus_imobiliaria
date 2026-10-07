import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { logQueryError } from '@/lib/errorLogger'
import { useAuth } from './useAuth'
import type { DashboardStats, Property, Lease, Sale, Payment, Notification, Document, Profile, LeaseHistory, Organization } from '@/types'

interface UseQueryResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

function useQuery<T>(
  fetcher: () => Promise<{ data: T | null; error: Error | null }>,
  deps: unknown[] = []
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const execute = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetcher()
      setData(result.data)
      setError(result.error)
      // Erro devolvido em vez de lançado: a tela mostra a mensagem, mas sem
      // registro ninguém descobre por que a lista veio vazia.
      if (result.error) {
        void logQueryError(result.error, 'useQuery', { deps: deps.map(String) })
      }
    } catch (err) {
      setError(err as Error)
      void logQueryError(err, 'useQuery', { deps: deps.map(String) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refetch: execute }
}

/**
 * Normaliza valores vazios antes de gravar.
 *
 * Um select não escolhido chega como string vazia, e '' não é um UUID: o
 * Postgres tenta converter e estoura com "invalid input syntax for type uuid:
 * \"\"". O mesmo acontece com número em coluna numérica.
 *
 * A conversão é aqui, e não em cada tela, porque o vazio é o mesmo em todas e
 * a lista de campos cresce conforme o schema. Regra: '' e NaN em coluna de
 * número viram null; string vazia comum vira null também, porque o que o
 * formulário quer dizer com "não preenchido" é sempre "sem valor".
 *
 * org_id é descartado por outro motivo e continua fora daqui — ver useCreateEntity.
 */
function limparPayload(data: Record<string, unknown>): Record<string, unknown> {
  const limpo: Record<string, unknown> = {}
  for (const [chave, valor] of Object.entries(data)) {
    if (valor === undefined) continue
    if (typeof valor === 'string' && valor.trim() === '') {
      limpo[chave] = null
    } else if (typeof valor === 'number' && !Number.isFinite(valor)) {
      limpo[chave] = null
    } else {
      limpo[chave] = valor
    }
  }
  return limpo
}

export function useDashboardStats(): UseQueryResult<DashboardStats> {
  const { profile } = useAuth()
  const orgId = profile?.org_id ?? null

  return useQuery(async () => {
    const [properties, leases, sales, payments] = await Promise.all([
      supabase.from('properties').select('*').eq('org_id', orgId),
      supabase.from('leases').select('*').eq('org_id', orgId),
      supabase.from('sales').select('*').eq('org_id', orgId),
      supabase.from('payments').select('*').eq('org_id', orgId),
    ])

    if (properties.error) throw properties.error
    if (leases.error) throw leases.error
    if (sales.error) throw sales.error
    if (payments.error) throw payments.error

    const stats: DashboardStats = {
      total_properties: properties.data?.length ?? 0,
      available_properties: properties.data?.filter((p) => p.status === 'disponivel').length ?? 0,
      rented_properties: properties.data?.filter((p) => p.status === 'alugado').length ?? 0,
      sold_properties: properties.data?.filter((p) => p.status === 'vendido').length ?? 0,
      total_leases: leases.data?.length ?? 0,
      active_leases: leases.data?.filter((l) => l.status === 'ativo').length ?? 0,
      total_sales: sales.data?.length ?? 0,
      pending_payments: payments.data?.filter((p) => p.status === 'pendente').length ?? 0,
      total_pending_amount:
        payments.data
          ?.filter((p) => p.status === 'pendente')
          .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0,
      total_collected:
        payments.data
          ?.filter((p) => p.status === 'pago')
          .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0,
    }

    return { data: stats, error: null }
  })
}

export function useProperties(): UseQueryResult<Property[]> {
  const { profile } = useAuth()
  const orgId = profile?.org_id ?? null

  return useQuery(async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function useProperty(id: string | null): UseQueryResult<Property> {
  return useQuery(
    async () => {
      if (!id) return { data: null, error: null }
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error: error ? new Error(error.message) : null }
    },
    [id]
  )
}

export function useLeases(): UseQueryResult<Lease[]> {
  const { profile } = useAuth()
  const orgId = profile?.org_id ?? null

  return useQuery(async () => {
    const { data, error } = await supabase
      .from('leases')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function useSales(): UseQueryResult<Sale[]> {
  const { profile } = useAuth()
  const orgId = profile?.org_id ?? null

  return useQuery(async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function usePayments(): UseQueryResult<Payment[]> {
  const { profile } = useAuth()
  const orgId = profile?.org_id ?? null

  return useQuery(async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('org_id', orgId)
      .order('due_date', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function useNotifications(): UseQueryResult<Notification[]> {
  return useQuery(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function useDocuments(): UseQueryResult<Document[]> {
  const { profile } = useAuth()
  const orgId = profile?.org_id ?? null

  return useQuery(async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function useProfiles(): UseQueryResult<Profile[]> {
  const { profile } = useAuth()
  const orgId = profile?.org_id ?? null

  return useQuery(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

/**
 * Configurações da imobiliária do usuário.
 *
 * A linha é por org_id, nunca por id fixo: buscar pelo id global pegaria a
 * linha de outra imobiliária (e o RLS a recusa). O org_id vem do profile, que
 * é a única fonte confiável de qual imobiliária é esta — sem ele a consulta
 * não roda, em vez de devolver a configuração errada.
 */
export function useCompanySettings(orgId: string | undefined): UseQueryResult<Record<string, unknown>> {
  return useQuery(async () => {
    if (!orgId) return { data: null, error: null }
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle()
    return { data, error: error ? new Error(error.message) : null }
  }, [orgId])
}

export function useLeaseHistory(): UseQueryResult<LeaseHistory[]> {
  const { profile } = useAuth()
  const orgId = profile?.org_id ?? null

  return useQuery(async () => {
    const { data, error } = await supabase
      .from('lease_history')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

/**
 * Vitrine pública de uma imobiliária.
 *
 * Não consulta a tabela properties: a listagem pública passa pela RPC
 * public_property_listings, que filtra por slug e só devolve status='disponivel'
 * da própria org. Ler a tabela direto exigiria uma policy para o anon, e
 * qualquer recorte errado ali expõe a vitrine de outra imobiliária.
 */
export function usePublicProperties(slug: string | null): UseQueryResult<Property[]> {
  return useQuery(
    async () => {
      if (!slug) return { data: [], error: null }
      const { data, error } = await supabase.rpc('public_property_listings', { p_slug: slug })
      return { data: (data as Property[]) ?? [], error: error ? new Error(error.message) : null }
    },
    [slug],
  )
}

export function usePublicProperty(
  slug: string | null,
  id: string | null,
): UseQueryResult<Property> {
  return useQuery(
    async () => {
      if (!slug || !id) return { data: null, error: null }
      const { data, error } = await supabase.rpc('public_property_detail', {
        p_slug: slug,
        p_property_id: id,
      })
      if (error) return { data: null, error: new Error(error.message) }
      const rows = (data as Property[]) ?? []
      return { data: rows[0] ?? null, error: null }
    },
    [slug, id],
  )
}

/** Identidade visual da imobiliária na vitrine: nome, logo e contato. */
export function useOrgBranding(slug: string | null): UseQueryResult<Organization> {
  return useQuery(
    async () => {
      if (!slug) return { data: null, error: null }
      const { data, error } = await supabase.rpc('public_org_branding', { p_slug: slug })
      if (error) return { data: null, error: new Error(error.message) }
      const rows = (data as Organization[]) ?? []
      return { data: rows[0] ?? null, error: null }
    },
    [slug],
  )
}

/**
 * Criação/edição/exclusão genéricas.
 *
 * org_id NÃO pode vir do `data` do chamador: o navegador é controlado pelo
 * usuário, e mandar org_id na mão deixaria escrever dentro de outra imobiliária.
 * A column é preenchida no servidor, pelo trigger set_org_id, e validada pela
 * policy WITH CHECK. As duas metades do mesmo controle.
 */
export function useCreateEntity(table: string) {  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = async (data: Record<string, unknown>) => {
    try {
      setLoading(true)
      setError(null)
      const { org_id: _orgId, ...resto } = data
      const payload = limparPayload(resto)
      const { data: result, error: err } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single()
      if (err) throw new Error(err.message)
      return { data: result, error: null }
    } catch (err) {
      const e = err as Error
      setError(e)
      return { data: null, error: e }
    } finally {
      setLoading(false)
    }
  }

  return { create, loading, error }
}

export function useUpdateEntity(table: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (id: string, data: Record<string, unknown>) => {
    try {
      setLoading(true)
      setError(null)
      // Um UPDATE com org_id no payload tentaria mover a linha para outra
      // imobiliária. O trigger set_org_id reescreve o valor de qualquer forma,
      // mas descartar aqui evita o round-trip e deixa a intenção explícita.
      const { org_id: _orgId, ...resto } = data
      const payload = limparPayload(resto)
      const { data: result, error: err } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (err) throw new Error(err.message)
      return { data: result, error: null }
    } catch (err) {
      const e = err as Error
      setError(e)
      return { data: null, error: e }
    } finally {
      setLoading(false)
    }
  }

  return { update, loading, error }
}

export function useDeleteEntity(table: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const { error: err } = await supabase.from(table).delete().eq('id', id)
      if (err) throw new Error(err.message)
      return { error: null }
    } catch (err) {
      const e = err as Error
      setError(e)
      return { error: e }
    } finally {
      setLoading(false)
    }
  }

  return { remove, loading, error }
}