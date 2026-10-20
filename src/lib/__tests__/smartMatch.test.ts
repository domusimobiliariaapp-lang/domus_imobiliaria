import { describe, it, expect } from 'vitest'
import { calculateMatch, findPropertiesForLead, findLeadsForProperty } from '../smartMatch'
import type { CrmLead, Property } from '@/types'

describe('smartMatch.ts', () => {
  const mockProperty: Property = {
    id: 'p1',
    title: 'Apartamento Jardins',
    type: 'apartamento',
    purpose: 'aluguel',
    status: 'disponivel',
    address: 'Rua Oscar Freire',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01426-000',
    area_m2: 95,
    bedrooms: 3,
    bathrooms: 2,
    rent_price: 4500,
    sale_price: 950000,
    description: 'Belo apartamento reformado',
    images: [],
    features: ['academia', 'piscina'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockLead: CrmLead = {
    id: 'l1',
    name: 'Ana Silva',
    phone: '11988887777',
    email: 'ana@example.com',
    interest_type: 'locacao',
    property_type: 'apartamento',
    max_budget: 5000,
    min_bedrooms: 2,
    preferred_neighborhoods: ['Jardins', 'Pinheiros'],
    stage: 'novo',
    created_at: new Date().toISOString(),
  }

  it('calcula pontuação máxima de 100 para correspondência exata', () => {
    const result = calculateMatch(mockLead, mockProperty)
    expect(result.score).toBe(100)
    expect(result.reasons).toContain('Tipo de imóvel: apartamento')
    expect(result.reasons).toContain('Dentro do orçamento')
    expect(result.reasons).toContain('3 quartos')
    expect(result.reasons).toContain('Bairro Jardins')
  })

  it('reduz pontuação se o tipo de imóvel divergir', () => {
    const leadCasa: CrmLead = {
      ...mockLead,
      property_type: 'casa',
    }
    const result = calculateMatch(leadCasa, mockProperty)
    expect(result.score).toBe(70) // 100 - 30 de tipo
  })

  it('concede pontuação parcial (+15 pts) quando o valor estiver dentro da margem de 10%', () => {
    const leadLimite: CrmLead = {
      ...mockLead,
      max_budget: 4200, // 4500 é menor que 4200 * 1.1 = 4620
    }
    const result = calculateMatch(leadLimite, mockProperty)
    expect(result.score).toBe(90) // 100 - 10 de penalidade parcial
    expect(result.reasons).toContain('Próximo ao orçamento planejado')
  })

  it('filtra imóveis com score mínimo especificado', () => {
    const properties: Property[] = [
      mockProperty,
      {
        ...mockProperty,
        id: 'p2',
        type: 'comercial',
        rent_price: 15000,
        neighborhood: 'Morumbi',
        bedrooms: 0,
      },
    ]

    const matches = findPropertiesForLead(mockLead, properties, 70)
    expect(matches).toHaveLength(1)
    expect(matches[0].property.id).toBe('p1')
  })

  it('encontra leads compatíveis para um imóvel recém-captado', () => {
    const leads: CrmLead[] = [
      mockLead,
      {
        ...mockLead,
        id: 'l2',
        interest_type: 'venda',
        max_budget: 300000,
        property_type: 'terreno',
      },
    ]

    const matches = findLeadsForProperty(mockProperty, leads, 60)
    expect(matches).toHaveLength(1)
    expect(matches[0].lead.id).toBe('l1')
  })
})
