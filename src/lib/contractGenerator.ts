/**
 * Gerador de Minuta de Contrato de Locação Residencial e Comercial
 * Em conformidade com a Lei do Inquilinato (Lei nº 8.245/1991) e validade jurídica
 * de assinatura digital (MP nº 2.200-2/2001 e Lei nº 14.063/2020).
 */

import type { Lease, Property, Profile, Organization, LeaseSigner } from '@/types'
import { formatBRL } from '@/lib/repasse'

export interface ContractGeneratorParams {
  lease: Lease
  property: Property
  landlord: Profile
  tenant: Profile
  guarantor?: Profile | null
  organization?: Organization | null
  indexType?: string // 'IGP-M' | 'IPCA'
}

export interface GeneratedContract {
  title: string
  contractNumber: string
  generatedAt: string
  htmlContent: string
  plainText: string
  signers: LeaseSigner[]
}

/** Formata data dd/mm/aaaa a partir de ISO */
function formatarData(dataIso?: string | null): string {
  if (!dataIso) return '__/__/____'
  const [ano, mes, dia] = dataIso.split('T')[0].split('-')
  if (!ano || !mes || !dia) return dataIso
  return `${dia}/${mes}/${ano}`
}

/**
 * Gera a minuta completa e estruturada do contrato de locação.
 */
