/**
 * Lançamentos financeiros: receitas e despesas avulsas.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ISTO EXISTE AO LADO DO RELATÓRIO DE REPASSE
 * ---------------------------------------------------------------------------
 *
 * O relatório de repasse é calculado: o que o locatário pagou menos a taxa de
 * administração, o que sobra para o dono. Ninguém digita nada ali, e é
 * exatamente por isso que ele não serve para o resto do caixa.
 *
 * Uma taxa de cadastro cobrada do locatário, um conserto de encanamento, o
 * IPTU, a multa de atraso — nada disso vem de pagamento nem de taxa
 * cadastrada em fee_terms. Sem um lugar para lançar, a equipe anota no papel ou
 * no observações do contrato, e o caixa nunca fecha.
 *
 * ---------------------------------------------------------------------------
 * A DIREÇÃO É DIGITADA AQUI, AO CONTRÁRIO DE fee_terms
 * ---------------------------------------------------------------------------
 *
 * Em fee_terms a direção (receita/despesa) é calculada pelo banco a partir de
 * quem é o dono do imóvel, e não há como errar o sinal. Aqui é o contrário: o
 * lançamento é o que a equipe diz que é. Uma despesa da imobiliária não tem
 * como ser derivada de uma regra — ela é digitada, e a categoria é o que dá
 * contexto para o relatório de caixa fechar.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NÃO HÁ DASHBOARD SEPARADO
 * ---------------------------------------------------------------------------
 *
 * Lançamento é o registro cru: data, tipo, valor, descrição. O relatório de
 * repasse é o que se faz com esses números. Misturar os dois numa tela só
 * esconderia justamente o que a tela precisa deixar claro — que uma coisa é
 * digitada e a outra é deduzida.
 */

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, FileText, Plus, Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useCreateEntity, useDeleteEntity, useUpdateEntity } from '@/hooks/useSupabase'
import { formatCurrencyInput, formatDateBR, parseCurrencyInput } from '@/lib/inputMasks'
import { formatBRL } from '@/lib/repasse'
import type { Lease, Profile, Property, Sale } from '@/types'

type FinancialEntryType = 'receita' | 'despesa'

/** O que a entrada pode estar ligada a. O vínculo é opcional (entrada avulsa). */
type RelatedType = 'lease' | 'property' | 'sale' | 'client'

interface FinancialEntry {
  id: string
  org_id: string
  type: FinancialEntryType
  description: string
  amount: number
  entry_date: string
  paid_at: string | null
  related_type: RelatedType | null
  related_id: string | null
  category: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

const ENTRY_TYPES: { value: FinancialEntryType; label: string; icon: typeof TrendingUp }[] = [
  { value: 'receita', label: 'Receita', icon: TrendingUp },
  { value: 'despesa', label: 'Despesa', icon: TrendingDown },
]

/**
 * Categorias livres — não há enum no banco.
 *
 * O campo `category` é TEXT, não ENUM: a lista de coisas que uma imobiliária
 * gasta varia por região e por tipo de operação (quem só administra locação
 * não tem "avaliação de venda"). Um ENUM forçaria o banco a recusar
 * categorias legítimas. A lista abaixo é só sugestão para o autocomplete.
 */
const CATEGORIAS_SUGERIDAS = [
  'taxa de cadastro',
  'multa',
  'manutenção',
  'imposto',
  'condomínio',
  'seguro',
  'reparo',
  'avaliação',
  'honorário',
  'diversos',
]

const RELATED_LABELS: Record<RelatedType, string> = {
  lease: 'Contrato de locação',
  property: 'Imóvel',
  sale: 'Venda',
  client: 'Cliente',
}

interface LancamentosTabProps {
  properties: Property[]
  leases: Lease[]
  sales: Sale[]
  profiles: Profile[]
}

export function LancamentosTab({ properties, leases, sales, profiles }: LancamentosTabProps) {
  const { create } = useCreateEntity('financial_entries')
  const { update } = useUpdateEntity('financial_entries')
  const { remove } = useDeleteEntity('financial_entries')

  const [entries, setEntries] = React.useState<FinancialEntry[]>([])
  const [carregando, setCarregando] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)
  const [erroSalvar, setErroSalvar] = React.useState<string | null>(null)

