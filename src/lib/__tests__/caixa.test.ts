/**
 * Testes do cálculo de repasse e de caixa.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTES ARQUIVOS E NÃO UM E2E DE NAVEGADOR
 * ---------------------------------------------------------------------------
 *
 * O bug que estes testes pegam não aparece na tela. Um sinal trocado na taxa, um
 * aluguel contado duas vezes, uma comissão calculada sobre o percentual em vez
 * do preço: o número sai, a tela renderiza, e o erro só aparece quando alguém
 * confere a conta e o valor não bate. Testar isso exigindo que a pessoa clique
 * em três abas e some duas colunas seria lento e, pior, esses testes passariam
 * mesmo com a conta errada — eles verificam que a tela respondeu, não que o
 * dinheiro está certo.
 *
 * O dado de entrada é o mesmo nos dois casos: um contrato, o que foi pago, e a
 * taxa. Aqui a diferença entre R$ 1.900 e R$ 2.000 é um assert.
 *
 * Para o resto da aplicação (login, criação de cliente, upload), o E2E de
 * navegador continua sendo o certo — ver PROGRESS.md.
 */

import { describe, it, expect } from 'vitest'
import { calcularRepasseLocacao, calcularComissaoVenda, calcularTaxa, type FeeTerm } from '@/lib/repasse'
import { montarFluxoCaixa, agruparPorMes, type LancamentoCaixa } from '@/lib/caixa'
import type { Lease, Payment, Property, Sale } from '@/types'

// ---------------------------------------------------------------------------
// AJUDANTES
// ---------------------------------------------------------------------------

const imovel = (over: Partial<Property> = {}): Property =>
  ({
    id: 'imovel-1',
    title: 'Apartamento Centro',
    org_id: 'org-1',
    ...over,
  }) as Property

const contrato = (over: Partial<Lease> = {}): Lease =>
  ({
    id: 'contrato-1',
    property_id: 'imovel-1',
    tenant_id: 'inquilino-1',
    landlord_id: 'proprietario-1',
    monthly_rent: 2000,
    status: 'ativo',
    repasse_modelo: 'via_imobiliaria',
    ...over,
  }) as Lease

const pago = (over: Partial<Payment> = {}): Payment =>
  ({
    id: 'pagamento-1',
    lease_id: 'contrato-1',
    tenant_id: 'inquilino-1',
    amount: 2000,
    due_date: '2026-09-10',
    paid_date: '2026-09-10',
    status: 'pago',
    ...over,
  }) as Payment

const venda = (over: Partial<Sale> = {}): Sale =>
  ({
    id: 'venda-1',
    property_id: 'imovel-1',
    buyer_id: 'comprador-1',
    seller_id: 'vendedor-1',
    price: 300000,
    status: 'concluido',
    ...over,
  }) as Sale

/** Taxa de 10% de administração sobre o aluguel do contrato. */
const taxa10 = (over: Partial<FeeTerm> = {}): FeeTerm => ({
  id: 'taxa-1',
  property_id: 'imovel-1',
  lease_id: 'contrato-1',
  kind: 'administracao',
  incide_em: 'locacao',
  base: 'percentual',
  percentual: 10,
  ...over,
} as FeeTerm)

/** Imóvel de cliente: a taxa é receita de quem administra. */
const taxaComoReceita = (over: Partial<FeeTerm> = {}): FeeTerm =>
  taxa10({ id: 'taxa-receita', direction: 'receita', ...over })

/** Imóvel da própria org, administered por outra: a taxa é despesa. */
const taxaComoDespesa = (over: Partial<FeeTerm> = {}): FeeTerm =>
  taxa10({ id: 'taxa-despesa', direction: 'despesa', ...over })

// ---------------------------------------------------------------------------
// calcularTaxa
// ---------------------------------------------------------------------------

