/**
 * Taxas, comissões e repasse.
 *
 * Toda a conta morre aqui — em um lugar só, com regra explícita — em vez de
 * espalhada pelo financeiro, pelo modal e pelo contrato, onde as cópias
 * divergiriam. Nenhum valor é digitado: sempre sai de fee_terms.
 *
 * ---------------------------------------------------------------------------
 * POR QUE UMA TABELA, E NÃO COLUNAS NO IMÓVEL
 * ---------------------------------------------------------------------------
 *
 * O modelo anterior guardava a taxa em duas colunas de properties
 * (gestao_tipo e taxa_terceirizacao_percent) e só cobria locação. Venda não
 * tinha onde registrar taxa nenhuma.
 *
 * Uma taxa precisa de quatro coisas que a coluna do imóvel não guarda:
 *
 *   base        — sobre o que incide: aluguel, preço de venda, valor fixo
 *   contraparte — quem recebe: pessoa da org, outra org, ou nome avulso
 *   direção     — é receita da org ou despesa dela
 *   vigência    — de quando a quando
 *
 * ---------------------------------------------------------------------------
 * A DIREÇÃO: DESPESA SÓ QUANDO A ORG DONA DO IMÓVEL
 * ---------------------------------------------------------------------------
 *
 * Três papéis do dono que também opera o sistema:
 *
 *   propria_sem_intermediario
 *     O locatário paga para você e você recebe tudo.
 *     Aluguel 2.000, taxa 0%  ->  você recebe 2.000
 *
 *   propria_com_terceirizacao
 *     É SEU imóvel, mas outra imobiliária administra e fica com uma taxa.
 *     Aluguel 2.000, taxa 5%   ->  a imobiliária retém 100, você recebe 1.900
 *     Aqui a taxa é um CUSTO: sai do seu bolso.
 *
 *   locacao_direta
 *     Locação particular, sem sistema no meio.
 *
 * E o caso invertido, que é o que faltava:
 *
 *   Imóvel de CLIENTE, sua org é a corretora
 *     A taxa de administração é RECEBIMENTO da sua org, não despesa.
 *     Cada org registra só o próprio lado — não há transferência interna.
 *
 * Por isso a direção é calculada e não digitada: ela sai de o imóvel ser ou
 * não da própria org, e o banco corrige num trigger. Se fosse coluna comum,
 * alguém marcaria 'despesa' numa taxa que é receita e o relatório mostraria o
 * número com o sinal trocado — sem erro nenhum, só o valor errado.
 *
 * ---------------------------------------------------------------------------
 * A TAXA INCIDE SOBRE O QUE FOI PAGO
 * ---------------------------------------------------------------------------
 *
 * Não sobre o aluguel cheio. Se o aluguel de janeiro vence dia 10 e só é pago
 * dia 20, a taxa de janeiro só sai com ele: no relatório de dia 15 a taxa não
 * existe, porque o dinheiro também não. Pagar taxa sobre aluguel que não
 * entrou é descontar do caixa uma despesa que ainda não existe.
 */

import type { GestaoTipo, OrigemContrato } from '@/types'

export type { GestaoTipo, OrigemContrato }

/** Como a taxa foi combinada. */
export type FeeKind = 'administracao' | 'comissao_venda' | 'outra'

/** Sobre o que a taxa incide. */
export type FeeBase = 'percentual' | 'valor_fixo'

/** Em qual tipo de evento a taxa aparece. */
export type FeeIncideEm = 'locacao' | 'venda' | 'ambos'

export interface FeeTerm {
  id: string
  property_id: string
  lease_id?: string | null
  sale_id?: string | null
  kind: FeeKind
  incide_em: FeeIncideEm
  base: FeeBase
  percentual?: number | null
  valor_fixo?: number | null
  contraparte_profile_id?: string | null
  contraparte_org_id?: string | null
  contraparte_nome?: string | null
  starts_on?: string | null
  ends_on?: string | null
  repasse_paid_at?: string | null
  /** Preenchido pelo trigger do banco. Não enviar da tela. */
  direction?: 'receita' | 'despesa' | null
}

