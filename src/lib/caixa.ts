/**
 * Fluxo de caixa da imobiliária, por mês.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ISTO É SEPARADO DO RELATÓRIO DE REPASSE
 * ---------------------------------------------------------------------------
 *
 * O relatório de repasse responde a uma pergunta por contrato: o que o locatário
 * pagou, quanto foi de taxa, o que sobra para o dono. Ele é por CONTRATO, e cada
 * linha é um contrato.
 *
 * O caixa responde a outra, da imobiliária: no mês, quanto entrou, quanto saiu e
 * qual o saldo. Uma despesa de manutenção não pertence a contrato nenhum, e uma
 * taxa de cadastro não tem contrato — mas as duas entram no caixa. Se fosse tudo
 * numa tela, o relatório de repasse teria de mostrar linhas que não são repasse,
 * e o dono do imóvel veria a manutenção do apartamento do vizinho na conta dele.
 *
 * ---------------------------------------------------------------------------
 * A DIREÇÃO DA TAXA DETERMINA A FORMA TODA DA LINHA
 * ---------------------------------------------------------------------------
 *
 * Esta é a parte que não é óbvia, e é a razão de o cálculo ser escrito por
 * extenso em vez de ser uma soma de três números.
 *
 * Um pagamento de R$ 2.000 pode significar três coisas completamente diferentes
 * no caixa da imobiliária, dependendo de QUEM é o dono do imóvel — e isso é o
 * que o banco já deduziu em fee_terms.direction:
 *
 *   direção = receita  A org administra imóvel de CLIENTE. O locatário pagou os
 *                      2.000 para a org. Entram 2.000, e saem 1.900 na hora
 *                      do repasse ao dono. Saldo do mês: +100, a taxa.
 *
 *   direção = despesa  É o imóvel da ORG, e outra imobiliária administra. O
 *                      locatário pagou para ela, e a org recebeu só o líquido.
 *                      Entra 1.900. A taxa de 100 nunca chegou aqui — somar os
 *                      2.000 seria inventar entrada.
 *
 *   sem taxa alguma    Locação direta, sem intermediário. Entram os 2.000
 *                      inteiros, e nada sai: o dono é a própria org.
 *
 * Somar "o que o locatário pagou" e "as taxas" em separado, como se fossem
 * quantidades independentes, conta a taxa duas vezes nos dois primeiros casos e
 * dá um saldo que não corresponde a nenhum deles. Por isso cada linha de
 * pagamento é montada de uma vez, com a receita e a despesa já decididas.
 *
 * ---------------------------------------------------------------------------
 * QUEM RECEBE QUANDO O REPASSE É DIRETO
 * ---------------------------------------------------------------------------
 *
 * Em repasse_modelo = 'direto' o locatário paga direto ao proprietário e a
 * imobiliária nunca recebe esse dinheiro. Ela cobra só a taxa de administração,
 * e é essa taxa — nada mais — que entra no caixa dela. Sem esta regra, a org
 * apareceria com R$ 2.000 de receita que nunca tocou a sua conta.
 *
 * Para o PROPRIETÁRIO o líquido é o mesmo nos dois modelos: o bruto menos a
 * taxa. Muda quem paga, não quanto sobra.
 *
 * ---------------------------------------------------------------------------
 * POR QUE SÓ O QUE FOI PAGO
 * ---------------------------------------------------------------------------
 *
 * Um aluguel pendente ou atrasado não entrou no caixa. Somá-lo daria à
 * imobiliária a aparência de receita que ela não tem — e a taxa que incide
 * sobre ele também não existe: cobrar taxa sobre dinheiro que não entrou é
 * descontar do caixa uma despesa que ainda não nasceu.
 */

import type { Lease, Payment, Property, Sale } from '@/types'
import { calcularTaxa, formatBRL } from '@/lib/repasse'
import type { FeeTerm } from '@/lib/repasse'

/** Um lançamento cru de financial_entries. Só o que o caixa usa. */
export interface LancamentoCaixa {
  id: string
  type: 'receita' | 'despesa'
  description: string
  amount: number
  entry_date: string
  category: string | null
}

export interface LinhaCaixa {
  /** 'YYYY-MM', para agrupar e ordenar sem parse de data. */
  mes: string
  data: string
  descricao: string
  categoria: string | null
  tipo: 'receita' | 'despesa'
  /** Sempre positivo — o sinal está em `tipo`. */
  valor: number
  /**
   * Para o dono: a quem este dinheiro é destinado. Numa linha de pagamento é o
   * proprietário que leva a maior parte; numa linha de taxa é quem a reteve.
   */
  contraparte?: string | null
  property_id?: string | null
  property_title?: string | null
  /** De onde a linha veio — para o usuário ver o que é digitado e o que é deduzido. */
  origem: 'pagamento' | 'taxa' | 'lancamento'
}

