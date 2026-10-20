export const onlyDigits = (value: string) => value.replace(/\D/g, '')

export function formatCpfCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14)
  if (digits.length <= 11) {
    return digits.replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
  }
  return formatCnpj(digits)
}

export function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14)
  return digits.replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5')
}

export function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8)
  return digits.replace(/^(\d{5})(\d)/, '$1-$2').replace(/^(\d{5})-(\d{3})(\d)/, '$1-$2$3')
}

export function formatBrazilianPhone(value: string) {
  let digits = onlyDigits(value)
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2)
  digits = digits.slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  const local = digits.slice(2)
  const prefixLength = local.length > 8 ? 5 : 4
  const prefix = local.slice(0, prefixLength)
  const suffix = local.slice(prefixLength)
  return `(${digits.slice(0, 2)}) ${prefix}${suffix ? `-${suffix}` : ''}`
}

export function toBrazilianE164(value: string) {
  const digits = onlyDigits(value)
  return digits.length > 11 && digits.startsWith('55') ? digits : `55${digits}`
}

/**
 * Máscara de valor em Real para digitação.
 *
 * O campo guarda texto, não número: um input type="number" com valor formatado
 * não funciona — o navegador recusa "1.234,56" e o valor some enquanto se digita.
 * Esta formatação é para o que o usuário VÊ; parseCurrencyInput é o que volta
 * para o banco.
 *
 * Digitar "12345,6" mostra "12.345,60" na hora. O centavo é opcional porque
 * ninguém digita vírgula para escrever mil e duzentos.
 */
export function formatCurrencyInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  // Aceita número (vem do banco) e texto já com pontuação, para não duplicar
  // separador quando o estado é repovoado.
  const bruto = typeof value === 'number' ? String(value) : value
  const limpo = bruto.replace(/[^\d,.]/g, '')
  if (!limpo) return ''

  // O último separador é o decimal: em "1.234,56" a vírgula é decimal e em
  // "1234.56" é o ponto. Sem esta regra, "1.234" viraria mil e duzentos e
  // trinta e quatro.
  //
  // A exceção é o milhar colado: "1.234" com exatamente 3 dígitos depois do
  // ponto é mil duzentos e trinta e quatro, não "1,23". Sem este teste,
  // colar um valor já formatado de outra tela truncava o número — 1.234 viraria
  // 1,23, vinte vezes menor. No padrão do Brasil (ponto só como milhar), ter
  // mais de um ponto, ou um ponto seguido de exatamente 3 dígitos e nenhuma
  // vírgula, significa que o ponto é separador de milhar.
  const ultimoVirgula = limpo.lastIndexOf(',')
  const ultimoPonto = limpo.lastIndexOf('.')
  const temVirgula = ultimoVirgula >= 0
  const pontos = (limpo.match(/\./g) || []).length
  const pontoEhMilhar =
    pontos > 1 || (!temVirgula && /^\d{1,3}(\.\d{3})+$/.test(limpo))
  const decimalPos = temVirgula
    ? ultimoVirgula
    : pontoEhMilhar
      ? -1
      : ultimoPonto

  let inteiro: string
  let decimal: string
  if (decimalPos >= 0) {
    inteiro = limpo.slice(0, decimalPos).replace(/[.,]/g, '') || '0'
    decimal = limpo.slice(decimalPos + 1).replace(/\D/g, '').slice(0, 2)
  } else {
    inteiro = limpo.replace(/[.,]/g, '') || '0'
    decimal = ''
  }

  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimal ? `${comMilhar},${decimal}` : comMilhar
}

/** O inverso de formatCurrencyInput: o que o usuário viu vira número do banco. */
export function parseCurrencyInput(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value
  const limpo = value.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')
  const numero = parseFloat(limpo)
  return Number.isFinite(numero) ? numero : 0
}

/** Remove tudo que não é dígito — para campos numéricos sem separador. */
export function onlyNumbers(value: string): string {
  return value.replace(/[^\d]/g, '')
}

/** Área em m²: até 2 casas, vírgula como decimal. */
export function formatDecimal(value: string | number | null | undefined, maxDecimals = 2): string {
  if (value === null || value === undefined || value === '') return ''
  const bruto = typeof value === 'number' ? String(value) : value
  const limpo = bruto.replace(/[^\d,.]/g, '')
  if (!limpo) return ''
  const decimalPos = Math.max(limpo.lastIndexOf(','), limpo.lastIndexOf('.'))
  if (decimalPos < 0) return limpo
  const inteiro = limpo.slice(0, decimalPos).replace(/[.,]/g, '') || '0'
  const decimal = limpo.slice(decimalPos + 1).replace(/\D/g, '').slice(0, maxDecimals)
  return decimal ? `${inteiro},${decimal}` : inteiro
}

export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value
  const numero = parseFloat(value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(numero) ? numero : 0
}

/** Documento do cliente: mesmo campo aceita CPF (11) ou CNPJ (14). */
export function formatDocumento(value: string): string {
  const digits = onlyDigits(value)
  return digits.length > 11 ? formatCnpj(digits) : formatCpfCnpj(digits)
}

/** Data em dd/mm/aaaa, a partir do valor ISO que o Postgres devolve. */
export function formatDateBR(value: string | null | undefined): string {
  if (!value) return ''
  const iso = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return value
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