describe('calcularTaxa', () => {
  it('calcula percentual sobre a base', () => {
    expect(calcularTaxa('percentual', 2000, 10, null)).toBe(200)
  })

  it('ignora a base quando a taxa é valor fixo', () => {
    // Uma taxa fixa de R$ 300 não muda com o aluguel: forçar a mesma conta nas
    // duas formas obrigaria a mentir em uma delas.
    expect(calcularTaxa('valor_fixo', 2000, 10, 300)).toBe(300)
  })

  it('devolve zero para base sem percentual em vez de NaN', () => {
    expect(calcularTaxa('percentual', 2000, null, null)).toBe(0)
  })

  it('arredonda para centavos, sem sobra de float', () => {
    // 10% de 1.005 dá 100,5 — mas a soma de duas taxas assim daria 100,499999.
    expect(calcularTaxa('percentual', 1005, 10, null)).toBe(100.5)
    expect(calcularTaxa('percentual', 0.1, 10, null)).toBe(0.01)
  })
})

// ---------------------------------------------------------------------------
// calcularRepasseLocacao
// ---------------------------------------------------------------------------

describe('calcularRepasseLocacao', () => {
  it('desconta a taxa do que foi pago', () => {
    const r = calcularRepasseLocacao({
      monthlyRent: 2000,
      pagoNoPeriodo: 2000,
      termos: [taxa10()],
    })
    expect(r.taxas).toBe(200)
    expect(r.liquido).toBe(1800)
  })

  it('incide sobre o que foi pago, não sobre o aluguel cheio', () => {
    // O aluguel de janeiro vence dia 10 e só é pago dia 20, e só R$ 500
    // entraram até o dia 15. A taxa de janeiro existe sobre R$ 500 — cobrar
    // sobre os 2.000 seria descontar do caixa uma despesa que ainda não houve.
    const r = calcularRepasseLocacao({
      monthlyRent: 2000,
      pagoNoPeriodo: 500,
      termos: [taxa10()],
    })
    expect(r.taxas).toBe(50)
    expect(r.liquido).toBe(450)
  })

  it('ignora taxa que não incide em locação', () => {
    const r = calcularRepasseLocacao({
      monthlyRent: 2000,
      pagoNoPeriodo: 2000,
      termos: [taxa10({ incide_em: 'venda' })],
    })
    expect(r.taxas).toBe(0)
    expect(r.liquido).toBe(2000)
  })

  it('soma várias taxas de administração', () => {
    const r = calcularRepasseLocacao({
      monthlyRent: 2000,
      pagoNoPeriodo: 2000,
      termos: [taxa10(), taxa10({ id: 'taxa-2', base: 'valor_fixo', percentual: null, valor_fixo: 50 })],
    })
    expect(r.taxas).toBe(250)
    expect(r.liquido).toBe(1750)
  })

  it('as duas metades somam exatamente o que foi pago, sem sobra de centavo', () => {
    const r = calcularRepasseLocacao({
      monthlyRent: 2000,
      pagoNoPeriodo: 1005,
      termos: [taxa10({ percentual: 3 })],
    })
    // 1005 + 30,15 = 1035,15. Um float mal tratado daria 1035,1499999.
    expect(r.brutoPago + r.taxas).toBe(1035.15)
  })
})

// ---------------------------------------------------------------------------
// calcularComissaoVenda
// ---------------------------------------------------------------------------

describe('calcularComissaoVenda', () => {
  it('calcula a comissão sobre o preço de venda', () => {
    const c = calcularComissaoVenda({
      preco: 300000,
      termos: [
        {
          ...taxa10({ id: 'comissao-1' }),
          kind: 'comissao_venda',
          incide_em: 'venda',
          lease_id: null,
          sale_id: 'venda-1',
          percentual: 5,
          // A direção é preenchida pelo trigger do banco. Sem ela não há como
          // saber se a comissão é receita ou despesa, e o líquido do vendedor
          // fica igual ao preço — o que é o número errado.
          direction: 'despesa',
        } as FeeTerm,
      ],
    })
    expect(c.comissoes).toBe(15000)
    expect(c.despesas).toBe(15000)
    expect(c.liquido).toBe(285000)
  })

  it('separa comissão de receita e de despesa pela direção do banco', () => {
    const base = {
      kind: 'comissao_venda' as const,
      incide_em: 'venda' as const,
      lease_id: null,
      sale_id: 'venda-1',
      percentual: 5,
    }
    const c = calcularComissaoVenda({
      preco: 300000,
      termos: [
        { ...base, id: 'c1', property_id: 'imovel-1', direction: 'receita' } as FeeTerm,
        { ...base, id: 'c2', property_id: 'imovel-1', direction: 'despesa' } as FeeTerm,
      ],
    })
    expect(c.comissoes).toBe(30000)
    expect(c.receitas).toBe(15000)
    expect(c.despesas).toBe(15000)
    // Só o que é despesa sai do preço do vendedor da org.
    expect(c.liquido).toBe(285000)
  })
})

