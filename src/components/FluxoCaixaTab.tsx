/**
 * Fluxo de caixa — a quarta aba do Financeiro.
 *
 * O relatório de repasse diz, por contrato, quanto o dono recebe. Esta tela diz,
 * por mês, quanto entrou na conta da imobiliária, quanto saiu e o que sobrou.
 * A diferença não é de formato: uma despesa de manutenção não pertence a
 * contrato nenhum, e o relatório de repasse, que é por contrato, não tem onde
 * colocá-la.
 *
 * O cálculo mora em src/lib/caixa.ts, não aqui. Esta tela só mostra.
 */

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, TrendingUp, TrendingDown, Wallet, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useLeases, usePayments, useProperties, useSales } from '@/hooks/useSupabase'
import {
  agruparPorMes,
  formatBRL,
  montarFluxoCaixa,
  resumoCaixa,
  rotularMes,
  type LancamentoCaixa,
  type LinhaCaixa,
} from '@/lib/caixa'
import type { FeeTerm } from '@/lib/repasse'

/** Rótulo da origem — diz o que é deduzido e o que foi digitado. */
const ORIGEM_LABELS: Record<LinhaCaixa['origem'], string> = {
  pagamento: 'Aluguel',
  taxa: 'Taxa',
  lancamento: 'Lançamento',
}

export function FluxoCaixaTab() {
  const { data: pagamentos } = usePayments()
  const { data: leases } = useLeases()
  const { data: properties } = useProperties()
  const { data: sales } = useSales()

  const [termos, setTermos] = React.useState<FeeTerm[]>([])
  const [lancamentos, setLancamentos] = React.useState<LancamentoCaixa[]>([])
  const [carregando, setCarregando] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const [de, setDe] = React.useState(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1).toISOString().slice(0, 10)
  })
  const [ate, setAte] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [tipoFiltro, setTipoFiltro] = React.useState('')
  const [mesAberto, setMesAberto] = React.useState<string | null>(null)

  const carregar = React.useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [{ data: termosDb, error: e1 }, { data: lancDb, error: e2 }] = await Promise.all([
        supabase.from('fee_terms').select('*'),
        supabase
          .from('financial_entries')
          .select('id, type, description, amount, entry_date, category')
          .order('entry_date', { ascending: false })
          .limit(2000),
      ])

      if (e1) throw new Error(e1.message)
      if (e2) throw new Error(e2.message)

      setTermos((termosDb || []) as FeeTerm[])
      setLancamentos((lancDb || []) as LancamentoCaixa[])
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  // ============================================================
  // CÁLCULO
  // ============================================================

  const meses = React.useMemo(() => {
    const todas = montarFluxoCaixa({
      pagamentos: pagamentos || [],
      leases: leases || [],
      properties: properties || [],
      sales: sales || [],
      termos,
      lancamentos,
    })

    const noPeriodo = todas.filter((l) => l.data >= de && l.data <= ate)
    const filtradas = tipoFiltro ? noPeriodo.filter((l) => l.tipo === tipoFiltro) : noPeriodo

    return agruparPorMes(filtradas)
  }, [pagamentos, leases, properties, sales, termos, lancamentos, de, ate, tipoFiltro])

  const totais = React.useMemo(() => resumoCaixa(meses), [meses])

  // O mês mais recente é o que se procura primeiro.
  const ultimoMes = meses.length > 0 ? meses[meses.length - 1] : null

  React.useEffect(() => {
    if (ultimoMes && mesAberto === null) setMesAberto(ultimoMes.mes)
  }, [ultimoMes, mesAberto])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-medium text-primary">Fluxo de Caixa</h2>
          <p className="text-muted-foreground">
            O que entrou e o que saiu da imobiliária, mês a mês — aluguel, taxas e os
            lançamentos do caixa.
          </p>
        </div>
        <Button variant="outline" onClick={carregar} disabled={carregando}>
          {carregando ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/30 flex items-start gap-3 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {/* Totais do período */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-emerald-600">{formatBRL(totais.receitas)}</p>
                <p className="text-xs text-muted-foreground">Entrou no período</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-red-600">{formatBRL(totais.despesas)}</p>
                <p className="text-xs text-muted-foreground">Saiu no período</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className={`text-2xl font-semibold ${totais.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatBRL(totais.saldo)}
                </p>
                <p className="text-xs text-muted-foreground">Saldo do período</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-sm">De</Label>
              <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Até</Label>
              <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Tipo</Label>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Receitas e despesas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Receitas e despesas</SelectItem>
                  <SelectItem value="receita">Só receitas</SelectItem>
                  <SelectItem value="despesa">Só despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {carregando ? (
        <div className="text-center py-12 text-muted-foreground">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p>Montando o fluxo de caixa…</p>
        </div>
      ) : meses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Nenhum movimento no período.</p>
          <p className="text-sm mt-1">
            Ajuste as datas, ou registre pagamentos e lançamentos para o caixa aparecer.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {meses
            .slice()
            .reverse()
            .map((mes) => {
              const aberto = mesAberto === mes.mes
              return (
                <Card key={mes.mes}>
                  <button
                    type="button"
                    onClick={() => setMesAberto(aberto ? null : mes.mes)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {aberto ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-serif font-medium text-lg">{rotularMes(mes.mes)}</p>
                        <p className="text-xs text-muted-foreground">{mes.linhas.length} movimentos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-emerald-600 font-medium">+{formatBRL(mes.receitas)}</p>
                        <p className="text-xs text-muted-foreground">entradas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-medium">−{formatBRL(mes.despesas)}</p>
                        <p className="text-xs text-muted-foreground">saídas</p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className={`font-semibold ${mes.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatBRL(mes.saldo)}
                        </p>
                        <p className="text-xs text-muted-foreground">saldo</p>
                      </div>
                    </div>
                  </button>

                  {aberto && (
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Data</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Descrição</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Origem</th>
                              <th className="text-right py-2 px-3 font-medium text-muted-foreground">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mes.linhas.map((linha, i) => (
                              <tr key={`${linha.data}-${i}`} className="border-b border-border/40">
                                <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">
                                  {linha.data.slice(8, 10)}/{linha.data.slice(5, 7)}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-medium">{linha.descricao}</div>
                                  {linha.contraparte && (
                                    <div className="text-xs text-muted-foreground">para {linha.contraparte}</div>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground">
                                    {ORIGEM_LABELS[linha.origem]}
                                  </span>
                                </td>
                                <td
                                  className={`py-2 px-3 text-right font-medium whitespace-nowrap ${
                                    linha.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'
                                  }`}
                                >
                                  {linha.tipo === 'receita' ? '+' : '−'}
                                  {formatBRL(linha.valor)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )
}
