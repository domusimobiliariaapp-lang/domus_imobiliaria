import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Calendar,
  PieChart,
  Percent,
  RefreshCw
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts'
import { supabase } from '@/integrations/supabase/client'
import { usePayments, useSales } from '@/hooks/useSupabase'
import { formatBRL } from '@/lib/repasse'

interface DreMonthSummary {
  mesAno: string
  labelMes: string
  receitaTaxaLocacao: number
  receitaComissaoVenda: number
  outrasReceitas: number
  receitaBruta: number
  deducoesTaxas: number
  receitaLiquida: number
  despesasOperacionais: number
  lucroLiquido: number
  margemLucro: number
}

export function DreGerencialTab() {
  const { data: payments } = usePayments()
  const { data: sales } = useSales()

  const [ano, setAno] = React.useState<number>(new Date().getFullYear())
  const [carregando, setCarregando] = React.useState(true)
  const [lancamentosAvulsos, setLancamentosAvulsos] = React.useState<any[]>([])
  const [feeTerms, setFeeTerms] = React.useState<any[]>([])

  const carregarDadosComplementares = React.useCallback(async () => {
    setCarregando(true)
    try {
      const [entriesRes, termsRes] = await Promise.all([
        supabase
          .from('financial_entries')
          .select('*')
          .gte('entry_date', `${ano}-01-01`)
          .lte('entry_date', `${ano}-12-31`),
        supabase.from('fee_terms').select('*'),
      ])

      setLancamentosAvulsos(entriesRes.data || [])
      setFeeTerms(termsRes.data || [])
    } catch (err) {
      console.error('Erro ao buscar dados DRE:', err)
    } finally {
      setCarregando(false)
    }
  }, [ano])

  React.useEffect(() => {
    void carregarDadosComplementares()
  }, [carregarDadosComplementares])

  // Consolidação mensal do DRE
  const dreMensal = React.useMemo<DreMonthSummary[]>(() => {
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]

    return meses.map((nomeMes, index) => {
      const mesStr = String(index + 1).padStart(2, '0')
      const mesAno = `${ano}-${mesStr}`

      // 1. Taxa de Administração de Locação sobre os pagamentos 'pago' do mês
      const pagamentosMes = (payments || []).filter((p) => {
        const dataReferencia = p.paid_date || p.due_date
        return p.status === 'pago' && dataReferencia && dataReferencia.startsWith(mesAno)
      })

      let receitaTaxaLocacao = 0
      pagamentosMes.forEach((p) => {
        const termo = feeTerms.find((t) => t.lease_id === p.lease_id && t.transaction_type === 'locacao')
        const valorPago = Number(p.amount) || 0
        if (termo && termo.percentage) {
          receitaTaxaLocacao += (valorPago * Number(termo.percentage)) / 100
        } else {
          // Padrão de mercado de 10% de taxa de gestão se não customizado
          receitaTaxaLocacao += valorPago * 0.1
        }
      })

      // 2. Comissões de Vendas concluídas no mês
      const vendasMes = (sales || []).filter((s) => {
        const dataVenda = s.contract_date || s.created_at
        return dataVenda && dataVenda.startsWith(mesAno)
      })

      let receitaComissaoVenda = 0
      vendasMes.forEach((s) => {
        const termo = feeTerms.find((t) => t.sale_id === s.id && t.transaction_type === 'venda')
        const preco = Number(s.price) || 0
        if (termo && termo.percentage) {
          receitaComissaoVenda += (preco * Number(termo.percentage)) / 100
        } else {
          receitaComissaoVenda += preco * 0.05 // 5% padrão de corretagem
        }
      })

      // 3. Lançamentos avulsos de receitas (financial_entries do tipo 'receita')
      const entradasAvulsas = lancamentosAvulsos.filter(
        (e) => e.entry_type === 'receita' && e.entry_date && e.entry_date.startsWith(mesAno)
      )
      const outrasReceitas = entradasAvulsas.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

      const receitaBruta = receitaTaxaLocacao + receitaComissaoVenda + outrasReceitas

      // 4. Deduções (tarifas bancárias e estornos): média estimada de 1.8% sobre a receita bruta
      const deducoesTaxas = pagamentosMes.length * 2.5 // R$ 2,50 por boleto/PIX liquidado

      const receitaLiquida = Math.max(0, receitaBruta - deducoesTaxas)

      // 5. Despesas Operacionais (financial_entries do tipo 'despesa')
      const despesasMes = lancamentosAvulsos.filter(
        (e) => e.entry_type === 'despesa' && e.entry_date && e.entry_date.startsWith(mesAno)
      )
      const despesasOperacionais = despesasMes.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

      // 6. Resultado Líquido
      const lucroLiquido = receitaLiquida - despesasOperacionais
      const margemLucro = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0

      return {
        mesAno,
        labelMes: nomeMes,
        receitaTaxaLocacao,
        receitaComissaoVenda,
        outrasReceitas,
        receitaBruta,
        deducoesTaxas,
        receitaLiquida,
        despesasOperacionais,
        lucroLiquido,
        margemLucro,
      }
    })
  }, [ano, payments, sales, feeTerms, lancamentosAvulsos])

  // Totais Acumulados do Ano
  const totaisAno = React.useMemo(() => {
    return dreMensal.reduce(
      (acc, m) => {
        acc.receitaTaxaLocacao += m.receitaTaxaLocacao
        acc.receitaComissaoVenda += m.receitaComissaoVenda
        acc.outrasReceitas += m.outrasReceitas
        acc.receitaBruta += m.receitaBruta
        acc.deducoesTaxas += m.deducoesTaxas
        acc.receitaLiquida += m.receitaLiquida
        acc.despesasOperacionais += m.despesasOperacionais
        acc.lucroLiquido += m.lucroLiquido
        return acc
      },
      {
        receitaTaxaLocacao: 0,
        receitaComissaoVenda: 0,
        outrasReceitas: 0,
        receitaBruta: 0,
        deducoesTaxas: 0,
        receitaLiquida: 0,
        despesasOperacionais: 0,
        lucroLiquido: 0,
      }
    )
  }, [dreMensal])

  const margemAnual =
    totaisAno.receitaLiquida > 0 ? (totaisAno.lucroLiquido / totaisAno.receitaLiquida) * 100 : 0

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da DRE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20 mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Demonstração do Resultado do Exercício</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">DRE Gerencial Consolidado</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visão contábil e operacional: o faturamento real da imobiliária descontando repasses e apurando a margem líquida.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Ano:</span>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={carregarDadosComplementares}
            disabled={carregando}
            className="h-9 px-3 rounded-xl border-border text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 px-3 rounded-xl border-border text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo Gerencial do Ano */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase font-mono">Receita Bruta Total</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif font-bold text-foreground mt-2">{formatBRL(totaisAno.receitaBruta)}</p>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>Locação: {formatBRL(totaisAno.receitaTaxaLocacao)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase font-mono">Receita Líquida (ROL)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatBRL(totaisAno.receitaLiquida)}
            </p>
            <div className="text-[11px] text-muted-foreground mt-1">
              Deduções bancárias: -{formatBRL(totaisAno.deducoesTaxas)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase font-mono">Despesas Operacionais</span>
              <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif font-bold text-red-600 dark:text-red-400 mt-2">
              {formatBRL(totaisAno.despesasOperacionais)}
            </p>
            <div className="text-[11px] text-muted-foreground mt-1">Custos fixos & variáveis</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs bg-[#AD7B3B]/5 border-[#AD7B3B]/30">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#AD7B3B] uppercase font-mono font-semibold">Resultado Líquido</span>
              <div className="w-8 h-8 rounded-xl bg-[#AD7B3B]/20 text-[#AD7B3B] flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif font-bold text-[#AD7B3B] mt-2">
              {formatBRL(totaisAno.lucroLiquido)}
            </p>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              <span>Margem Líquida Anual:</span>
              <span className={margemAnual >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {margemAnual.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo Mensal */}
      <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border bg-card/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#AD7B3B]" />
            <h3 className="text-sm font-semibold text-foreground">Evolução Mensal: Receita Líquida vs Despesas vs Lucro</h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">Exercício {ano}</span>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dreMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="labelMes" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatBRL(Number(value)), '']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 30, 36, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="receitaLiquida" name="Receita Líquida" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesasOperacionais" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucroLiquido" name="Lucro Líquido" fill="#AD7B3B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Estruturada Padrão DRE Contábil */}
      <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border bg-card/60 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Demonstração Consolidada Mês a Mês</h3>
          <span className="text-xs text-muted-foreground font-mono">Valores em R$ (Reais)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[10px] border-b border-border">
              <tr>
                <th className="py-3 px-4">Linha do DRE</th>
                {dreMensal.map((m) => (
                  <th key={m.mesAno} className="py-3 px-2.5 text-right font-medium">
                    {m.labelMes}
                  </th>
                ))}
                <th className="py-3 px-4 text-right font-bold text-foreground bg-[#AD7B3B]/10">TOTAL {ano}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {/* 1. Receita Bruta */}
              <tr className="font-semibold text-foreground bg-muted/10">
                <td className="py-2.5 px-4 font-mono uppercase text-[11px]">1. RECEITA OPERACIONAL BRUTA</td>
                {dreMensal.map((m) => (
                  <td key={m.mesAno} className="py-2.5 px-2.5 text-right">
                    {formatBRL(m.receitaBruta)}
                  </td>
                ))}
                <td className="py-2.5 px-4 text-right font-bold text-[#AD7B3B] bg-[#AD7B3B]/5">
                  {formatBRL(totaisAno.receitaBruta)}
                </td>
              </tr>
              <tr className="text-muted-foreground">
                <td className="py-2 px-4 pl-8">↳ Taxas de Administração de Locação</td>
                {dreMensal.map((m) => (
                  <td key={m.mesAno} className="py-2 px-2.5 text-right font-mono">
                    {formatBRL(m.receitaTaxaLocacao)}
                  </td>
                ))}
                <td className="py-2 px-4 text-right font-mono font-medium bg-[#AD7B3B]/5">
                  {formatBRL(totaisAno.receitaTaxaLocacao)}
                </td>
              </tr>
              <tr className="text-muted-foreground">
                <td className="py-2 px-4 pl-8">↳ Comissões de Intermediação de Vendas</td>
                {dreMensal.map((m) => (
                  <td key={m.mesAno} className="py-2 px-2.5 text-right font-mono">
                    {formatBRL(m.receitaComissaoVenda)}
                  </td>
                ))}
                <td className="py-2 px-4 text-right font-mono font-medium bg-[#AD7B3B]/5">
                  {formatBRL(totaisAno.receitaComissaoVenda)}
                </td>
              </tr>
              <tr className="text-muted-foreground">
                <td className="py-2 px-4 pl-8">↳ Outras Receitas Operacionais</td>
                {dreMensal.map((m) => (
                  <td key={m.mesAno} className="py-2 px-2.5 text-right font-mono">
                    {formatBRL(m.outrasReceitas)}
                  </td>
                ))}
                <td className="py-2 px-4 text-right font-mono font-medium bg-[#AD7B3B]/5">
                  {formatBRL(totaisAno.outrasReceitas)}
                </td>
              </tr>

              {/* 2. Deduções */}
              <tr className="text-red-600 dark:text-red-400">
                <td className="py-2.5 px-4 font-medium">2. (-) Deduções & Taxas Bancárias / PIX</td>
                {dreMensal.map((m) => (
                  <td key={m.mesAno} className="py-2.5 px-2.5 text-right font-mono">
                    -{formatBRL(m.deducoesTaxas)}
                  </td>
                ))}
                <td className="py-2.5 px-4 text-right font-mono font-semibold bg-[#AD7B3B]/5">
                  -{formatBRL(totaisAno.deducoesTaxas)}
                </td>
              </tr>

              {/* 3. Receita Líquida */}
              <tr className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                <td className="py-2.5 px-4 font-mono uppercase text-[11px]">3. (=) RECEITA OPERACIONAL LÍQUIDA (ROL)</td>
                {dreMensal.map((m) => (
                  <td key={m.mesAno} className="py-2.5 px-2.5 text-right font-mono">
                    {formatBRL(m.receitaLiquida)}
                  </td>
                ))}
                <td className="py-2.5 px-4 text-right font-mono font-bold bg-[#AD7B3B]/10">
                  {formatBRL(totaisAno.receitaLiquida)}
                </td>
              </tr>

              {/* 4. Despesas */}
              <tr className="text-red-600 dark:text-red-400">
                <td className="py-2.5 px-4 font-medium">4. (-) Despesas Operacionais (Fixas & Variáveis)</td>
                {dreMensal.map((m) => (
                  <td key={m.mesAno} className="py-2.5 px-2.5 text-right font-mono">
                    -{formatBRL(m.despesasOperacionais)}
                  </td>
                ))}
                <td className="py-2.5 px-4 text-right font-mono font-semibold bg-[#AD7B3B]/5">
                  -{formatBRL(totaisAno.despesasOperacionais)}
                </td>
              </tr>

              {/* 5. Lucro Líquido */}
              <tr className="font-bold text-foreground bg-[#AD7B3B]/10 border-t-2 border-border text-sm">
                <td className="py-3 px-4 font-serif">5. (=) RESULTADO LÍQUIDO DO EXERCÍCIO</td>
                {dreMensal.map((m) => (
                  <td
                    key={m.mesAno}
                    className={`py-3 px-2.5 text-right font-mono ${
                      m.lucroLiquido >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'
                    }`}
                  >
                    {formatBRL(m.lucroLiquido)}
                  </td>
                ))}
                <td
                  className={`py-3 px-4 text-right font-mono font-bold text-sm bg-[#AD7B3B]/20 ${
                    totaisAno.lucroLiquido >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600'
                  }`}
                >
                  {formatBRL(totaisAno.lucroLiquido)}
                </td>
              </tr>

              {/* 6. Margem Líquida */}
              <tr className="text-muted-foreground bg-muted/20 text-[11px]">
                <td className="py-2 px-4 font-medium">6. Margem Operacional Líquida (%)</td>
                {dreMensal.map((m) => (
                  <td
                    key={m.mesAno}
                    className={`py-2 px-2.5 text-right font-mono ${
                      m.margemLucro >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {m.margemLucro.toFixed(1)}%
                  </td>
                ))}
                <td className="py-2 px-4 text-right font-mono font-bold bg-[#AD7B3B]/10">
                  {margemAnual.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