  const [modalAberto, setModalAberto] = React.useState(false)
  const [editando, setEditando] = React.useState<FinancialEntry | null>(null)
  const [salvando, setSalvando] = React.useState(false)
  const [form, setForm] = React.useState<Partial<FinancialEntry>>({})

  // Filtros da lista
  const [filtroTipo, setFiltroTipo] = React.useState<'' | FinancialEntryType>('')
  const [filtroCategoria, setFiltroCategoria] = React.useState('')
  const [busca, setBusca] = React.useState('')

  // ============================================================
  // CARREGAMENTO
  // ============================================================

  const carregar = React.useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { data, error } = await supabase
        .from('financial_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .limit(500)

      if (error) throw new Error(error.message)
      setEntries((data as FinancialEntry[]) || [])
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
  // FILTROS
  // ============================================================

  const filtradas = React.useMemo(() => {
    return entries.filter((e) => {
      const porTipo = !filtroTipo || e.type === filtroTipo
      const porCategoria = !filtroCategoria || e.category === filtroCategoria
      const termo = busca.trim().toLowerCase()
      const porBusca =
        !termo ||
        e.description.toLowerCase().includes(termo) ||
        (e.category || '').toLowerCase().includes(termo) ||
        (e.observacoes || '').toLowerCase().includes(termo)
      return porTipo && porCategoria && porBusca
    })
  }, [entries, filtroTipo, filtroCategoria, busca])

  const totais = React.useMemo(() => {
    const receitas = filtradas.filter((e) => e.type === 'receita').reduce((s, e) => s + Number(e.amount), 0)
    const despesas = filtradas.filter((e) => e.type === 'despesa').reduce((s, e) => s + Number(e.amount), 0)
    return { receitas, despesas, saldo: receitas - despesas }
  }, [filtradas])

  // Categorias que existem nos lançamentos carregados (filtro dinâmico)
  const categoriasExistentes = React.useMemo(() => {
    const set = new Set<string>()
    for (const e of entries) if (e.category) set.add(e.category)
    return Array.from(set).sort()
  }, [entries])

  // ============================================================
  // NOME DO VÍNCULO
  // ============================================================

  const nomeDoVinculo = React.useCallback(
    (e: FinancialEntry): string => {
      if (!e.related_type || !e.related_id) return '—'
      switch (e.related_type) {
        case 'property':
          return properties.find((p) => p.id === e.related_id)?.title || 'Imóvel removido'
        case 'lease': {
          const lease = leases.find((l) => l.id === e.related_id)
          if (!lease) return 'Contrato removido'
          const prop = properties.find((p) => p.id === lease.property_id)
          return prop ? `Contrato · ${prop.title}` : 'Contrato'
        }
        case 'sale': {
          const sale = sales.find((s) => s.id === e.related_id)
          if (!sale) return 'Venda removida'
          const prop = properties.find((p) => p.id === sale.property_id)
          return prop ? `Venda · ${prop.title}` : 'Venda'
        }
        case 'client':
          return profiles.find((p) => p.id === e.related_id)?.full_name || 'Cliente removido'
        default:
          return '—'
      }
    },
    [properties, leases, sales, profiles],
  )

  // ============================================================
  // FORMULÁRIO
  // ============================================================

  const abrirNovo = () => {
    setEditando(null)
    setErroSalvar(null)
    setForm({
      type: 'despesa',
      description: '',
      amount: 0,
      entry_date: new Date().toISOString().split('T')[0],
      related_type: null,
      related_id: null,
      category: '',
      observacoes: '',
    })
    setModalAberto(true)
  }

  const abrirEdicao = (e: FinancialEntry) => {
    setEditando(e)
    setErroSalvar(null)
    setForm({ ...e })
    setModalAberto(true)
  }

  const salvar = async () => {
    setErroSalvar(null)

    if (!form.description?.trim()) {
      setErroSalvar('Informe a descrição do lançamento.')
      return
    }
    if (!form.entry_date) {
      setErroSalvar('Informe a data do lançamento.')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setErroSalvar('Informe um valor maior que zero.')
      return
    }

    setSalvando(true)
    try {
      const payload: Record<string, unknown> = {
        type: form.type || 'despesa',
        description: form.description.trim(),
        amount: Number(form.amount),
        entry_date: form.entry_date,
        related_type: form.related_type || null,
        related_id: form.related_type ? form.related_id || null : null,
        category: form.category?.trim() || null,
        observacoes: form.observacoes?.trim() || null,
      }

      if (editando) {
        const { error } = await update(editando.id, payload)
        if (error) throw error
      } else {
        const { error } = await create(payload)
        if (error) throw error
      }

      setModalAberto(false)
      await carregar()
    } catch (e) {
      setErroSalvar((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (e: FinancialEntry) => {
    if (!window.confirm(`Excluir o lançamento "${e.description}"?`)) return
    try {
      const { error } = await remove(e.id)
      if (error) throw error
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-medium text-primary">Lançamentos</h2>
          <p className="text-muted-foreground">
            Receitas e despesas avulsas — taxa de cadastro, manutenção, imposto, multa.
            O que <strong>não</strong> vem de aluguel nem de comissão.
          </p>
        </div>
        <Button onClick={abrirNovo} className="gap-2 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white">
          <Plus className="h-4 w-4" />
          Novo lançamento
        </Button>
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/30 flex items-start gap-3 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-emerald-600">{formatBRL(totais.receitas)}</p>
                <p className="text-xs text-muted-foreground">Receitas no filtro</p>
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
                <p className="text-xs text-muted-foreground">Despesas no filtro</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className={`text-2xl font-semibold ${totais.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatBRL(totais.saldo)}
                </p>
                <p className="text-xs text-muted-foreground">Saldo do filtro</p>
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
              <Label className="text-sm">Buscar</Label>
              <Input
                placeholder="Descrição, categoria, observações..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Tipo</Label>
              <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as '' | FinancialEntryType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {ENTRY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Categoria</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {categoriasExistentes.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      {carregando ? (
        <div className="text-center py-12 text-muted-foreground">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p>Carregando lançamentos…</p>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">
            {entries.length === 0 ? 'Nenhum lançamento registrado ainda.' : 'Nenhum lançamento com esses filtros.'}
          </p>
          <p className="text-sm mt-1">
            {entries.length === 0
              ? 'Taxa de cadastro, manutenção, IPTU, multa — lance aqui o que não vem de aluguel.'
              : 'Ajuste os filtros ou busque outro termo.'}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Categoria</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Vínculo</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((e) => (
                    <tr key={e.id} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="py-2 px-3 whitespace-nowrap">{formatDateBR(e.entry_date)}</td>
                      <td className="py-2 px-3">
                        <div className="font-medium">{e.description}</div>
                        {e.observacoes && <div className="text-xs text-muted-foreground mt-0.5">{e.observacoes}</div>}
                      </td>
                      <td className="py-2 px-3">
                        {e.category ? (
                          <span className="text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground">
                            {e.category}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {e.related_type ? (
                          <>
                            <div className="font-medium text-foreground">
                              {RELATED_LABELS[e.related_type]}
                            </div>
                            <div>{nomeDoVinculo(e)}</div>
                          </>
                        ) : (
                          'Avulso'
                        )}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-medium whitespace-nowrap ${
                          e.type === 'receita' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {e.type === 'receita' ? '+' : '−'}
                        {formatBRL(Number(e.amount))}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirEdicao(e)}
                            className="text-muted-foreground hover:text-primary transition-transform hover:scale-110 active:scale-95"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => excluir(e)}
                            className="text-muted-foreground hover:text-destructive transition-transform hover:scale-110 active:scale-95"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {filtradas.length} de {entries.length} lançamentos
              </span>
              <span className="font-medium">
                Saldo:{' '}
                <span className={totais.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {formatBRL(totais.saldo)}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de criação/edição */}
      <Modal
        open={modalAberto}
        onOpenChange={setModalAberto}
        title={editando ? 'Editar lançamento' : 'Novo lançamento'}
        description="Receitas e despesas que não vêm de aluguel nem de comissão de venda."
        size="xl"
        footer={{
          cancelLabel: 'Cancelar',
          saveLabel: editando ? 'Salvar alterações' : 'Salvar lançamento',
          saveDisabled: salvando,
          onSave: salvar,
        }}
      >
        {erroSalvar && (
          <div className="mb-4 p-3 rounded-sm bg-destructive/10 border border-destructive/30 flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{erroSalvar}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Tipo */}
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select
              value={form.type || 'despesa'}
              onValueChange={(v) => setForm({ ...form, type: v as FinancialEntryType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ENTRY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              O sinal é o que você digita — diferente da taxa de administração, que o banco deduz.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Descrição */}
            <div className="space-y-1 sm:col-span-2">
              <Label>Descrição *</Label>
              <Input
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex.: taxa de cadastro do locatário, conserto de encanamento, IPTU"
                required
              />
            </div>

            {/* Valor */}
            <div className="space-y-1">
              <Label>Valor (R$) *</Label>
              <Input
                value={formatCurrencyInput(form.amount)}
                onChange={(e) => setForm({ ...form, amount: parseCurrencyInput(e.target.value) })}
                placeholder="0,00"
                inputMode="decimal"
                required
              />
            </div>

            {/* Data */}
            <div className="space-y-1">
              <Label>Data *</Label>
              <Input
                type="date"
                value={form.entry_date || ''}
                onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                required
              />
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input
                value={form.category || ''}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex.: manutenção, imposto"
                list="categorias-lancamentos"
              />
              <datalist id="categorias-lancamentos">
                {CATEGORIAS_SUGERIDAS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Tipo de vínculo */}
            <div className="space-y-1">
              <Label>Vínculo</Label>
              <Select
                value={form.related_type || 'nenhum'}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    related_type: v === 'nenhum' ? null : (v as RelatedType),
                    related_id: null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Avulso (sem vínculo)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Avulso (sem vínculo)</SelectItem>
                  <SelectItem value="lease">Contrato de locação</SelectItem>
                  <SelectItem value="property">Imóvel</SelectItem>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selection do vínculo */}
          {form.related_type && (
            <div className="space-y-1">
              <Label>{RELATED_LABELS[form.related_type]}</Label>
              <Select
                value={form.related_id || ''}
                onValueChange={(v) => setForm({ ...form, related_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {form.related_type === 'property' &&
                    properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  {form.related_type === 'lease' &&
                    leases.map((l) => {
                      const prop = properties.find((p) => p.id === l.property_id)
                      return (
                        <SelectItem key={l.id} value={l.id}>
                          {prop ? prop.title : `Contrato ${l.id.slice(0, 8)}`}
                        </SelectItem>
                      )
                    })}
                  {form.related_type === 'sale' &&
                    sales.map((s) => {
                      const prop = properties.find((p) => p.id === s.property_id)
                      return (
                        <SelectItem key={s.id} value={s.id}>
                          {prop ? prop.title : `Venda ${s.id.slice(0, 8)}`}
                        </SelectItem>
                      )
                    })}
                  {form.related_type === 'client' &&
                    profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes || ''}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Detalhes sobre o lançamento"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
