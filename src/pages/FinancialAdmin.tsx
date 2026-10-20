import { CRUDPage } from '@/components/CRUDPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DollarSign, AlertCircle, TrendingUp, TrendingDown, Clock, FileText, Calculator, Wallet } from 'lucide-react'
import { usePayments, useUpdateEntity, useProperties, useLeases, useSales, useProfiles } from '@/hooks/useSupabase'
import { supabase } from '@/integrations/supabase/client'
import type { Payment, Lease, Profile } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import * as React from 'react'
import {
  calcularRepasseLocacao,
  calcularComissaoVenda,
  formatBRL,
  type RepasseLocacao,
  type ComissaoVenda,
} from '@/lib/repasse'
import { LancamentosTab } from '@/components/LancamentosTab'
import { FluxoCaixaTab } from '@/components/FluxoCaixaTab'

type PaymentStatus = Payment['status']

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'atrasado', label: 'Atrasado' },
]

const FILTER_STATUS = PAYMENT_STATUSES

// Os lançamentos financeiros (receitas e despesas avulsas) têm tela e tipos
// próprios, em components/LancamentosTab.tsx — financial_entries não se parece
// com um pagamento, e misturar as duas coisas aqui só sobreporia o CRUDPage.

export function FinancialAdmin() {
  const { data: payments, error, refetch } = usePayments()
  const { data: properties } = useProperties()
  const { data: leases } = useLeases()
  const { data: sales } = useSales()
  const { data: profiles } = useProfiles()
  const { update } = useUpdateEntity('payments')

  const [activeTab, setActiveTab] = React.useState('lancamentos')

  // Calculate stats for payments tab
  const stats = React.useMemo(() => {
    const pending = payments?.filter(p => p.status === 'pendente') || []
    const collected = payments?.filter(p => p.status === 'pago') || []
    const overdue = payments?.filter(p => p.status === 'atrasado') || []

    return {
      totalPending: pending.reduce((sum, p) => sum + Number(p.amount), 0),
      totalCollected: collected.reduce((sum, p) => sum + Number(p.amount), 0),
      totalOverdue: overdue.reduce((sum, p) => sum + Number(p.amount), 0),
      pendingCount: pending.length,
      collectedCount: collected.length,
      overdueCount: overdue.length,
    }
  }, [payments])

  // ============================================================
  // REPASSE REPORT
  // ============================================================
  //
  // O relatório de repasse faz o seguinte:
  // 1. Busca todos os pagamentos com status 'pago' do mês (ou período selecionado)
  // 2. Agrupa por contrato (lease) e imóvel
  // 3. Para cada imóvel, lê os fee_terms de locação (fee_terms.lease_id = lease.id)
  // 4. Calcula o repasse: bruto = soma dos pagamentos do mês, taxa = soma das taxas de
  //    administração sobre o que foi pago, líquido = bruto - taxa
  // 5. Para vendas, lê fee_terms.sale_id e calcula a comissão sobre o preço
  //
  // A taxa incide sobre o que foi PAGO no período, não sobre o aluguel cheio.
  // Se o aluguel vence dia 10 e só é pago dia 20, a taxa de janeiro só existe
  // quando o dinheiro entra. Pagar taxa sobre aluguel que não entrou é descontar
  // do caixa uma despesa que ainda não existe.

  const [repasseData, setRepasseData] = React.useState<{
    locacao: RepasseLocacao[]
    venda: ComissaoVenda[]
    carregando: boolean
    erro: string | null
  }>({
    locacao: [],
    venda: [],
    carregando: false,
    erro: null,
  })

  const [periodoRepasse, setPeriodoRepasse] = React.useState<{ inicio: string; fim: string }>({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0],
  })

  const buscarRepasse = React.useCallback(async () => {
    setRepasseData(prev => ({ ...prev, carregando: true, erro: null }))

    try {
      // 1. Pagamentos pagos no período
      const { data: pagamentos, error: pagamentosError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pago')
        .gte('paid_date', periodoRepasse.inicio)
        .lte('paid_date', periodoRepasse.fim)
        .order('paid_date', { ascending: false })

      if (pagamentosError) throw pagamentosError

      // 2. Agrupar por lease_id
      const porLease = new Map<string, typeof pagamentos>()
      for (const p of pagamentos || []) {
        const arr = porLease.get(p.lease_id) || []
        arr.push(p)
        porLease.set(p.lease_id, arr)
      }

      // 3. Buscar fee_terms de locação (incide_em = 'locacao' ou 'ambos')
      const { data: termosLocacao, error: termosLocacaoError } = await supabase
        .from('fee_terms')
        .select('*')
        .in('incide_em', ['locacao', 'ambos'])
        .eq('kind', 'administracao')

      if (termosLocacaoError) throw termosLocacaoError

      // 4. Buscar fee_terms de venda (incide_em = 'venda' ou 'ambos')
      const { data: termosVenda, error: termosVendaError } = await supabase
        .from('fee_terms')
        .select('*')
        .in('incide_em', ['venda', 'ambos'])
        .eq('kind', 'comissao_venda')

      if (termosVendaError) throw termosVendaError

      // 5. Calcular repasse por locação
      const locacaoResultados: RepasseLocacao[] = []

      for (const [leaseId, pagamentosLease] of porLease) {
        const lease = leases?.find(l => l.id === leaseId)
        if (!lease) continue

        const property = properties?.find(p => p.id === lease.property_id)
        if (!property) continue

        const brutoPago = pagamentosLease.reduce((sum, p) => sum + Number(p.amount), 0)
        if (brutoPago === 0) continue

        // Filtrar termos deste lease
        const termosDesteLease = (termosLocacao || []).filter(t =>
          t.lease_id === leaseId && t.kind === 'administracao'
        )

        const repasse = calcularRepasseLocacao({
          monthlyRent: Number(lease.monthly_rent) || 0,
          pagoNoPeriodo: brutoPago,
          termos: termosDesteLease,
        })

        locacaoResultados.push({
          ...repasse,
          termos: repasse.termos.map(t => ({ ...t, lease_id: leaseId, property_id: property.id, property_title: property.title })),
        })
      }

      // 6. Calcular comissão por venda
      const vendaResultados: ComissaoVenda[] = []

      for (const venda of sales || []) {
        const property = properties?.find(p => p.id === venda.property_id)
        if (!property) continue

        const preco = Number(venda.price) || 0
        if (preco === 0) continue

        const termosDestaVenda = (termosVenda || []).filter(t =>
          t.sale_id === venda.id && t.kind === 'comissao_venda'
        )

        if (termosDestaVenda.length === 0) continue

        const comissao = calcularComissaoVenda({
          preco,
          termos: termosDestaVenda,
        })

        vendaResultados.push({
          ...comissao,
          termos: comissao.termos.map(t => ({ ...t, sale_id: venda.id, property_id: property.id, property_title: property.title })),
        })
      }

      setRepasseData({
        locacao: locacaoResultados,
        venda: vendaResultados,
        carregando: false,
        erro: null,
      })
    } catch (e) {
      setRepasseData(prev => ({
        ...prev,
        carregando: false,
        erro: (e as Error).message,
      }))
    }
  }, [periodoRepasse, properties, leases, sales])

  React.useEffect(() => {
    buscarRepasse()
  }, [buscarRepasse])

  // ============================================================
  // PAGAMENTOS TAB LOGIC
  // ============================================================

  const handleUpdate = async (id: string, data: Partial<Payment>) => {
    const { data: result, error } = await update(id, data)
    if (error) throw error
    return result
  }

  const handleMarkAsPaid = async (payment: Payment) => {
    await handleUpdate(payment.id, {
      status: 'pago',
      paid_date: new Date().toISOString().split('T')[0],
    })
    await refetch()
    buscarRepasse() // Atualiza o relatório também
  }

  const columns: Array<{ key: string; header: string; render: (p: Payment & { lease?: Lease; tenant?: Profile }) => React.ReactNode }> = [
    {
      key: 'lease',
      header: 'Contrato',
      render: (p: any) => <span className="font-medium">{p.lease ? `#${p.lease.id.slice(0, 8)}` : 'N/A'}</span>
    },
    {
      key: 'tenant',
      header: 'Inquilino',
      render: (p: any) => <span>{p.tenant?.full_name || 'N/A'}</span>
    },
    {
      key: 'amount',
      header: 'Valor (R$)',
      render: (p: Payment) => <span className="font-medium">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
      </span>
    },
    {
      key: 'due_date',
      header: 'Vencimento',
      render: (p: Payment) => new Date(p.due_date).toLocaleDateString('pt-BR')
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Payment) => <StatusBadge type="payment" value={p.status} />,
    },
  ]

  const handleCreate = async () => {
    return {} as Payment
  }

  const handleDelete = async () => {
    return Promise.resolve()
  }

  const renderForm = (_props: {
    item: Payment | null
    formData: Partial<Payment>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Payment>>>
    saving: boolean
    isEditing: boolean
  }) => {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Pagamentos são gerados automaticamente a partir dos contratos de locação.</p>
        <p className="text-sm mt-2">Utilize o botão "Marcar como Pago" para registrar o recebimento.</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center gap-4 text-destructive bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Erro ao carregar pagamentos</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="lancamentos">
            <FileText className="h-4 w-4 mr-2" />
            Lançamentos
          </TabsTrigger>
          <TabsTrigger value="pagamentos">
            <DollarSign className="h-4 w-4 mr-2" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="caixa">
            <Wallet className="h-4 w-4 mr-2" />
            Fluxo de Caixa
          </TabsTrigger>
          <TabsTrigger value="repasse">
            <Calculator className="h-4 w-4 mr-2" />
            Relatório de Repasse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagamentos" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{stats.pendingCount}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-yellow-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPending)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{stats.collectedCount}</p>
                    <p className="text-xs text-muted-foreground">Recebidos</p>
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCollected)}
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
                    <p className="text-2xl font-semibold">{stats.overdueCount}</p>
                    <p className="text-xs text-muted-foreground">Atrasados</p>
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-red-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalOverdue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(
                        stats.totalCollected + stats.totalPending
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Total previsto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payments Table */}
          <CRUDPage<Payment & { lease?: Lease; tenant?: Profile }>
            title="Pagamentos"
            subtitle="Gerencie os pagamentos de aluguéis"
            columns={columns}
            fetchData={async () => {
              const { data: lista, error: erro } = await supabase
                .from('payments')
                .select('*')
                .order('due_date', { ascending: false })
              if (erro) throw new Error(erro.message)

              const [{ data: contratos }, { data: pessoas }] = await Promise.all([
                supabase.from('leases').select('id, property_id, monthly_rent'),
                supabase.from('profiles').select('id, full_name'),
              ])

              return (lista || []).map((pagamento) => ({
                ...pagamento,
                lease: contratos?.find((l) => l.id === pagamento.lease_id),
                tenant: pessoas?.find((p) => p.id === pagamento.tenant_id),
              }))
            }}
            createItem={handleCreate}
            updateItem={handleUpdate}
            deleteItem={handleDelete}
            getItemId={(p) => p.id}
            filters={{
              status: FILTER_STATUS,
            }}
            renderForm={renderForm}
            formSize="lg"
            emptyStateIcon={
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            }
            emptyStateMessage="Nenhum pagamento registrado"
            renderActions={(item: any) => (
              <div className="flex items-center gap-1">
                {item.status !== 'pago' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMarkAsPaid(item)}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    title="Marcar como Pago"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </Button>
                )}
              </div>
            )}
          />
        </TabsContent>

        {/* ============================================================
            ABA DE REPASSE
            ============================================================ */}
        <TabsContent value="repasse" className="space-y-6">
          {/* Header do relatório */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-serif font-medium text-primary">Relatório de Repasse</h2>
              <p className="text-muted-foreground">
                O que entrou, o que é taxa de administração, o que sobra.
                A taxa incide sobre o que foi <strong>pago</strong> no período —
                não sobre o aluguel cheio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm">De</Label>
                <Input
                  type="date"
                  value={periodoRepasse.inicio}
                  onChange={e => setPeriodoRepasse(prev => ({ ...prev, inicio: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Até</Label>
                <Input
                  type="date"
                  value={periodoRepasse.fim}
                  onChange={e => setPeriodoRepasse(prev => ({ ...prev, fim: e.target.value }))}
                />
              </div>
              <Button
                variant="outline"
                onClick={buscarRepasse}
                disabled={repasseData.carregando}
              >
                {repasseData.carregando ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Atualizando…
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Atualizar
                  </>
                )}
              </Button>
            </div>
          </div>

          {repasseData.erro && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/30 flex items-start gap-3 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{repasseData.erro}</span>
            </div>
          )}

          {/* Resumo do período */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {formatBRL(repasseData.locacao.reduce((s, r) => s + r.brutoPago, 0) + repasseData.venda.reduce((s, c) => s + c.preco, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Total recebido</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {formatBRL(repasseData.locacao.reduce((s, r) => s + r.taxas, 0) + repasseData.venda.reduce((s, c) => s + c.comissoes, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Total de taxas/comissões</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {formatBRL(repasseData.locacao.reduce((s, r) => s + r.liquido, 0) + repasseData.venda.reduce((s, c) => s + c.liquido, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Líquido para proprietários</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {formatBRL(repasseData.locacao.reduce((s, r) => s + r.despesas, 0) + repasseData.venda.reduce((s, c) => s + c.despesas, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Despesa (dono-operador)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Locação */}
          {repasseData.locacao.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif font-medium text-lg text-primary mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Locação (Repasse ao Proprietário)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Imóvel</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Contrato</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Recebido no período</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Taxa admin.</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Líquido</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Despesa</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Receita</th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground">Repasse pago?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repasseData.locacao.map((r) => (
                        <tr key={r.termos[0]?.lease_id} className="border-b border-border/40">
                          <td className="py-2 px-3 font-medium">{r.termos[0]?.property_id || '—'}</td>
                          <td className="py-2 px-3 font-mono text-xs">{r.termos[0]?.lease_id?.slice(0, 8) || '—'}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatBRL(r.brutoPago)}</td>
                          <td className="py-2 px-3 text-right text-yellow-600">{formatBRL(r.taxas)}</td>
                          <td className="py-2 px-3 text-right font-medium text-emerald-600">{formatBRL(r.liquido)}</td>
                          <td className="py-2 px-3 text-right text-red-600">{formatBRL(r.despesas)}</td>
                          <td className="py-2 px-3 text-right text-blue-600">{formatBRL(r.receitas)}</td>
                          <td className="py-2 px-3 text-center">
                            {r.termos.some(t => t.repasse_paid_at) ? (
                              <span className="text-xs text-emerald-600">Sim</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Não</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Venda */}
          {repasseData.venda.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif font-medium text-lg text-primary mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Venda (Comissão)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Imóvel</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Venda</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Preço</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Comissão</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Líquido vendedor</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Despesa</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Receita</th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground">Comissão paga?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repasseData.venda.map((c) => (
                        <tr key={c.termos[0]?.sale_id} className="border-b border-border/40">
                          <td className="py-2 px-3 font-medium">{c.termos[0]?.property_id || '—'}</td>
                          <td className="py-2 px-3 font-mono text-xs">{c.termos[0]?.sale_id?.slice(0, 8) || '—'}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatBRL(c.preco)}</td>
                          <td className="py-2 px-3 text-right text-yellow-600">{formatBRL(c.comissoes)}</td>
                          <td className="py-2 px-3 text-right font-medium text-emerald-600">{formatBRL(c.liquido)}</td>
                          <td className="py-2 px-3 text-right text-red-600">{formatBRL(c.despesas)}</td>
                          <td className="py-2 px-3 text-right text-blue-600">{formatBRL(c.receitas)}</td>
                          <td className="py-2 px-3 text-center">
                            {c.termos.some(t => t.repasse_paid_at) ? (
                              <span className="text-xs text-emerald-600">Sim</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Não</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {repasseData.locacao.length === 0 && repasseData.venda.length === 0 && !repasseData.carregando && (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhum repasse no período selecionado.</p>
              <p className="text-sm mt-1">Ajuste as datas ou registre pagamentos e taxas.</p>
            </div>
          )}

          {repasseData.carregando && (
            <div className="text-center py-12 text-muted-foreground">
              <svg className="animate-spin h-8 w-8 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p>Calculando repasses…</p>
            </div>
          )}
        </TabsContent>

        {/* ============================================================
            ABA DE LANÇAMENTOS FINANCEIROS
            ============================================================ */}
        <TabsContent value="lancamentos" className="space-y-6">
          <LancamentosTab
            properties={properties || []}
            leases={leases || []}
            sales={sales || []}
            profiles={profiles || []}
          />
        </TabsContent>

        {/* ============================================================
            ABA DE FLUXO DE CAIXA
            ============================================================
            O relatório de repasse é por contrato; este é por mês, e junta o que
            não pertence a contrato nenhum — IPTU, multa, taxa de cadastro. */}
        <TabsContent value="caixa" className="space-y-6">
          <FluxoCaixaTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}