// ---------------------------------------------------------------------------
// montarFluxoCaixa — o ponto em que o erro seria silencioso
// ---------------------------------------------------------------------------

describe('montarFluxoCaixa', () => {
  it('conta a taxa UMA vez quando o imóvel é de cliente', () => {
    // O caso que motivou o cálculo a ser escrito por extenso. Um pagamento de
    // 2.000 com taxa de 200 que é receita da org:
    //   entra 2.000 e sai 1.800 -> saldo do mês = +200, a taxa.
    // Somar "o que o locatário pagou" e "a taxa" em separado contaria os 2.000
    // e os 200, e o saldo apareceria como 2.200.
    const linhas = montarFluxoCaixa({
      pagamentos: [pago()],
      leases: [contrato()],
      properties: [imovel()],
      sales: [],
      termos: [taxaComoReceita()],
      lancamentos: [],
    })

    const receitas = linhas.filter((l) => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const despesas = linhas.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)

    // Três linhas: entrada do bruto, saída do repasse, a taxa que é receita.
    expect(linhas).toHaveLength(3)
    expect(receitas).toBe(2200) // 2.000 do aluguel + 200 da taxa
    expect(despesas).toBe(1800)
    expect(receitas - despesas).toBe(400)
  })

  it('NÃO entra o aluguel cheio quando a taxa é despesa da org', () => {
    // Imóvel da própria org, outra imobiliária administra: o locatário pagou
    // para ELA, e o que a org recebeu foi só o líquido. Entrar os 2.000 seria
    // inventar receita que nunca passou pela conta.
    const linhas = montarFluxoCaixa({
      pagamentos: [pago()],
      leases: [contrato()],
      properties: [imovel()],
      sales: [],
      termos: [taxaComoDespesa()],
      lancamentos: [],
    })

    const receitas = linhas.filter((l) => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const despesas = linhas.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)

    // A org recebeu o líquido (1.800) e a taxa de 200 saiu como despesa — ela
    // não passou pela conta daqui, a outra imobiliária reteve direto.
    expect(linhas).toHaveLength(2)
    expect(receitas).toBe(1800)
    expect(despesas).toBe(200)
    expect(receitas - despesas).toBe(1600)
  })

  it('entra o aluguel inteiro quando não há taxa', () => {
    const linhas = montarFluxoCaixa({
      pagamentos: [pago()],
      leases: [contrato()],
      properties: [imovel()],
      sales: [],
      termos: [],
      lancamentos: [],
    })

    expect(linhas).toHaveLength(1)
    expect(linhas[0].valor).toBe(2000)
    expect(linhas[0].tipo).toBe('receita')
  })

  it('no repasse direto, a org registra só a taxa', () => {
    // O locatário paga direto ao proprietário: a imobiliária nunca recebeu os
    // 2.000. Sem esta regra, ela apareceria com receita que não tocou a conta.
    const linhas = montarFluxoCaixa({
      pagamentos: [pago()],
      leases: [contrato({ repasse_modelo: 'direto' })],
      properties: [imovel()],
      sales: [],
      termos: [taxaComoReceita()],
      lancamentos: [],
    })

    expect(linhas).toHaveLength(1)
    expect(linhas[0].valor).toBe(200)
    expect(linhas[0].tipo).toBe('receita')
  })

  it('ignora pagamento que não foi pago', () => {
    // Um aluguel pendente não entrou no caixa. Somá-lo daria a aparência de
    // receita que a imobiliária não tem.
    const linhas = montarFluxoCaixa({
      pagamentos: [pago({ status: 'pendente', paid_date: undefined })],
      leases: [contrato()],
      properties: [imovel()],
      sales: [],
      termos: [taxaComoReceita()],
      lancamentos: [],
    })

    expect(linhas).toHaveLength(0)
  })

  it('NÃO descarta a linha quando o imóvel não veio na consulta', () => {
    // A equipe vê todos os imóveis da org, então um imóvel ausente da lista
    // significa imóvel apagado ou lista incompleta — não é o filtro da RLS,
    // que é o caso do portal. Descartar a linha aqui sumiria com dinheiro
    // real: um aluguel pago e nenhuma linha no relatório.
    //
    // A linha entra, e a descrição diz o que está faltando, para o relatório
    // não ter uma linha anônima que parece um aluguel normal.
    const linhas = montarFluxoCaixa({
      pagamentos: [pago()],
      leases: [contrato()],
      properties: [],
      sales: [],
      termos: [taxaComoReceita()],
      lancamentos: [],
    })

    expect(linhas).toHaveLength(3)
    expect(linhas[0].property_title).toBeNull()
    expect(linhas[0].descricao).toContain('imóvel não encontrado')
    // O dinheiro continua apurado: 2.000 entrou, 1.800 saiu, 200 é a taxa.
    const receitas = linhas.filter((l) => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const despesas = linhas.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
    expect(receitas - despesas).toBe(400)
  })

  it('calcula a comissão de venda sobre o PREÇO, não sobre o percentual', () => {
    // 5% de 300.000 são 15.000. Usar o percentual como base daria 5% de 5%,
    // e a comissão errada passaria sem erro nenhum na tela.
    const comissao: FeeTerm = {
      id: 'comissao-1',
      property_id: 'imovel-1',
      lease_id: null,
      sale_id: 'venda-1',
      kind: 'comissao_venda',
      incide_em: 'venda',
      base: 'percentual',
      percentual: 5,
      direction: 'receita',
      repasse_paid_at: '2026-09-20',
    } as FeeTerm

    const linhas = montarFluxoCaixa({
      pagamentos: [],
      leases: [],
      properties: [imovel()],
      sales: [venda()],
      termos: [comissao],
      lancamentos: [],
    })

    expect(linhas).toHaveLength(1)
    expect(linhas[0].valor).toBe(15000)
  })

  it('soma as três fontes sem dobrar nenhuma', () => {
    const lancamentos: LancamentoCaixa[] = [
      {
        id: 'l1',
        type: 'receita',
        description: 'Taxa de cadastro',
        amount: 500,
        entry_date: '2026-09-05',
        category: 'taxa de cadastro',
      },
      {
        id: 'l2',
        type: 'despesa',
        description: 'IPTU',
        amount: 300,
        entry_date: '2026-09-15',
        category: 'imposto',
      },
    ]

    const linhas = montarFluxoCaixa({
      pagamentos: [pago()],
      leases: [contrato()],
      properties: [imovel()],
      sales: [],
      termos: [taxaComoReceita()],
      lancamentos,
    })

    const receitas = linhas.filter((l) => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const despesas = linhas.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)

    // 2.000 (aluguel) + 200 (taxa) + 500 (cadastro) = 2.700 de receita.
    // 1.800 (repasse) + 300 (IPTU) = 2.100 de despesa.
    expect(linhas).toHaveLength(5)
    expect(receitas).toBe(2700)
    expect(despesas).toBe(2100)
    expect(receitas - despesas).toBe(600)
  })
})

// ---------------------------------------------------------------------------
// agruparPorMes
// ---------------------------------------------------------------------------

describe('agruparPorMes', () => {
  it('separa por mês e ordena do mais antigo para o mais novo', () => {
    const linhas = montarFluxoCaixa({
      pagamentos: [
        pago({ id: 'p1', paid_date: '2026-08-10' }),
        pago({ id: 'p2', paid_date: '2026-09-10' }),
      ],
      leases: [contrato()],
      properties: [imovel()],
      sales: [],
      termos: [],
      lancamentos: [],
    })

    const meses = agruparPorMes(linhas)
    expect(meses.map((m) => m.mes)).toEqual(['2026-08', '2026-09'])
    expect(meses[0].receitas).toBe(2000)
    expect(meses[0].saldo).toBe(2000)
  })
})
