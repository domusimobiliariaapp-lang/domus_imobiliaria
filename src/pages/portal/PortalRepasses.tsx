/**
 * Repasse ao proprietário.
 *
 * ---------------------------------------------------------------------------
 * PARA QUEM É ESTA TELA
 * ---------------------------------------------------------------------------
 *
 * O locatário tem a tela de Pagamentos: ele quer saber quanto deve e o que já
 * pagou. O proprietário tem uma pergunta diferente, que não tem tela nenhuma:
 * quanto do meu aluguel a imobiliária já me repassou, e quanto ainda está
 * comigo dela.
 *
 * Um mesmo login pode ser os dois. O painel de repasse lista os dois conjuntos
 * ao mesmo tempo, e cada linha diz de que lado ela está — porque a diferença
 * aparece no dinheiro, não na conta.
 *
 * ---------------------------------------------------------------------------
 * O QUE É CALCULADO E O QUE É LIDO
 * ---------------------------------------------------------------------------
 *
 * A taxa vem de fee_terms, e é calculada sobre o que foi de fato pago no mês.
 * O que é lido, nunca digitado, é o repasse_amount e o repasse_paid_at que a
 * equipe de dentro registra quando confirma que o dinheiro saiu. A tela mostra
 * os dois lados porque o dono precisa saber quanto recebeu e quanto ainda tem a
 * receber — um número só não responde à pergunta.
 *
 * Quando repasse_modelo = 'direto' o locatário pagava direto ao proprietário, e
 * a imobiliária nunca recebeu esse dinheiro. A linha aparece com o total cheio
 * e sem a linha de repasse, porque não houve repasse a fazer.
 */

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  Wallet,
  Home,
  CheckCircle2,
  Clock,
  Calculator,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { calcularTaxa, formatBRL } from '@/lib/repasse'
import type { FeeTerm } from '@/lib/repasse'
import { formatDateBR } from '@/lib/inputMasks'
import { rotularMes } from '@/lib/caixa'

/** Uma linha do extrato de um imóvel. */
interface LinhaRepasse {
  id: string
  imovelId: string
  imovelTitulo: string
  data: string
  mes: string
  descricao: string
  /** Sempre positivo; o sinal está em `tipo`. */
  valor: number
  tipo: 'receita' | 'despesa'
  pago: boolean
}

const centavos = (n: number) => Math.round(n * 100) / 100

