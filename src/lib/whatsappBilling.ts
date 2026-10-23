/**
 * Utilitário de Envio de Cobrança e Repasse via WhatsApp com 1 Clique (Grátis / Custo Zero)
 * Abre o WhatsApp Web ou o app oficial já com número e mensagem formatados.
 */

export interface WhatsAppBillingPayload {
  recipientName: string
  recipientPhone?: string | null
  amount: number
  dueDate?: string | null
  propertyTitle?: string | null
  pixKey?: string | null
  agencyName?: string | null
}

export interface WhatsAppRepassePayload {
  ownerName: string
  ownerPhone?: string | null
  netAmount: number
  grossAmount?: number
  adminFee?: number
  periodMonth?: string | null
  propertyTitle?: string | null
  agencyName?: string | null
}

/**
 * Normaliza o número de telefone para o padrão internacional do WhatsApp (ex: 5511999998888)
 */
export function formatWhatsAppPhone(phone?: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  // Se não começa com 55 (DDI Brasil) e tem 10 ou 11 dígitos, adiciona 55
  if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
    return `55${digits}`
  }
  return digits
}

/**
 * Formata moeda BRL
 */
function formatMoeda(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

/**
 * Formata data ISO para dd/mm/aaaa
 */
function formatData(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-')
    if (year && month && day) return `${day}/${month}/${year}`
  } catch {
    // fallback
  }
  return dateStr
}

/**
 * Gera a URL do WhatsApp para envio de cobrança ao inquilino
 */
export function getWhatsAppBillingUrl(payload: WhatsAppBillingPayload): string {
  const phone = formatWhatsAppPhone(payload.recipientPhone)
  const agency = payload.agencyName || 'Imobiliária'
  const venc = payload.dueDate ? formatData(payload.dueDate) : 'a vencer'
  const valor = formatMoeda(payload.amount)

  let text = `Olá, *${payload.recipientName}*!\n\n`
  text += `Aqui é da equipe de locação da *${agency}*.\n`
  text += `Informamos o aviso de cobrança do seu aluguel`
  if (payload.propertyTitle) {
    text += ` referente ao imóvel: _${payload.propertyTitle}_`
  }
  text += `.\n\n`
  text += `📅 *Vencimento:* ${venc}\n`
  text += `💰 *Valor:* ${valor}\n`

  if (payload.pixKey) {
    text += `\n🔑 *Chave PIX para pagamento:*\n\`${payload.pixKey}\`\n`
  }

  text += `\nApós realizar o pagamento, você pode nos enviar o comprovante por aqui. Qualquer dúvida estamos à disposição!`

  const encoded = encodeURIComponent(text)
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`
}

/**
 * Gera a URL do WhatsApp para envio de extrato de repasse ao proprietário
 */
export function getWhatsAppRepasseUrl(payload: WhatsAppRepassePayload): string {
  const phone = formatWhatsAppPhone(payload.ownerPhone)
  const agency = payload.agencyName || 'Imobiliária'
  const valorLiquido = formatMoeda(payload.netAmount)

  let text = `Olá, *${payload.ownerName}*!\n\n`
  text += `Aqui é da *${agency}*. Informamos que o repasse de locação`
  if (payload.propertyTitle) {
    text += ` referente ao imóvel _${payload.propertyTitle}_`
  }
  if (payload.periodMonth) {
    text += ` (competência ${payload.periodMonth})`
  }
  text += ` foi apurado com sucesso:\n\n`

  if (payload.grossAmount) {
    text += `💵 *Aluguel recebido:* ${formatMoeda(payload.grossAmount)}\n`
  }
  if (payload.adminFee) {
    text += `🏷️ *Taxa de administração:* -${formatMoeda(payload.adminFee)}\n`
  }
  text += `✨ *Valor Líquido do Repasse:* *${valorLiquido}*\n\n`
  text += `O comprovante detalhado já está disponível no seu Portal do Proprietário. Ficamos à disposição!`

  const encoded = encodeURIComponent(text)
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`
}