export const FEE_KIND_LABELS: Record<FeeKind, string> = {
  administracao: 'Taxa de administração',
  comissao_venda: 'Comissão de venda',
  outra: 'Outra taxa',
}

export const FEE_KIND_DESCRICOES: Record<FeeKind, string> = {
  administracao: 'Retida sobre o aluguel por quem administra o imóvel.',
  comissao_venda: 'Sobre o preço de venda. O credor pode ser a administradora ou quem conduziu a venda.',
  outra: 'Avaliação, divulgação, campanha. Você informa a base.',
}

export const GESTAO_LABELS: Record<GestaoTipo, string> = {
  propria_sem_intermediario: 'Próprio, sem intermediário',
  propria_com_terceirizacao: 'Próprio, com imobiliária administrando',
  locacao_direta: 'Locação particular',
}

/**
 * Explicação de cada papel do dono-operador.
 *
 * Reexportado porque a aba Gestão do imóvel usa isto ao lado dos campos
 * legados; quando os campos saírem, os textos ficam aqui com o resto do
 * cálculo.
 */
export const GESTAO_DESCRICOES: Record<GestaoTipo, string> = {
  propria_sem_intermediario:
    'O locatário paga para você e você recebe o aluguel inteiro.',
  propria_com_terceirizacao:
    'Outra imobiliária administra o seu imóvel e retém uma taxa de administração.',
  locacao_direta:
    'Aluguel combinado direto com o locatário, sem intermediação.',
}

const centavos = (valor: number) => Math.round(valor * 100) / 100

/**
 * Valor de uma taxa sobre uma base.
 *
 * `percentual` é sobre a base; `valor_fixo` não depende dela. Uma taxa fixa de
 * R$ 300 em janeiro não muda com o aluguel, e forçar a mesma conta nas duas
 * formas obrigaria a mentir em uma delas.
 */
export function calcularTaxa(base: FeeTerm['base'], valorBase: number, percentual: number | null | undefined, valorFixo: number | null | undefined): number {
  if (base === 'valor_fixo') return centavos(Number(valorFixo) || 0)
  const pct = Number(percentual)
  if (!Number.isFinite(pct)) return 0
  return centavos((Number(valorBase) || 0) * (pct / 100))
}

// ---------------------------------------------------------------------------
// LOCAÇÃO
// ---------------------------------------------------------------------------

export interface RepasseLocacao {
  /** Aluguel cheio do contrato. */
  brutoContrato: number
  /** Quanto o locatário efetivamente pagou no período. */
  brutoPago: number
  /** Soma das taxas que incidem sobre o que foi pago. */
  taxas: number
  /** Despesa da org (dono que terceiriza). */
  despesas: number
  /** Receita da org (corretora que administra imóvel de cliente). */
  receitas: number
  /** O que sobra para o dono do imóvel: pago menos taxa de administração. */
  liquido: number
  /** As taxas que compuseram este resultado. */
  termos: FeeTermCalculado[]
}

export interface FeeTermCalculado extends FeeTerm {
  /** Valor da taxa sobre a base do período. */
  valor: number
  /** Base sobre a qual a taxa foi calculada. */
  baseValor: number
  /** Título do imóvel, para exibição no relatório. */
  property_title?: string
}

/**
 * Repasse de um contrato num período.
 *
 * `pagoNoPeriodo` é a soma dos pagamentos com status 'pago' dentro do período —
 * é ela que a taxa incide, e não `monthlyRent`. Passar o aluguel cheio aqui
 * reintroduziria a taxa sobre dinheiro que não entrou.
 */
