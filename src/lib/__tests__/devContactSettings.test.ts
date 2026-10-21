import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_DEV_CONTACT_SETTINGS,
  getDevContactSettings,
  saveDevContactSettings,
  getDevWhatsAppUrl,
} from '../devContactSettings'

describe('devContactSettings', () => {
  let store: Record<string, string> = {}

  beforeEach(() => {
    store = {}
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
    }

    vi.stubGlobal('localStorage', mockLocalStorage)
    vi.stubGlobal('window', {
      localStorage: mockLocalStorage,
      dispatchEvent: vi.fn(),
    })
  })

  it('retorna os valores padrões quando nada estiver salvo', () => {
    const settings = getDevContactSettings()
    expect(settings.whatsapp).toBe(DEFAULT_DEV_CONTACT_SETTINGS.whatsapp)
    expect(settings.email).toBe(DEFAULT_DEV_CONTACT_SETTINGS.email)
  })

  it('salva e recupera novos dados de contato', () => {
    const updated = saveDevContactSettings({
      whatsapp: '11988887777',
      email: 'comercial@meusistemas.com.br',
    })

    expect(updated.whatsapp).toBe('11988887777')
    expect(updated.email).toBe('comercial@meusistemas.com.br')

    const current = getDevContactSettings()
    expect(current.whatsapp).toBe('11988887777')
  })

  it('gera url do WhatsApp com código do país 55 e mensagem codificada', () => {
    saveDevContactSettings({ whatsapp: '11977776666' })
    const url = getDevWhatsAppUrl('Olá, quero saber mais sobre o sistema!')

    expect(url).toBe('https://wa.me/5511977776666?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20sistema!')
  })

  it('evita duplicar o código 55 caso o número já venha com 55', () => {
    saveDevContactSettings({ whatsapp: '5511977776666' })
    const url = getDevWhatsAppUrl()

    expect(url).toBe('https://wa.me/5511977776666')
  })
})
