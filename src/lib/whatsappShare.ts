import type { Property } from '@/types'

const TYPE_NAMES: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  cobertura: 'Cobertura',
  studio: 'Kitnet / Studio',
  sobrado: 'Sobrado',
  comercial: 'Comercial',
  terreno: 'Terreno',
  sala: 'Sala Comercial',
  galpao: 'Galpão',
  loja: 'Loja',
  chacara: 'Chácara',
  sitio: 'Sítio',
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

/**
 * Gera mensagem rica e profissional pronta para compartilhamento no WhatsApp
 */
export function generatePropertyShareText(property: Partial<Property>, publicUrl: string, orgName?: string): string {
  const lines: string[] = []

  const title = property.title || 'Excelente Oportunidade Imobiliária'
  const typeName = property.type ? TYPE_NAMES[property.type] || property.type : 'Imóvel'
  
  lines.push(`🏡 *${title.toUpperCase()}*`)
  if (orgName) {
    lines.push(`🏢 _Imobiliária ${orgName}_`)
  }
  lines.push('')

  // Localização
  const locParts = [property.neighborhood, property.city, property.state].filter(Boolean)
  if (locParts.length > 0) {
    lines.push(`📍 *Localização:* ${locParts.join(', ')}`)
  }

  // Preço
  const hasRent = typeof property.rent_price === 'number' && property.rent_price > 0
  const hasSale = typeof property.sale_price === 'number' && property.sale_price > 0

  if (hasSale && hasRent) {
    lines.push(`💰 *Venda:* ${formatCurrency(property.sale_price!)}`)
    lines.push(`🔑 *Locação:* ${formatCurrency(property.rent_price!)}/mês`)
  } else if (hasSale) {
    lines.push(`💰 *Valor de Venda:* ${formatCurrency(property.sale_price!)}`)
  } else if (hasRent) {
    lines.push(`🔑 *Aluguel:* ${formatCurrency(property.rent_price!)}/mês`)
  }

  // Custos adicionais (se houver)
  const extras: string[] = []
  if (property.condo_fee && property.condo_fee > 0) extras.push(`Condomínio: ${formatCurrency(property.condo_fee)}`)
  if (property.iptu && property.iptu > 0) extras.push(`IPTU: ${formatCurrency(property.iptu)}/mês`)
  if (extras.length > 0) {
    lines.push(`📋 *Encargos:* ${extras.join(' | ')}`)
  }

  lines.push('')

  // Características
  const specs: string[] = []
  if (property.area && property.area > 0) specs.push(`📐 ${property.area}m²`)
  if (property.bedrooms && property.bedrooms > 0) specs.push(`🛏️ ${property.bedrooms} quarto${property.bedrooms > 1 ? 's' : ''}${property.suites ? ` (${property.suites} suíte${property.suites > 1 ? 's' : ''})` : ''}`)
  if (property.bathrooms && property.bathrooms > 0) specs.push(`🚿 ${property.bathrooms} banheiro${property.bathrooms > 1 ? 's' : ''}`)
  if (property.parking_spots && property.parking_spots > 0) specs.push(`🚗 ${property.parking_spots} vaga${property.parking_spots > 1 ? 's' : ''}`)

  if (specs.length > 0) {
    lines.push(`✨ *Características:*`)
    lines.push(specs.join(' • '))
  }

  // Breve descrição
  if (property.description) {
    const cleanDesc = property.description
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 180)
    if (cleanDesc) {
      lines.push('')
      lines.push(`📝 _"${cleanDesc}${property.description.length > 180 ? '...' : ''}"_`)
    }
  }

  // Link público
  lines.push('')
  lines.push(`📲 *Veja fotos e ficha completa aqui:*`)
  lines.push(publicUrl)

  return lines.join('\n')
}

/**
 * Abre o WhatsApp diretamente com a mensagem pré-carregada
 */
export function openWhatsAppShare(text: string, phone?: string) {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : ''
  const encodedText = encodeURIComponent(text)
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`
  window.open(url, '_blank')
}