export function calcularRepasseLocacao({
  monthlyRent,
  pagoNoPeriodo,
  termos,
}: {
  monthlyRent: number
  pagoNoPeriodo: number
  termos: FeeTerm[]
}): RepasseLocacao {
  const calculados: FeeTermCalculado[] = termos
    .filter((t) => t.incide_em === 'locacao' || t.incide_em === 'ambos')
    .map((t) => ({
      ...t,
      baseValor: centavos(pagoNoPeriodo),
      valor: calcularTaxa(t.base, pagoNoPeriodo, t.percentual, t.valor_fixo),
    }))

  // Só taxa de administração entra no repasse ao dono. Comissão de venda e
  // taxa fixa de campanha não reduzem o que o locatário pagou ao dono — são
  // outros débitos, em outro relatório.
  const taxaAdministracao = centavos(
    calculados.filter((t) => t.kind === 'administracao').reduce((s, t) => s + t.valor, 0),
  )

  const despesas = centavos(
    calculados.filter((t) => t.direction === 'despesa').reduce((s, t) => s + t.valor, 0),
  )
  const receitas = centavos(
    calculados.filter((t) => t.direction === 'receita').reduce((s, t) => s + t.valor, 0),
  )

  return {
    brutoContrato: centavos(monthlyRent),
    brutoPago: centavos(pagoNoPeriodo),
    taxas: taxaAdministracao,
    despesas,
    receitas,
    // A subtração, não um segundo cálculo: assim as duas partes somam
    // exatamente o que foi pago, sem sobra nem falta de centavo.
    liquido: centavos(pagoNoPeriodo - taxaAdministracao),
    termos: calculados,
  }
}

// ---------------------------------------------------------------------------
// VENDA
// ---------------------------------------------------------------------------

export interface ComissaoVenda {
  /** Preço de venda. */
  preco: number
  /** Soma das comissões sobre a venda. */
  comissoes: number
  /** Comissão que é despesa da org (a org vendeu imóvel que é seu). */
  despesas: number
  /** Comissão que é receita da org (a org vendeu imóvel de cliente). */
  receitas: number
  /** Preço menos o que é despesa — o que o vendedor da org leva. */
  liquido: number
  termos: FeeTermCalculado[]
}

/**
 * Comissão de uma venda.
 *
 * Quem é credor é chose na tela (a administradora do imóvel ou quem conduziu
 * a venda — muitas vezes gente diferente), então o cálculo não tenta deduzir:
 * ele lê `direction`, que o banco já resolveu.
 */
export function calcularComissaoVenda({
  preco,
  termos,
}: {
  preco: number
  termos: FeeTerm[]
}): ComissaoVenda {
  const aplicaveis = termos.filter((t) => t.incide_em === 'venda' || t.incide_em === 'ambos')

  const calculados: FeeTermCalculado[] = aplicaveis.map((t) => ({
    ...t,
    baseValor: centavos(preco),
    valor: calcularTaxa(t.base, preco, t.percentual, t.valor_fixo),
  }))

  const despesas = centavos(
    calculados.filter((t) => t.direction === 'despesa').reduce((s, t) => s + t.valor, 0),
  )
  const receitas = centavos(
    calculados.filter((t) => t.direction === 'receita').reduce((s, t) => s + t.valor, 0),
  )

  return {
    preco: centavos(preco),
    comissoes: centavos(calculados.reduce((s, t) => s + t.valor, 0)),
    despesas,
    receitas,
    liquido: centavos(preco - despesas),
    termos: calculados,
  }
}

// ---------------------------------------------------------------------------
// AJUDA
// ---------------------------------------------------------------------------

/**
 * Quem é o credor, em texto.
 *
 * A contraparte pode ser pessoa da org, outra org do Domus, ou alguém de fora
 * do sistema — e o relatório precisa dizer qual, sem abrir três caminhos de
 * leitura.
 */
export function contraparteNome(
  termo: Pick<FeeTerm, 'contraparte_nome' | 'contraparte_org_id' | 'contraparte_profile_id'>,
  nomes: { perfis: Map<string, string>; orgs: Map<string, string> },
): string {
  if (termo.contraparte_nome) return termo.contraparte_nome
  if (termo.contraparte_org_id) {
    return nomes.orgs.get(termo.contraparte_org_id) ?? 'Outra imobiliária'
  }
  if (termo.contraparte_profile_id) {
    return nomes.perfis.get(termo.contraparte_profile_id) ?? 'Pessoa da equipe'
  }
  return 'A definir'
}

/** O termo está valendo nesta data? */
export function vigenteEm(termo: FeeTerm, data: Date): boolean {
  if (termo.starts_on && data < new Date(termo.starts_on + 'T00:00:00')) return false
  if (termo.ends_on && data > new Date(termo.ends_on + 'T23:59:59')) return false
  return true
}

export function formatBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}
