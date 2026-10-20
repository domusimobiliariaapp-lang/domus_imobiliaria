/**
 * Checklist e Relatório de Vistoria Fotográfica Digital
 *
 * Módulo para configuração de cômodos, itens inspecionados e geração
 * do laudo de vistoria de entrada e saída.
 */

import type { InspectionItem, PropertyInspection, Property } from '@/types'

export interface RoomPreset {
  room: string
  items: string[]
}

export const DEFAULT_INSPECTION_PRESETS: RoomPreset[] = [
  {
    room: 'Sala de Estar / Jantar',
    items: ['Paredes e Pintura', 'Piso e Rodapés', 'Janelas e Vidros', 'Interruptores e Tomadas', 'Porta de Entrada e Fechadura'],
  },
  {
    room: 'Cozinha',
    items: ['Bancada e Pia', 'Torneira e Encanamento', 'Azulejos e Revestimento', 'Armários Embutidos', 'Tomadas e Pontos de Força'],
  },
  {
    room: 'Dormitório Principal',
    items: ['Paredes e Pintura', 'Piso e Rodapés', 'Porta e Maçaneta', 'Janela e Veneziana', 'Armário Embutido'],
  },
  {
    room: 'Banheiro Social',
    items: ['Vaso Sanitário e Descarga', 'Cuba e Torneira', 'Box de Vidro / Cortina', 'Chuveiro Elétrico / Ducha', 'Ralo e Escoamento'],
  },
  {
    room: 'Área de Serviço / Lavanderia',
    items: ['Tanque e Torneira', 'Ponto para Máquina de Lavar', 'Janela e Ventilação', 'Piso e Ralo'],
  },
  {
    room: 'Varanda / Sacada',
    items: ['Guarda-corpo / Grade', 'Piso', 'Luminárias', 'Ralo'],
  },
]

export interface InspectionSummary {
  totalItems: number
  totalPhotos: number
  itemsWithDamage: number
  conditionsCount: Record<'novo' | 'bom' | 'regular' | 'com_avarias', number>
  hasApprovedByTenant: boolean
}

/**
 * Compila estatísticas resumidas de uma vistoria.
 */
export function summarizeInspection(
  inspection: PropertyInspection,
  items: InspectionItem[],
): InspectionSummary {
  const conditionsCount = {
    novo: 0,
    bom: 0,
    regular: 0,
    com_avarias: 0,
  }

  let totalPhotos = 0
  let itemsWithDamage = 0

  for (const item of items) {
    if (conditionsCount[item.condition] !== undefined) {
      conditionsCount[item.condition]++
    }
    if (item.condition === 'com_avarias') {
      itemsWithDamage++
    }
    totalPhotos += (item.photos || []).length
  }

  return {
    totalItems: items.length,
    totalPhotos,
    itemsWithDamage,
    conditionsCount,
    hasApprovedByTenant: inspection.status === 'aprovada' && Boolean(inspection.tenant_approved_at),
  }
}

/**
 * Formata texto do laudo de vistoria para impressão ou visualização.
 */
export function generateInspectionReportText(
  inspection: PropertyInspection,
  property: Property,
  items: InspectionItem[],
): string {
  const summary = summarizeInspection(inspection, items)
  const data = new Date(inspection.inspection_date).toLocaleDateString('pt-BR')

  const itemsPorComodo = items.reduce<Record<string, InspectionItem[]>>((acc, item) => {
    if (!acc[item.room]) acc[item.room] = []
    acc[item.room].push(item)
    return acc
  }, {})

  let texto = `LAUDO DE VISTORIA ${inspection.type.toUpperCase()}\n`
  texto += `Imóvel: ${property.title || property.address} - ${property.city}/${property.state}\n`
  texto += `Data da Vistoria: ${data}\n`
  texto += `Status: ${inspection.status.toUpperCase()}\n`
  texto += `Resumo: ${summary.totalItems} itens vistoriados, ${summary.totalPhotos} fotos registradas, ${summary.itemsWithDamage} avarias identificadas.\n\n`

  for (const [comodo, lista] of Object.entries(itemsPorComodo)) {
    texto += `[${comodo}]\n`
    for (const item of lista) {
      texto += `  - ${item.item_name}: ${item.condition.toUpperCase()}${item.notes ? ` (${item.notes})` : ''} [${(item.photos || []).length} fotos]\n`
    }
    texto += '\n'
  }

  if (inspection.tenant_comments) {
    texto += `Manifestação do Inquilino:\n"${inspection.tenant_comments}"\n\n`
  }

  return texto
}
