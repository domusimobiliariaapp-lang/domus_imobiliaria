/**
 * Configurações da Licença Vitalícia (Sem Mensalidade / Pagamento Único)
 * Gerenciado pelo painel DEV e consumido na Landing Page e no PricingTable.
 */

import { supabase } from '@/integrations/supabase/client'

export interface LifetimeSettings {
  active: boolean
  price_cash: number
  price_installments: number
  annual_maintenance: number
  spots_total: number
  spots_taken: number
  badge: string
  headline: string
  description: string
}

export const DEFAULT_LIFETIME_SETTINGS: LifetimeSettings = {
  active: true,
  price_cash: 4500,
  price_installments: 375,
  annual_maintenance: 490,
  spots_total: 15,
  spots_taken: 9,
  badge: 'Lote Fundador • Vagas Limitadas',
  headline: 'Licença Vitalícia Definitiva',
  description: 'Adquira a plataforma completa em pagamento único. Sem mensalidade obrigatória para sempre.',
}

const STORAGE_KEY = 'domus_lifetime_settings'

/**
 * Obtém as configurações vigentes da licença vitalícia (do Supabase ou localStorage fallback)
 */
export async function getLifetimeSettings(): Promise<LifetimeSettings> {
  // 1. Tenta carregar do Supabase (tabela saas_plans onde id = 'lifetime')
  try {
    const { data, error } = await supabase
      .from('saas_plans')
      .select('*')
      .eq('id', 'lifetime')
      .single()

    if (!error && data) {
      const features = (data.features as Record<string, any>) || {}
      return {
        active: data.active ?? true,
        price_cash: Number(data.price_monthly) || DEFAULT_LIFETIME_SETTINGS.price_cash,
        price_installments: Number(data.price_annual_monthly) || DEFAULT_LIFETIME_SETTINGS.price_installments,
        annual_maintenance: features.annual_maintenance ?? DEFAULT_LIFETIME_SETTINGS.annual_maintenance,
        spots_total: features.spots_total ?? DEFAULT_LIFETIME_SETTINGS.spots_total,
        spots_taken: features.spots_taken ?? DEFAULT_LIFETIME_SETTINGS.spots_taken,
        badge: data.badge || DEFAULT_LIFETIME_SETTINGS.badge,
        headline: data.name || DEFAULT_LIFETIME_SETTINGS.headline,
        description: data.description || DEFAULT_LIFETIME_SETTINGS.description,
      }
    }
  } catch {
    // Falha silenciosa caso saas_plans ainda não tenha a linha 'lifetime'
  }

  // 2. Fallback para localStorage
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEY)
    if (local) {
      try {
        return { ...DEFAULT_LIFETIME_SETTINGS, ...JSON.parse(local) }
      } catch {
        // parsing error
      }
    }
  }

  return DEFAULT_LIFETIME_SETTINGS
}

/**
 * Salva as configurações da licença vitalícia no Supabase e no localStorage
 */
export async function saveLifetimeSettings(
  settings: Partial<LifetimeSettings>,
): Promise<LifetimeSettings> {
  const current = await getLifetimeSettings()
  const updated: LifetimeSettings = { ...current, ...settings }

  // 1. Salva no localStorage para disponibilidade instantânea
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // 2. Persiste no Supabase caso a tabela saas_plans exista
  try {
    await supabase
      .from('saas_plans')
      .upsert({
        id: 'lifetime',
        name: updated.headline,
        description: updated.description,
        price_monthly: updated.price_cash,
        price_annual_monthly: updated.price_installments,
        max_properties: null,
        max_users: null,
        features: {
          subdomain: true,
          portal: true,
          crm: true,
          vistorias: true,
          custom_domain: true,
          annual_maintenance: updated.annual_maintenance,
          spots_total: updated.spots_total,
          spots_taken: updated.spots_taken,
        },
        popular: true,
        badge: updated.badge,
        active: updated.active,
        updated_at: new Date().toISOString(),
      })
  } catch (err) {
    console.warn('Aviso ao sincronizar plano vitalício no Supabase:', err)
  }

  return updated
}
