/**
 * Radar de Cruzamento Inteligente (Smart Match)
 *
 * Módulo puro responsável por correlacionar o perfil de interesses de um Lead com
 * o catálogo de imóveis disponíveis da imobiliária (e vice-versa).
 *
 * Permite que corretores identifiquem instantaneamente oportunidades de negócio
 * no momento em que um lead entra ou um novo imóvel é captado.
 */

import type { CrmLead, Property } from '@/types'

export interface MatchFactor {
  label: string
  matched: boolean
  points: number
  maxPoints: number
  detail: string
}

export interface SmartMatchResult {
  property: Property
  score: number // 0 a 100
  factors: MatchFactor[]
  reasons: string[]
}

export interface LeadMatchResult {
  lead: CrmLead
  score: number
  factors: MatchFactor[]
  reasons: string[]
}

/**
 * Calcula a afinidade percentual entre um Lead e um Imóvel.
 */
export function calculateMatch(lead: CrmLead, property: Property): SmartMatchResult {
  const factors: MatchFactor[] = []
  const reasons: string[] = []

  // 1. Tipo de Imóvel (30 pts)
  const leadPropType = lead.property_type
  const typeMatched = !leadPropType || leadPropType === property.type
  const typePoints = typeMatched ? 30 : 0
  factors.push({
    label: 'Tipo de Imóvel',
    matched: typeMatched,
    points: typePoints,
    maxPoints: 30,
    detail: typeMatched
      ? `Tipo compatível (${property.type})`
      : `Deseja ${leadPropType}, imóvel é ${property.type}`,
  })
  if (typeMatched && leadPropType) reasons.push(`Tipo de imóvel: ${property.type}`)

  // 2. Finalidade / Interesse (25 pts)
  const propPurpose = property.purpose || 'aluguel'
  let purposeMatched = false
  if (lead.interest_type === 'ambos') {
    purposeMatched = true
  } else if (lead.interest_type === 'locacao') {
    purposeMatched = propPurpose === 'aluguel' || propPurpose === 'ambos' || propPurpose === 'temporada'
  } else if (lead.interest_type === 'venda') {
    purposeMatched = propPurpose === 'venda' || propPurpose === 'ambos'
  }

  const purposePoints = purposeMatched ? 25 : 0
  factors.push({
    label: 'Finalidade',
    matched: purposeMatched,
    points: purposePoints,
    maxPoints: 25,
    detail: purposeMatched
      ? `Interesse ${lead.interest_type} atende finalidade ${propPurpose}`
      : `Interesse ${lead.interest_type} diverge de ${propPurpose}`,
  })
  if (purposeMatched) reasons.push(`Finalidade ${lead.interest_type}`)

  // 3. Orçamento / Preço (25 pts)
  const relevantPrice = lead.interest_type === 'venda' ? property.sale_price : property.rent_price
  let budgetMatched = false
  let budgetPoints = 0
  let budgetDetail = 'Orçamento não informado'

  if (!lead.max_budget || lead.max_budget <= 0) {
    // Sem teto definido: pontuação neutra proporcional
    budgetMatched = true
    budgetPoints = 20
    budgetDetail = 'Lead flexível quanto a valor'
  } else if (relevantPrice <= lead.max_budget) {
    budgetMatched = true
    budgetPoints = 25
    budgetDetail = `Valor R$ ${relevantPrice.toLocaleString('pt-BR')} dentro do teto de R$ ${lead.max_budget.toLocaleString('pt-BR')}`
    reasons.push('Dentro do orçamento')
  } else if (relevantPrice <= lead.max_budget * 1.1) {
    // Tolerância de até 10% acima do teto
    budgetMatched = true
    budgetPoints = 15
    budgetDetail = `Valor ligeiramente acima (+10%) do teto de R$ ${lead.max_budget.toLocaleString('pt-BR')}`
    reasons.push('Próximo ao orçamento planejado')
  } else {
    budgetDetail = `Valor R$ ${relevantPrice.toLocaleString('pt-BR')} excede teto de R$ ${lead.max_budget.toLocaleString('pt-BR')}`
  }

  factors.push({
    label: 'Orçamento',
    matched: budgetMatched,
    points: budgetPoints,
    maxPoints: 25,
    detail: budgetDetail,
  })

  // 4. Quartos (10 pts)
  const minBedrooms = lead.min_bedrooms || 1
  const bedroomsMatched = (property.bedrooms || 0) >= minBedrooms
  const bedroomPoints = bedroomsMatched ? 10 : 0
  factors.push({
    label: 'Dormitórios',
    matched: bedroomsMatched,
    points: bedroomPoints,
    maxPoints: 10,
    detail: `${property.bedrooms || 0} quartos (mínimo desejado: ${minBedrooms})`,
  })
  if (bedroomsMatched) reasons.push(`${property.bedrooms || 0} quartos`)

  // 5. Bairros Preferidos (10 pts)
  const preferredNeighborhoods = lead.preferred_neighborhoods || []
  let neighborhoodMatched = false
  if (preferredNeighborhoods.length === 0) {
    neighborhoodMatched = true
  } else {
    const propBairro = (property.neighborhood || '').toLowerCase().trim()
    neighborhoodMatched = preferredNeighborhoods.some(
      (b) => b.toLowerCase().trim() === propBairro || propBairro.includes(b.toLowerCase().trim()),
    )
  }

  const neighborhoodPoints = neighborhoodMatched ? 10 : 0
  factors.push({
    label: 'Localização',
    matched: neighborhoodMatched,
    points: neighborhoodPoints,
    maxPoints: 10,
    detail: neighborhoodMatched
      ? `Bairro ${property.neighborhood || 'qualquer'} compatível`
      : `Bairro ${property.neighborhood} fora da preferência declarada`,
  })
  if (neighborhoodMatched && preferredNeighborhoods.length > 0) {
    reasons.push(`Bairro ${property.neighborhood}`)
  }

  const totalPoints = factors.reduce((acc, f) => acc + f.points, 0)
  const score = Math.min(100, Math.max(0, totalPoints))

  return {
    property,
    score,
    factors,
    reasons,
  }
}

/**
 * Encontra os imóveis mais compatíveis para um lead, ordenados por afinidade decrescente.
 */
export function findPropertiesForLead(
  lead: CrmLead,
  properties: Property[],
  minScore = 50,
): SmartMatchResult[] {
  return properties
    .filter((p) => p.status === 'disponivel')
    .map((p) => calculateMatch(lead, p))
    .filter((res) => res.score >= minScore)
    .sort((a, b) => b.score - a.score)
}

/**
 * Encontra os leads mais compatíveis para um imóvel recém-captado.
 */
export function findLeadsForProperty(
  property: Property,
  leads: CrmLead[],
  minScore = 50,
): LeadMatchResult[] {
  return leads
    .filter((lead) => lead.stage !== 'fechado' && lead.stage !== 'perdido')
    .map((lead) => {
      const match = calculateMatch(lead, property)
      return {
        lead,
        score: match.score,
        factors: match.factors,
        reasons: match.reasons,
      }
    })
    .filter((res) => res.score >= minScore)
    .sort((a, b) => b.score - a.score)
}
