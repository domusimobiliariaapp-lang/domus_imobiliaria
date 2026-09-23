import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { DashboardStats, Property, Lease, Sale, Payment, Notification, Document, Profile, Client, LeaseHistory } from '@/types'

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
    } catch (err) {
      setError(err as Error)
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

export function useDashboardStats(): UseQueryResult<DashboardStats> {
  return useQuery(async () => {
    const [properties, leases, sales, payments] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('leases').select('*'),
      supabase.from('sales').select('*'),
      supabase.from('payments').select('*'),
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
  return useQuery(async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
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
  return useQuery(async () => {
    const { data, error } = await supabase
      .from('leases')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function useSales(): UseQueryResult<Sale[]> {
  return useQuery(async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function usePayments(): UseQueryResult<Payment[]> {
  return useQuery(async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
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
  return useQuery(async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function useProfiles(): UseQueryResult<Profile[]> {
  return useQuery(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function useClients(): UseQueryResult<Client[]> {
  return useQuery(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function useLeaseHistory(): UseQueryResult<LeaseHistory[]> {
  return useQuery(async () => {
    const { data, error } = await supabase
      .from('lease_history')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error: error ? new Error(error.message) : null }
  })
}

export function useCreateEntity(table: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = async (data: Record<string, unknown>) => {
    try {
      setLoading(true)
      setError(null)
      const { data: result, error: err } = await supabase
        .from(table)
        .insert(data)
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
      const { data: result, error: err } = await supabase
        .from(table)
        .update(data)
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