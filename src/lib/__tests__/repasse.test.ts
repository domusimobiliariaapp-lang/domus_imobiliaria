import { describe, it, expect } from 'vitest'
import {
  calcularTaxa,
  calcularRepasseLocacao,
  calcularComissaoVenda,
  contraparteNome,
  vigenteEm,
  formatBRL,
  type FeeTerm,
} from '../repasse'

describe('repasse.ts', () => {
  describe('calcularTaxa', () => {
    it('calcula taxa percentual corretamente arredondando para centavos', () => {
      expect(calcularTaxa('percentual', 2000, 10, null)).toBe(200)
      expect(calcularTaxa('percentual', 1555.55, 8.5, null)).toBe(132.22)
    })

    it('retorna valor fixo independente da base de cálculo', () => {
      expect(calcularTaxa('valor_fixo', 5000, null, 250)).toBe(250)
      expect(calcularTaxa('valor_fixo', 0, 10, 150.75)).toBe(150.75)
    })

    it('trata valores nulos, inválidos ou indefinidos retornando 0', () => {
      expect(calcularTaxa('percentual', 2000, null, null)).toBe(0)
      expect(calcularTaxa('percentual', 2000, undefined, undefined)).toBe(0)
      expect(calcularTaxa('valor_fixo', 2000, null, null)).toBe(0)
    })
  })

  describe('calcularRepasseLocacao', () => {
    it('calcula repasse padrão de locação com taxa de administração percentual', () => {
      const termos: FeeTerm[] = [
        {
          id: '1',
          property_id: 'p1',
          kind: 'administracao',
          incide_em: 'locacao',
          base: 'percentual',
          percentual: 10,
          direction: 'receita',
        },
      ]

      const repasse = calcularRepasseLocacao({
        monthlyRent: 2000,
        pagoNoPeriodo: 2000,
        termos,
      })

      expect(repasse.brutoContrato).toBe(2000)
      expect(repasse.brutoPago).toBe(2000)
      expect(repasse.taxas).toBe(200)
      expect(repasse.receitas).toBe(200)
      expect(repasse.despesas).toBe(0)
      expect(repasse.liquido).toBe(1800)
      expect(repasse.termos).toHaveLength(1)
    })

    it('incide apenas sobre o valor efetivamente pago e não sobre o aluguel cheio do contrato', () => {
      const termos: FeeTerm[] = [
        {
          id: '1',
          property_id: 'p1',
          kind: 'administracao',
          incide_em: 'locacao',
          base: 'percentual',
          percentual: 8,
          direction: 'receita',
        },
      ]

      // Contrato de 3000, mas inquilino pagou apenas 1500 no período analisado
      const repasse = calcularRepasseLocacao({
        monthlyRent: 3000,
        pagoNoPeriodo: 1500,
        termos,
      })

      expect(repasse.brutoContrato).toBe(3000)
      expect(repasse.brutoPago).toBe(1500)
      expect(repasse.taxas).toBe(120) // 8% de 1500, não de 3000
      expect(repasse.liquido).toBe(1380)
    })

    it('ignora taxas que incidem exclusivamente sobre venda', () => {
      const termos: FeeTerm[] = [
        {
          id: '1',
          property_id: 'p1',
          kind: 'comissao_venda',
          incide_em: 'venda',
          base: 'percentual',
          percentual: 6,
          direction: 'receita',
        },
      ]

      const repasse = calcularRepasseLocacao({
        monthlyRent: 2500,
        pagoNoPeriodo: 2500,
        termos,
      })

      expect(repasse.taxas).toBe(0)
      expect(repasse.liquido).toBe(2500)
      expect(repasse.termos).toHaveLength(0)
    })

    it('processa termo com incide_em ambos e direção despesa (imóvel próprio terceirizado)', () => {
      const termos: FeeTerm[] = [
        {
          id: '1',
          property_id: 'p1',
          kind: 'administracao',
          incide_em: 'ambos',
          base: 'percentual',
          percentual: 7,
          direction: 'despesa',
        },
      ]

      const repasse = calcularRepasseLocacao({
        monthlyRent: 1000,
        pagoNoPeriodo: 1000,
        termos,
      })

      expect(repasse.taxas).toBe(70)
      expect(repasse.despesas).toBe(70)
      expect(repasse.receitas).toBe(0)
      expect(repasse.liquido).toBe(930)
    })
  })

  describe('calcularComissaoVenda', () => {
    it('calcula comissão sobre o valor de venda corretamente', () => {
      const termos: FeeTerm[] = [
        {
          id: 'v1',
          property_id: 'p2',
          kind: 'comissao_venda',
          incide_em: 'venda',
          base: 'percentual',
          percentual: 6,
          direction: 'receita',
        },
      ]

      const comissao = calcularComissaoVenda({
        preco: 500000,
        termos,
      })

      expect(comissao.preco).toBe(500000)
      expect(comissao.comissoes).toBe(30000)
      expect(comissao.receitas).toBe(30000)
      expect(comissao.despesas).toBe(0)
      expect(comissao.liquido).toBe(500000)
    })

    it('subtrai despesas de comissão do valor líquido quando o imóvel é próprio da org', () => {
      const termos: FeeTerm[] = [
        {
          id: 'v2',
          property_id: 'p3',
          kind: 'comissao_venda',
          incide_em: 'venda',
          base: 'percentual',
          percentual: 5,
          direction: 'despesa', // pago a corretor parceiro externo
        },
      ]

      const comissao = calcularComissaoVenda({
        preco: 300000,
        termos,
      })

      expect(comissao.comissoes).toBe(15000)
      expect(comissao.despesas).toBe(15000)
      expect(comissao.liquido).toBe(285000) // 300.000 - 15.000
    })
  })

  describe('contraparteNome', () => {
    const nomes = {
      perfis: new Map([['prof-1', 'Carlos Corretor']]),
      orgs: new Map([['org-1', 'Imobiliária Parceira']]),
    }

    it('prioriza nome avulso direto', () => {
      expect(
        contraparteNome(
          {
            contraparte_nome: 'Prestador Avulso',
            contraparte_org_id: 'org-1',
            contraparte_profile_id: 'prof-1',
          },
          nomes,
        ),
      ).toBe('Prestador Avulso')
    })

    it('resolve nome da organização parceira se nome direto for nulo', () => {
      expect(
        contraparteNome(
          {
            contraparte_nome: null,
            contraparte_org_id: 'org-1',
            contraparte_profile_id: null,
          },
          nomes,
        ),
      ).toBe('Imobiliária Parceira')
    })

    it('resolve nome do perfil da equipe', () => {
      expect(
        contraparteNome(
          {
            contraparte_nome: null,
            contraparte_org_id: null,
            contraparte_profile_id: 'prof-1',
          },
          nomes,
        ),
      ).toBe('Carlos Corretor')
    })

    it('retorna fallback quando nenhuma contraparte for identificada', () => {
      expect(
        contraparteNome(
          {
            contraparte_nome: null,
            contraparte_org_id: null,
            contraparte_profile_id: null,
          },
          nomes,
        ),
      ).toBe('A definir')
    })
  })

  describe('vigenteEm', () => {
    it('identifica corretamente se termo está dentro da vigência', () => {
      const termo: FeeTerm = {
        id: '1',
        property_id: 'p1',
        kind: 'administracao',
        incide_em: 'locacao',
        base: 'percentual',
        starts_on: '2026-01-01',
        ends_on: '2026-12-31',
      }

      expect(vigenteEm(termo, new Date('2026-06-15T12:00:00'))).toBe(true)
      expect(vigenteEm(termo, new Date('2025-12-31T12:00:00'))).toBe(false)
      expect(vigenteEm(termo, new Date('2027-01-02T12:00:00'))).toBe(false)
    })

    it('permite termos sem data de fim (vigência contínua)', () => {
      const termo: FeeTerm = {
        id: '2',
        property_id: 'p1',
        kind: 'administracao',
        incide_em: 'locacao',
        base: 'percentual',
        starts_on: '2026-01-01',
        ends_on: null,
      }

      expect(vigenteEm(termo, new Date('2030-01-01'))).toBe(true)
      expect(vigenteEm(termo, new Date('2025-12-31'))).toBe(false)
    })
  })

  describe('formatBRL', () => {
    it('formata moeda no padrão brasileiro', () => {
      const formatted = formatBRL(1250.5)
      expect(formatted).toContain('1.250,50')
    })
  })
})