export function PortalRepasses() {
  const { user } = useAuth()

  const [linhas, setLinhas] = React.useState<LinhaRepasse[]>([])
  const [carregando, setCarregando] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)
  /**
   * Quantos contratos meu a tela não conseguiu exibir porque o imóvel não veio
   * na consulta. A tela explica isso em vez de mostrar um vazio sem causa.
   */
  const [imoveisIncompletos, setImoveisIncompletos] = React.useState(0)

  const carregar = React.useCallback(async () => {
    if (!user) return
    setCarregando(true)
    setErro(null)
    try {
      // Cada consulta vem filtrada pelo próprio auth.uid(). A RLS é o filtro
      // real — ler tudo e descartar no browser mostraria o nome de outro
      // proprietário por um instante antes de a lista sumir.
      const [
        { data: imoveis, error: erroImoveis },
        { data: contratos, error: erroContratos },
        { data: pagamentos, error: erroPagamentos },
        { data: taxas, error: erroTaxas },
      ] = await Promise.all([
        supabase.from('properties').select('id, title, owner_id'),
        supabase.from('leases').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('fee_terms').select('*'),
      ])

      const erro = erroImoveis || erroContratos || erroPagamentos || erroTaxas
      if (erro) throw new Error(erro.message)

      const meusImoveis = (imoveis || []).filter((p) => p.owner_id === user.id)
      const imoveisPorId = new Map(meusImoveis.map((p) => [p.id, p]))
      const meuId = user.id

      // Só os contratos onde EU sou o proprietário. Um contrato onde sou
      // locatário entra em outra tela — a de pagamentos.
      const meusContratos = (contratos || []).filter((l) => l.landlord_id === meuId)

      const resultado: LinhaRepasse[] = []
      // Contrato meu cujo imóvel NÃO veio na consulta. Isso acontece quando a
      // RLS não devolveu a linha: a policy "Owners can view own properties"
      // só passa imóvel com owner_id = auth.uid(), e um contrato pode ter
      // landlord_id = eu com o imóvel ainda sem owner_id preenchido (imóvel
      // cadastrado antes de a tela de proprietário existir).
      //
      // Antes, esse `continue` descartava o contrato em silêncio e a tela
      // mostrava "nenhum imóvel sob sua gestão" — que é uma explicação
      // errada, e a mais difícil de diagnosticar justamente porque a tela
      // não distingue "não tenho imóveis" de "o cadastro do imóvel está
      // incompleto".
      const contratosSemImovelVisivel: string[] = []

      for (const contrato of meusContratos) {
        const imovel = imoveisPorId.get(contrato.property_id)
        if (!imovel) {
          contratosSemImovelVisivel.push(contrato.property_id)
          continue
        }

        // As taxas de ESTE contrato, com a base já reduzida pelo que foi pago.
        const taxasDoContrato = ((taxas || []) as FeeTerm[]).filter(
          (t) => t.lease_id === contrato.id && t.kind === 'administracao',
        )

        const pagos = (pagamentos || []).filter(
          (p) => p.lease_id === contrato.id && p.status === 'pago',
        )

        for (const pagamento of pagos) {
          const data = pagamento.paid_date || pagamento.due_date
          const bruto = Number(pagamento.amount) || 0
          if (bruto <= 0 || !data) continue

          const taxaTotal = centavos(
            taxasDoContrato.reduce(
              (s, t) => s + calcularTaxa(t.base, bruto, t.percentual, t.valor_fixo),
              0,
            ),
          )
          const liquido = centavos(bruto - taxaTotal)

          // Repasse direto: o dinheiro foi do locatário para o proprietário, e a
          // imobiliária não participated. Não há taxa nem repasse a mostrar.
          if (contrato.repasse_modelo === 'direto') {
            resultado.push({
              id: `${imovel.id}-${pagamento.id}`,
              imovelId: imovel.id,
              imovelTitulo: imovel.title,
              data,
              mes: data.slice(0, 7),
              descricao: 'Aluguel recebido direto do locatário',
              valor: bruto,
              tipo: 'receita',
              pago: true,
            })
            continue
          }

          // O repasse confirmado é o que a equipe registrou. Sem ele, a linha
          // fica pendente: o dinheiro pode ter sido pago sem alguém marcar, e
          // dizer "recebido" sem registro seria afirmar o que não se sabe.
          const pago = Boolean(pagamento.repasse_paid_at)

          resultado.push({
            id: `${imovel.id}-${pagamento.id}-repasse`,
            imovelId: imovel.id,
            imovelTitulo: imovel.title,
            data: pagamento.repasse_paid_at || data,
            mes: data.slice(0, 7),
            descricao: 'Repasse do aluguel',
            valor: liquido,
            tipo: 'receita',
            pago,
          })

          if (taxaTotal > 0) {
            resultado.push({
              id: `${imovel.id}-${pagamento.id}-taxa`,
              imovelId: imovel.id,
              imovelTitulo: imovel.title,
              data: pagamento.repasse_paid_at || data,
              mes: data.slice(0, 7),
              descricao: 'Taxa de administração da imobiliária',
              valor: taxaTotal,
              tipo: 'despesa',
              pago,
            })
          }
        }
      }

      // Mais recente primeiro.
      setLinhas(resultado.sort((a, b) => (a.data < b.data ? 1 : -1)))
      setImoveisIncompletos(contratosSemImovelVisivel.length)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [user])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  const totais = React.useMemo(() => {
    const recebido = linhas
      .filter((l) => l.tipo === 'receita' && l.pago)
      .reduce((s, l) => s + l.valor, 0)
    const aReceber = linhas
      .filter((l) => l.tipo === 'receita' && !l.pago)
      .reduce((s, l) => s + l.valor, 0)
    const taxas = linhas
      .filter((l) => l.tipo === 'despesa')
      .reduce((s, l) => s + l.valor, 0)
    return { recebido, aReceber, taxas }
  }, [linhas])

  const porImovel = React.useMemo(() => {
    const mapa = new Map<string, { titulo: string; recebido: number; aReceber: number; taxas: number }>()
    for (const l of linhas) {
      const atual = mapa.get(l.imovelId) || { titulo: l.imovelTitulo, recebido: 0, aReceber: 0, taxas: 0 }
      if (l.tipo === 'receita') {
        if (l.pago) atual.recebido = centavos(atual.recebido + l.valor)
        else atual.aReceber = centavos(atual.aReceber + l.valor)
      } else {
        atual.taxas = centavos(atual.taxas + l.valor)
      }
      mapa.set(l.imovelId, atual)
    }
    return Array.from(mapa.entries())
  }, [linhas])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-medium text-primary">Repasses</h1>
        <p className="text-muted-foreground mt-1">
          O que a imobiliária já repassou dos seus imóveis, e o que está pendente
        </p>
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {erro}
        </div>
      )}

      {imoveisIncompletos > 0 && (
        <div className="p-4 rounded-md bg-yellow-500/10 border border-yellow-600/30 text-sm">
          <p className="font-medium text-yellow-800 dark:text-yellow-200">
            {imoveisIncompletos === 1
              ? 'Há 1 contrato seu cujo imóvel ainda não tem proprietário definido.'
              : `Há ${imoveisIncompletos} contratos seus cujos imóveis ainda não têm proprietário definido.`}
          </p>
          <p className="text-muted-foreground mt-1">
            Por isso o repasse deles não aparece abaixo. Peça à imobiliária para
            abrir o cadastro do imóvel e informar o proprietário — o repasse só
            fica visível aqui depois disso.
          </p>
        </div>
      )}

      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : porImovel.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Nenhum imóvel sob sua gestão aqui.</p>
          <p className="text-sm mt-1">
            Quando a imobiliária cadastrar um imóvel com o seu nome como proprietário,
            o extrato de repasse aparece nesta tela.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-emerald-600">
                      {formatBRL(totais.recebido)}
                    </p>
                    <p className="text-xs text-muted-foreground">Já repassado a você</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-yellow-700">
                      {formatBRL(totais.aReceber)}
                    </p>
                    <p className="text-xs text-muted-foreground">A receber</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-muted-foreground">
                      {formatBRL(totais.taxas)}
                    </p>
                    <p className="text-xs text-muted-foreground">Taxas de administração</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {porImovel.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  Por imóvel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Imóvel</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Recebido</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">A receber</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Taxas</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Líquido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {porImovel.map(([id, v]) => (
                        <tr key={id} className="border-b border-border/40">
                          <td className="py-2 px-3 font-medium">{v.titulo}</td>
                          <td className="py-2 px-3 text-right text-emerald-600">{formatBRL(v.recebido)}</td>
                          <td className="py-2 px-3 text-right text-yellow-700">
                            {v.aReceber > 0 ? formatBRL(v.aReceber) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right text-muted-foreground">
                            {v.taxas > 0 ? formatBRL(v.taxas) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {formatBRL(centavos(v.recebido - v.taxas))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Extrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Data</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Imóvel</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Movimento</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">Situação</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr key={l.id} className="border-b border-border/40">
                        <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">
                          {formatDateBR(l.data)}
                        </td>
                        <td className="py-2 px-3">{l.imovelTitulo}</td>
                        <td className="py-2 px-3">
                          <div className="text-xs text-muted-foreground">{rotularMes(l.mes)}</div>
                          <div className="font-medium">{l.descricao}</div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {l.pago ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-600/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Recebido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-700 border-yellow-700/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-medium whitespace-nowrap ${
                            l.tipo === 'receita' ? 'text-emerald-600' : 'text-muted-foreground'
                          }`}
                        >
                          {l.tipo === 'receita' ? '+' : '−'}
                          {formatBRL(l.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                A linha "pendente" é um aluguel que o locatário já pagou e que a
                imobiliária ainda não registrou como repassado. Se o repasse está
                atrasado, fale com o administrador da imobiliária.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