export function generateRentalContract({
  lease,
  property,
  landlord,
  tenant,
  guarantor,
  organization,
  indexType = 'IPCA',
}: ContractGeneratorParams): GeneratedContract {
  const contractNumber = `DOMUS-${lease.id.slice(0, 8).toUpperCase()}`
  const now = new Date()
  const dataHoje = now.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const valorAluguel = formatBRL(lease.monthly_rent || 0)
  const diaVencimento = lease.payment_day || 10
  const dataInicio = formatarData(lease.start_date)
  const dataFim = formatarData(lease.end_date)

  const orgNome = organization?.name || 'Imobiliária Administradora'
  const orgCnpj = organization?.cnpj ? `CNPJ nº ${organization.cnpj}` : ''

  const signers: LeaseSigner[] = [
    {
      name: landlord.full_name,
      email: landlord.email || '',
      cpf: landlord.cpf_cnpj_limpo,
      role: 'locador',
      status: 'pendente',
    },
    {
      name: tenant.full_name,
      email: tenant.email || '',
      cpf: tenant.cpf_cnpj_limpo,
      role: 'locatario',
      status: 'pendente',
    },
  ]

  if (guarantor) {
    signers.push({
      name: guarantor.full_name,
      email: guarantor.email || '',
      cpf: guarantor.cpf_cnpj_limpo,
      role: 'fiador',
      status: 'pendente',
    })
  }

  signers.push({
    name: orgNome,
    email: organization?.email || '',
    role: 'imobiliaria',
    status: 'pendente',
  })

  const plainText = `
INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO RESIDENCIAL
Contrato nº ${contractNumber}

1. DAS PARTES

LOCADOR(A): ${landlord.full_name}, inscrito(a) no CPF sob nº ${landlord.cpf_cnpj_limpo || 'Não informado'}, e-mail: ${landlord.email || 'Não informado'}.

LOCATÁRIO(A): ${tenant.full_name}, inscrito(a) no CPF sob nº ${tenant.cpf_cnpj_limpo || 'Não informado'}, e-mail: ${tenant.email || 'Não informado'}.

${guarantor ? `FIADOR(A): ${guarantor.full_name}, inscrito(a) no CPF sob nº ${guarantor.cpf_cnpj_limpo || 'Não informado'}.\n` : ''}
ADMINISTRADORA: ${orgNome}, ${orgCnpj}.

2. DO IMÓVEL OBJETO DA LOCAÇÃO
Imóvel situado em: ${property.address}${property.address_number ? `, nº ${property.address_number}` : ''}, ${property.neighborhood}, ${property.city} - ${property.state}, CEP: ${property.zip_code}.

3. DO PRAZO
O prazo da presente locação terá início em ${dataInicio} e término em ${dataFim}.

4. DO ALUGUEL E ENCARGOS
O aluguel mensal é de ${valorAluguel}, com vencimento todo dia ${diaVencimento} de cada mês.
O reajuste será anual com base no índice ${indexType}.

5. DA VISTORIA
O LOCATÁRIO declara receber o imóvel nas condições descritas no Termo de Vistoria de Entrada, que integra este instrumento.

6. DA RESCISÃO E MULTA
Em caso de rescisão antecipada, será aplicada multa proporcional de 3 (três) aluguéis vigentes, conforme o Art. 4º da Lei nº 8.245/1991.

7. DA VALIDADE DA ASSINATURA ELETRÔNICA
As partes reconhecem expressamente a veracidade, autenticidade e validade jurídica deste documento assinado por meio eletrônico, nos termos da MP nº 2.200-2/2001 e da Lei nº 14.063/2020.

${property.city} - ${property.state}, ${dataHoje}.
`.trim()

  const htmlContent = `
<div class="contract-document font-sans text-gray-800 leading-relaxed max-w-3xl mx-auto p-8 bg-white shadow-sm border border-gray-200 rounded-sm">
  <div class="text-center border-b pb-4 mb-6">
    <h1 class="text-2xl font-serif font-bold text-gray-900 tracking-tight">INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO</h1>
    <p class="text-sm text-gray-500 mt-1">Identificador: <span class="font-mono font-medium">${contractNumber}</span></p>
  </div>

  <section class="mb-6">
    <h2 class="text-lg font-serif font-semibold text-gray-900 border-b pb-1 mb-2">1. DAS PARTES CONTRATANTES</h2>
    <p class="text-sm mb-2"><strong>LOCADOR(A):</strong> ${landlord.full_name}, inscrito(a) no CPF/CNPJ sob o nº <strong>${landlord.cpf_cnpj_limpo || 'Não informado'}</strong>, endereço eletrônico: ${landlord.email || 'Não informado'}.</p>
    <p class="text-sm mb-2"><strong>LOCATÁRIO(A):</strong> ${tenant.full_name}, inscrito(a) no CPF/CNPJ sob o nº <strong>${tenant.cpf_cnpj_limpo || 'Não informado'}</strong>, endereço eletrônico: ${tenant.email || 'Não informado'}.</p>
    ${guarantor ? `<p class="text-sm mb-2"><strong>FIADOR(A):</strong> ${guarantor.full_name}, CPF nº ${guarantor.cpf_cnpj_limpo || 'Não informado'}.</p>` : ''}
    <p class="text-sm"><strong>INTERMEDIADORA:</strong> ${orgNome}, ${orgCnpj}.</p>
  </section>

  <section class="mb-6">
    <h2 class="text-lg font-serif font-semibold text-gray-900 border-b pb-1 mb-2">2. DO IMÓVEL</h2>
    <p class="text-sm">O objeto da locação é o imóvel situado em: <strong>${property.address}${property.address_number ? `, nº ${property.address_number}` : ''}, ${property.neighborhood}, ${property.city}/${property.state}</strong> - CEP ${property.zip_code}. Destinação: Residencial.</p>
  </section>

  <section class="mb-6">
    <h2 class="text-lg font-serif font-semibold text-gray-900 border-b pb-1 mb-2">3. DO PRAZO DE VIGÊNCIA</h2>
    <p class="text-sm">O prazo da locação é estabelecido de <strong>${dataInicio}</strong> a <strong>${dataFim}</strong>, data em que o LOCATÁRIO se obriga a restituir o imóvel completamente desocupado e nas condições da vistoria inicial.</p>
  </section>

  <section class="mb-6">
    <h2 class="text-lg font-serif font-semibold text-gray-900 border-b pb-1 mb-2">4. DO ALUGUEL, REAJUSTE E ENCARGOS</h2>
    <p class="text-sm mb-2">O valor mensal do aluguel é de <strong>${valorAluguel}</strong>, a ser pago pontualmente até o dia <strong>${diaVencimento}</strong> de cada mês subsequente ao vencido.</p>
    <p class="text-sm">O valor do aluguel será reajustado anualmente pela variação acumulada do índice <strong>${indexType}</strong> ou outro que vier legalmente a substituí-lo.</p>
  </section>

  <section class="mb-6">
    <h2 class="text-lg font-serif font-semibold text-gray-900 border-b pb-1 mb-2">5. DO LAUDO DE VISTORIA</h2>
    <p class="text-sm">O LOCATÁRIO declara ter recebido e inspecionado o imóvel, concordando integralmente com o <strong>Termo de Vistoria Fotográfica</strong> anexo a este instrumento.</p>
  </section>

  <section class="mb-6">
    <h2 class="text-lg font-serif font-semibold text-gray-900 border-b pb-1 mb-2">6. DA RESCISÃO E MULTA</h2>
    <p class="text-sm">A infração a qualquer das cláusulas sujeitará o infrator à multa pecuniária equivalente a 3 (três) aluguéis em vigor à época da infração, cobrada proporcionalmente ao tempo restante de contrato conforme Artigo 4º da Lei nº 8.245/1991.</p>
  </section>

  <section class="mb-6">
    <h2 class="text-lg font-serif font-semibold text-gray-900 border-b pb-1 mb-2">7. DA ASSINATURA ELETRÔNICA</h2>
    <p class="text-sm">As partes declaram e anuem que as assinaturas constantes deste instrumento serão efetuadas em formato digital/eletrônico, reconhecendo sua plena eficácia, validade jurídica e força executiva nos termos da MP 2.200-2/2001 e Lei 14.063/2020.</p>
  </section>

  <div class="mt-8 pt-4 border-t text-sm text-gray-600">
    <p>${property.city} - ${property.state}, ${dataHoje}.</p>
  </div>
</div>
  `.trim()

  return {
    title: `Contrato de Locação - ${property.title || property.address}`,
    contractNumber,
    generatedAt: now.toISOString(),
    htmlContent,
    plainText,
    signers,
  }
}
