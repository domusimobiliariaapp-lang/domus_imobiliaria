/**
 * Gerenciamento centralizado dos dados de contato e suporte do desenvolvedor/proprietário do SaaS.
 * Usado em botões de WhatsApp de vendas, checkout, suporte e implantação assistida.
 */

export interface DevContactSettings {
  whatsapp: string
  email: string
  phone: string
  company_name: string
  support_hours: string
}

export const DEFAULT_DEV_CONTACT_SETTINGS: DevContactSettings = {
  whatsapp: '11999999999',
  email: 'contato@gestaodomus.com.br',
  phone: '(11) 3000-0000',
  company_name: 'Domus Tecnologia & Sistemas',
  support_hours: 'Segunda a Sexta, das 09h às 18h',
}

const STORAGE_KEY = 'domus_dev_contact_settings'

/**
 * Obtém os dados de contato do DEV/SaaS configurados
 */
export function getDevContactSettings(): DevContactSettings {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEY)
    if (local) {
      try {
        const parsed = JSON.parse(local)
        return { ...DEFAULT_DEV_CONTACT_SETTINGS, ...parsed }
      } catch {
        // fallback
      }
    }
  }
  return DEFAULT_DEV_CONTACT_SETTINGS
}

/**
 * Salva as configurações de contato do DEV/SaaS
 */
export function saveDevContactSettings(settings: Partial<DevContactSettings>): DevContactSettings {
  const current = getDevContactSettings()
  const updated = { ...current, ...settings }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('domus:dev-contact-updated', { detail: updated }))
  }
  return updated
}

/**
 * Gera URL do WhatsApp formatada com o número oficial do DEV
 */
export function getDevWhatsAppUrl(message?: string): string {
  const settings = getDevContactSettings()
  const cleanNumber = (settings.whatsapp || '11999999999').replace(/\D/g, '')
  const countryCode = cleanNumber.startsWith('55') ? '' : '55'
  const fullNumber = `${countryCode}${cleanNumber}`

  if (message) {
    return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`
  }
  return `https://wa.me/${fullNumber}`
}
