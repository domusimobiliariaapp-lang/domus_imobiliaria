/**
 * Utilitário para exportação de dados para Excel/CSV no padrão brasileiro (pt-BR)
 * Utiliza delimitador ';' e BOM UTF-8 (\uFEFF) para compatibilidade perfeita no Microsoft Excel.
 */

export interface CsvColumn<T> {
  header: string
  accessor: (item: T) => string | number | boolean | null | undefined
}

export function exportToCsv<T>({
  filename,
  columns,
  data,
}: {
  filename: string
  columns: CsvColumn<T>[]
  data: T[]
}) {
  if (!data || data.length === 0) {
    alert('Nenhum dado disponível para exportação.')
    return
  }

  // Cabeçalhos
  const headerRow = columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(';')

  // Linhas de dados
  const rows = data.map(item => {
    return columns
      .map(col => {
        const val = col.accessor(item)
        if (val === null || val === undefined) return '""'
        if (typeof val === 'boolean') return val ? '"Sim"' : '"Não"'
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      })
      .join(';')
  })

  // Montagem com BOM UTF-8
  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exportador rápido de Imóveis para CSV/Excel
 */
export function exportPropertiesCsv(properties: any[], orgName = 'domus') {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToCsv({
    filename: `imoveis_${orgName}_${dateStr}.csv`,
    columns: [
      { header: 'Código / Ref', accessor: (p) => p.reference_code || p.id?.slice(0, 8) },
      { header: 'Título', accessor: (p) => p.title },
      { header: 'Tipo', accessor: (p) => p.type },
      { header: 'Status', accessor: (p) => p.status },
      { header: 'Finalidade', accessor: (p) => p.purpose || 'ambos' },
      { header: 'Aluguel (R$)', accessor: (p) => p.rent_price ? Number(p.rent_price).toFixed(2).replace('.', ',') : '0,00' },
      { header: 'Venda (R$)', accessor: (p) => p.sale_price ? Number(p.sale_price).toFixed(2).replace('.', ',') : '0,00' },
      { header: 'Condomínio (R$)', accessor: (p) => p.condo_fee ? Number(p.condo_fee).toFixed(2).replace('.', ',') : '0,00' },
      { header: 'IPTU (R$)', accessor: (p) => p.iptu ? Number(p.iptu).toFixed(2).replace('.', ',') : '0,00' },
      { header: 'Área (m²)', accessor: (p) => p.area || p.area_util || '' },
      { header: 'Quartos', accessor: (p) => p.bedrooms || 0 },
      { header: 'Suítes', accessor: (p) => p.suites || 0 },
      { header: 'Banheiros', accessor: (p) => p.bathrooms || 0 },
      { header: 'Vagas', accessor: (p) => p.parking_spots || 0 },
      { header: 'Endereço', accessor: (p) => p.address },
      { header: 'Número', accessor: (p) => p.address_number },
      { header: 'Bairro', accessor: (p) => p.neighborhood },
      { header: 'Cidade', accessor: (p) => p.city },
      { header: 'Estado', accessor: (p) => p.state },
      { header: 'CEP', accessor: (p) => p.zip_code },
      { header: 'Data de Cadastro', accessor: (p) => p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '' },
    ],
    data: properties,
  })
}

/**
 * Exportador rápido de Clientes para CSV/Excel
 */
export function exportClientsCsv(clients: any[], orgName = 'domus') {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToCsv({
    filename: `clientes_${orgName}_${dateStr}.csv`,
    columns: [
      { header: 'Nome Completo', accessor: (c) => c.name || c.full_name },
      { header: 'Tipo', accessor: (c) => c.client_type || 'cliente' },
      { header: 'CPF / CNPJ', accessor: (c) => c.document_number || c.cpf || c.cnpj || '' },
      { header: 'E-mail', accessor: (c) => c.email || '' },
      { header: 'Telefone / WhatsApp', accessor: (c) => c.phone || c.whatsapp || '' },
      { header: 'Cidade', accessor: (c) => c.city || '' },
      { header: 'Estado', accessor: (c) => c.state || '' },
      { header: 'Data de Cadastro', accessor: (c) => c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '' },
    ],
    data: clients,
  })
}

/**
 * Exportador rápido de Contratos para CSV/Excel
 */
export function exportContractsCsv(contracts: any[], orgName = 'domus') {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportToCsv({
    filename: `contratos_${orgName}_${dateStr}.csv`,
    columns: [
      { header: 'Contrato ID', accessor: (c) => c.id?.slice(0, 8) },
      { header: 'Tipo', accessor: (c) => c.type || 'locacao' },
      { header: 'Status', accessor: (c) => c.status || 'ativo' },
      { header: 'Início', accessor: (c) => c.start_date ? new Date(c.start_date).toLocaleDateString('pt-BR') : '' },
      { header: 'Término', accessor: (c) => c.end_date ? new Date(c.end_date).toLocaleDateString('pt-BR') : '' },
      { header: 'Valor Mensal (R$)', accessor: (c) => c.monthly_rent ? Number(c.monthly_rent).toFixed(2).replace('.', ',') : '0,00' },
      { header: 'Taxa Adm (%)', accessor: (c) => c.adm_fee_percent ? `${c.adm_fee_percent}%` : '' },
      { header: 'Modelo Repasse', accessor: (c) => c.repasse_modelo || 'via_imobiliaria' },
    ],
    data: contracts,
  })
}
