/**
 * Utilitário de resolução de subdomínios e multi-tenancy por URL.
 *
 * Suporta:
 * 1. Produção: imobiliaria.domus.com.br -> slug = 'imobiliaria'
 * 2. Desenvolvimento local: imobiliaria.localhost:5173 -> slug = 'imobiliaria'
 *    (Chrome/Edge/Firefox resolvem *.localhost nativamente para 127.0.0.1)
 * 3. Domínios reservados: www, app, api, dev, admin, preview, staging
 */

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'dev',
  'admin',
  'portal',
  'staging',
  'preview',
  'mail',
  'smtp',
  'static',
  'cdn',
])

export interface SubdomainInfo {
  /** Se o acesso atual está usando um subdomínio de organização */
  isSubdomain: boolean
  /** O slug da organização se presente */
  slug: string | null
  /** Se é o domínio principal (ex: domus.com.br ou localhost) */
  isMainDomain: boolean
}

/**
 * Extrai o slug do subdomínio a partir do hostname.
 *
 * @param hostname Ex: 'aurora.domus.com.br', 'aurora.localhost', 'domus.com.br', 'localhost'
 */
export function extractSubdomain(hostname: string = window.location.hostname): string | null {
  if (!hostname) return null

  // Remove porta caso venha junto
  const cleanHost = hostname.split(':')[0].toLowerCase()

  // Se for endereço IP numérico direto (127.0.0.1, 192.168.x.x, etc.), não há subdomínio
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost)) {
    return null
  }

  const parts = cleanHost.split('.')

  // Caso 1: *.localhost (desenvolvimento local) -> parts = ['aurora', 'localhost']
  if (parts.length === 2 && parts[1] === 'localhost') {
    const sub = parts[0]
    return RESERVED_SUBDOMAINS.has(sub) ? null : sub
  }

  // Caso 2: localhost simples
  if (cleanHost === 'localhost') {
    return null
  }

  // Caso 3: Domínio de produção com terminação comum (ex: aurora.domus.com.br ou aurora.domusapp.com)
  // Se terminar em .com.br, .net.br, etc., a base tem 3 partes (ex: domus.com.br)
  const isBrazilianCompoundTld = cleanHost.endsWith('.com.br') || cleanHost.endsWith('.net.br') || cleanHost.endsWith('.org.br')

  const basePartsCount = isBrazilianCompoundTld ? 3 : 2

  if (parts.length > basePartsCount) {
    const sub = parts[0]
    if (RESERVED_SUBDOMAINS.has(sub)) {
      return null
    }
    // Validação básica do formato de slug da organização: a-z, 0-9 e hífen
    if (/^[a-z0-9-]{2,40}$/.test(sub)) {
      return sub
    }
  }

  return null
}

/**
 * Retorna informações completas do subdomínio para controle de roteamento.
 */
export function getSubdomainInfo(): SubdomainInfo {
  if (typeof window === 'undefined') {
    return { isSubdomain: false, slug: null, isMainDomain: true }
  }

  // Permite override em ambiente de desenvolvimento via query param: ?subdomain=aurora
  const searchParams = new URLSearchParams(window.location.search)
  const overrideSubdomain = searchParams.get('subdomain')

  const slug = overrideSubdomain || extractSubdomain(window.location.hostname)

  return {
    isSubdomain: Boolean(slug),
    slug,
    isMainDomain: !slug,
  }
}