export interface MesCaixa {
  mes: string
  receitas: number
  despesas: number
  saldo: number
  linhas: LinhaCaixa[]
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** 'YYYY-MM-DD' ou ISO completo -> 'YYYY-MM'. */
export function mesDe(data: string | null | undefined): string {
  if (!data) return ''
  return data.slice(0, 7)
}

/** '2026-09' -> 'Setembro/2026'. */
export function rotularMes(mes: string): string {
  const [ano, m] = mes.split('-')
  const indice = Number(m) - 1
  if (!ano || Number.isNaN(indice) || !MESES[indice]) return mes
  const nome = MESES[indice]
  return `${nome[0].toUpperCase()}${nome.slice(1)}/${ano}`
}

const centavos = (n: number) => Math.round(n * 100) / 100

/** As taxas de administração de um contrato, que é o que decide a forma da linha. */
function taxasDeAdministracao(termos: FeeTerm[], leaseId: string): FeeTerm[] {
  return termos.filter(
    (t) =>
      t.kind === 'administracao' &&
      (t.incide_em === 'locacao' || t.incide_em === 'ambos') &&
      t.lease_id === leaseId,
  )
}

/**
 * Monta o fluxo de caixa linha a linha.
 *
 * A ordem dentro do mês é a data, não a ordem de inserção: quem lê um extrato
 * procura por dia, e uma lista fora de ordem obriga a varrer a tabela inteira
 * para achar o lançamento de ontem.
 */
export function montarFluxoCaixa({
  pagamentos,
  leases,
  properties,
  sales,
  termos,
  lancamentos,
}: {
  pagamentos: Payment[]
  leases: Lease[]
  properties: Property[]
  sales: Sale[]
  termos: FeeTerm[]
  lancamentos: LancamentoCaixa[]
}): LinhaCaixa[] {
  const linhas: LinhaCaixa[] = []

  const leasePorId = new Map(leases.map((l) => [l.id, l]))
  const propertyPorId = new Map(properties.map((p) => [p.id, p]))
  const salePorId = new Map(sales.map((s) => [s.id, s]))

  // ================================================================
  // 1. PAGAMENTOS — o aluguel, com a taxa já liquidada dentro da linha
  // ================================================================

  for (const pagamento of pagamentos) {
    if (pagamento.status !== 'pago') continue

    const lease = leasePorId.get(pagamento.lease_id)
    if (!lease) continue

    const imovel = propertyPorId.get(lease.property_id)
    const data = pagamento.paid_date || pagamento.due_date
    const mes = mesDe(data)
    const bruto = Number(pagamento.amount) || 0
    if (bruto <= 0 || !mes) continue

    // O imóvel pode faltar da lista por dois motivos, e a diferença importa:
    //
    //   A equipe vê todos os imóveis da org, então se ele não veio, ou o
    //   imóvel foi apagado, ou a lista de imóveis veio incompleta. Descartar a
    //   linha aqui sumiria com dinheiro real do relatório — um aluguel pago e
    //   nenhuma linha na conta.
    //
    //   No portal o mesmo `continue` é o comportamento certo, porque a RLS
    //   esconde do cliente o imóvel que não é dele, e a tela avisa separado.
    //
    // A linha entra sem título, e a descrição diz o que está faltando: um
    // relatório com uma linha a menos é pior do que um com uma linha que se
    // reconhece como incompleta.
    const tituloImovel = imovel?.title
    const rotuloImovel = tituloImovel
      ? ` · ${tituloImovel}`
      : ` · imóvel não encontrado (${lease.property_id.slice(0, 8)})`

    const taxas = taxasDeAdministracao(termos, lease.id)
    const taxaTotal = centavos(
      taxas.reduce((s, t) => s + calcularTaxa(t.base, bruto, t.percentual, t.valor_fixo), 0),
    )
    const liquidoDono = centavos(bruto - taxaTotal)

    // --- Repasse direto: a org não recebeu o aluguel ---
    // O locatário pagou ao proprietário. A entrada da org é só a taxa de
    // administração, e ela entra como receita — a org a reteve, não a repassou.
    if (lease.repasse_modelo === 'direto') {
      if (taxaTotal > 0) {
        linhas.push({
          mes,
          data,
          descricao: `Taxa de administração${rotuloImovel}`,
          categoria: 'taxa de administração',
          tipo: 'receita',
          valor: taxaTotal,
          property_id: lease.property_id,
          property_title: imovel?.title ?? null,
          origem: 'taxa',
        })
      }
      continue
    }

    // --- A org é dona do imóvel, sem taxa: entra o aluguel inteiro ---
    if (taxaTotal <= 0) {
      linhas.push({
        mes,
        data,
        descricao: `Aluguel${rotuloImovel}`,
        categoria: 'aluguel',
        tipo: 'receita',
        valor: bruto,
        property_id: lease.property_id,
        property_title: imovel?.title ?? null,
        origem: 'pagamento',
      })
      continue
    }

    // --- Com taxa, a direção decide a forma toda ---
    //
    // A direção vem do banco, que a deduziu de quem é o dono do imóvel. Não é
    // deduzida aqui de novo: repetir a regra no front deixaria duas versões
    // da verdade, e um ajuste em uma delas passaria despercebido.

    const taxaEhReceita = taxas.some((t) => t.direction === 'receita')
    const taxaEhDespesa = taxas.some((t) => t.direction === 'despesa')

    if (taxaEhReceita) {
      // Imóvel de cliente, administrado pela org. O locatário pagou para a
      // imobiliária, então a entrada é INTEIRA: os 2.000 saem do locatário e
      // entram na conta da org. Depois, o líquido sai para o dono. O que sobra
      // é a taxa — e é ela que o relatório de repasse mostra como receita.
      //
      // Lançar só a saída de 1.800 e a taxa de 200 daria um mês com saldo de
      // -1.600, o que diria que a imobiliária perdeu dinheiro num mês em que
      // ganhou os 200. As três linhas juntas somam bruto: 2.000 = 1.800 + 200.
      linhas.push({
        mes,
        data,
        descricao: `Aluguel recebido${rotuloImovel}`,
        categoria: 'aluguel',
        tipo: 'receita',
        valor: bruto,
        property_id: lease.property_id,
        property_title: imovel?.title ?? null,
        origem: 'pagamento',
      })
      linhas.push({
        mes,
        data,
        descricao: `Repasse ao proprietário${rotuloImovel}`,
        categoria: 'repasse',
        tipo: 'despesa',
        valor: liquidoDono,
        contraparte: imovel?.title ?? null,
        property_id: lease.property_id,
        property_title: imovel?.title ?? null,
        origem: 'pagamento',
      })
      linhas.push({
        mes,
        data,
        descricao: `Taxa de administração${rotuloImovel}`,
        categoria: 'taxa de administração',
        tipo: 'receita',
        valor: taxaTotal,
        property_id: lease.property_id,
        property_title: imovel?.title ?? null,
        origem: 'taxa',
      })
      continue
    }

    if (taxaEhDespesa) {
      // Imóvel da própria org, administrado por outra imobiliária. O locatário
      // pagou PARA ELA, e não para cá: essa imobiliária reteve a taxa e
      // repassou o líquido. O que a org recebeu, portanto, são os 1.900 — e a
      // taxa de 200 é o custo de ter terceirizado a administração.
      //
      // A taxa entra aqui como DESPESA, e não como uma segunda operação: ela não
      // sai da conta da org, sai do bruto que a administradora fez sumir. Somar
      // os 1.800 do líquido com os 200 de despesa daria um mês de 1.600, quando
      // o caixa da org recebeu 1.900 e a perda real foram os 200 da taxa.
      linhas.push({
        mes,
        data,
        descricao: `Aluguel recebido${rotuloImovel}`,
        categoria: 'aluguel',
        tipo: 'receita',
        valor: liquidoDono,
        property_id: lease.property_id,
        property_title: imovel?.title ?? null,
        origem: 'pagamento',
      })
      linhas.push({
        mes,
        data,
        descricao: `Taxa de administração paga a outra imobiliária${rotuloImovel}`,
        categoria: 'taxa de administração',
        tipo: 'despesa',
        valor: taxaTotal,
        property_id: lease.property_id,
        property_title: imovel?.title ?? null,
        origem: 'taxa',
      })
      continue
    }

    // Taxa sem direção resolvida (fee_terms sem org_id, ou trigger que não
    // rodou). A soma não fecha e o relatório mentiria; melhor expor a taxa
    // como despesa conservadora do que inventar receita.
    linhas.push({
      mes,
      data,
      descricao: `Aluguel${rotuloImovel}`,
      categoria: 'aluguel',
      tipo: 'receita',
      valor: bruto,
      property_id: lease.property_id,
      property_title: imovel?.title ?? null,
      origem: 'pagamento',
    })
    linhas.push({
      mes,
      data,
      descricao: `Taxa de administração (direção indefinida)${rotuloImovel}`,
      categoria: 'taxa de administração',
      tipo: 'despesa',
      valor: taxaTotal,
      property_id: lease.property_id,
      property_title: imovel?.title ?? null,
      origem: 'taxa',
    })
  }

  // ================================================================
  // 2. COMISSÃO DE VENDA
  // ================================================================
  //
  // Não entra na parte dos pagamentos: a comissão incide sobre o PREÇO de venda,
  // que é um evento único, e não sobre o aluguel. A base vem de sales.price —
  // nunca de fee_terms, que guarda a taxa e não o preço. Usar o percentual
  // como base daria uma comissão de 6% de 6% .
  //
  // A data é a do próprio termo: `repasse_paid_at` é quando a comissão foi
  // liquidada, e é isso que o caixa registra. Para a taxa de locação esse campo
  // NÃO serve — é por isso que a parte 1 usa a data do pagamento.

  for (const termo of termos) {
    if (termo.kind !== 'comissao_venda') continue
    if (termo.direction !== 'receita' && termo.direction !== 'despesa') continue

    const data = termo.repasse_paid_at
    if (!data) continue

    const imovel = termo.property_id ? propertyPorId.get(termo.property_id) : undefined
    const venda = termo.sale_id ? salePorId.get(termo.sale_id) : undefined
    const preco = Number(venda?.price) || 0

    if (preco <= 0) continue

    const valor = centavos(calcularTaxa(termo.base, preco, termo.percentual, termo.valor_fixo))
    if (valor <= 0) continue

    // O imóvel pode faltar aqui pelo mesmo motivo do pagamento: ele não veio na
    // lista. A linha entra com o id em vez de sumir, porque uma comissão
    // calculada e não exibida é dinheiro que some do relatório sem aviso.
    const rotuloImovel = imovel ? ` · ${imovel.title}` : ` · imóvel não encontrado`

    linhas.push({
      mes: mesDe(data),
      data,
      descricao: `Comissão de venda${rotuloImovel}`,
      categoria: 'comissão de venda',
      tipo: termo.direction,
      valor,
      contraparte: termo.contraparte_nome || null,
      property_id: termo.property_id ?? null,
      property_title: imovel?.title ?? null,
      origem: 'taxa',
    })
  }

  // ================================================================
  // 3. LANÇAMENTOS — o que a equipe digitou
  // ================================================================
  //
  // O valor entra cheio. Se a taxa daquele lançamento foi registrada como
  // lançamento separado, ela já está aqui e somar as duas a dobraria.

  for (const lancamento of lancamentos) {
    const valor = Number(lancamento.amount) || 0
    const mes = mesDe(lancamento.entry_date)
    if (valor <= 0 || !mes) continue

    linhas.push({
      mes,
      data: lancamento.entry_date,
      descricao: lancamento.description,
      categoria: lancamento.category,
      tipo: lancamento.type,
      valor: centavos(valor),
      origem: 'lancamento',
    })
  }

  // Mais recente primeiro — o movimento do mês é o que se procura.
  return linhas.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
}

/** Agrupa por mês, do mais antigo para o mais novo. */
export function agruparPorMes(linhas: LinhaCaixa[]): MesCaixa[] {
  const porMes = new Map<string, LinhaCaixa[]>()

  for (const linha of linhas) {
    if (!linha.mes) continue
    const lista = porMes.get(linha.mes) || []
    lista.push(linha)
    porMes.set(linha.mes, lista)
  }

  return Array.from(porMes.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([mes, doMes]) => {
      const receitas = centavos(doMes.filter((l) => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0))
      const despesas = centavos(doMes.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0))
      return { mes, receitas, despesas, saldo: centavos(receitas - despesas), linhas: doMes }
    })
}

export function resumoCaixa(meses: MesCaixa[]) {
  const receitas = centavos(meses.reduce((s, m) => s + m.receitas, 0))
  const despesas = centavos(meses.reduce((s, m) => s + m.despesas, 0))
  return { receitas, despesas, saldo: centavos(receitas - despesas) }
}

export { formatBRL }
