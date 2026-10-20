import { describe, it, expect } from 'vitest'
import { summarizeInspection, generateInspectionReportText } from '../inspectionReport'
import type { PropertyInspection, InspectionItem, Property } from '@/types'

describe('inspectionReport.ts', () => {
  const mockProperty: Property = {
    id: 'p1',
    title: 'Casa Alphaville',
    type: 'casa',
    status: 'alugado',
    address: 'Alameda das Flores, 120',
    neighborhood: 'Alphaville',
    city: 'Barueri',
    state: 'SP',
    zip_code: '06400-000',
    area_m2: 240,
    rent_price: 8000,
    sale_price: 1800000,
    description: 'Casa ampla',
    images: [],
    features: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockInspection: PropertyInspection = {
    id: 'insp-1',
    property_id: 'p1',
    type: 'entrada',
    status: 'aprovada',
    inspection_date: '2026-06-01',
    tenant_approved_at: '2026-06-02T14:30:00Z',
    created_at: new Date().toISOString(),
  }

  const mockItems: InspectionItem[] = [
    {
      id: 'it1',
      inspection_id: 'insp-1',
      room: 'Sala de Estar',
      item_name: 'Paredes e Pintura',
      condition: 'novo',
      photos: ['https://r2.domus.com/p1.jpg', 'https://r2.domus.com/p2.jpg'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'it2',
      inspection_id: 'insp-1',
      room: 'Sala de Estar',
      item_name: 'Janelas e Vidros',
      condition: 'bom',
      photos: ['https://r2.domus.com/p3.jpg'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'it3',
      inspection_id: 'insp-1',
      room: 'Cozinha',
      item_name: 'Torneira e Encanamento',
      condition: 'com_avarias',
      notes: 'Pequeno gotejamento na conexão flexível',
      photos: ['https://r2.domus.com/p4.jpg'],
      created_at: new Date().toISOString(),
    },
  ]

  it('calcula resumo com contagem correta de itens, fotos e avarias', () => {
    const summary = summarizeInspection(mockInspection, mockItems)

    expect(summary.totalItems).toBe(3)
    expect(summary.totalPhotos).toBe(4)
    expect(summary.itemsWithDamage).toBe(1)
    expect(summary.conditionsCount.novo).toBe(1)
    expect(summary.conditionsCount.bom).toBe(1)
    expect(summary.conditionsCount.com_avarias).toBe(1)
    expect(summary.hasApprovedByTenant).toBe(true)
  })

  it('gera relatório textual formatado por cômodo', () => {
    const text = generateInspectionReportText(mockInspection, mockProperty, mockItems)

    expect(text).toContain('LAUDO DE VISTORIA ENTRADA')
    expect(text).toContain('Casa Alphaville')
    expect(text).toContain('[Sala de Estar]')
    expect(text).toContain('[Cozinha]')
    expect(text).toContain('Pequeno gotejamento na conexão flexível')
  })
})
