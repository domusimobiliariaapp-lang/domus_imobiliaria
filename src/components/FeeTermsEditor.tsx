import * as React from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Loader2, AlertCircle } from 'lucide-react'
import {
  type FeeTerm,
  FEE_KIND_LABELS,
  FEE_KIND_DESCRICOES,
  calcularTaxa,
  formatBRL,
} from '@/lib/repasse'
import { formatCurrencyInput, parseCurrencyInput, formatDecimal, parseDecimal } from '@/lib/inputMasks'

/**
 * Editor de taxas de um imóvel, contrato ou venda.
 *
 * Serve as três telas (imóvel, contrato e venda) porque uma taxa é a mesma
 * coisa nas três — muda só em qual evento ela incide. Se cada tela tivesse o
 * seu editor, a taxa do aluguel teria dois lugares para divergir.
 *
 * As linhas são salvas em fee_terms direto, e não no imóvel: é o que permite
 * que a mesma propriedade tenha uma taxa de administração no contrato e uma
 * comissão na venda, com contraparte e vigência diferentes cada uma.
 */

interface FeeTermsEditorProps {
  /** O que a taxa cobre. */
  propertyId: string | undefined
  leaseId?: string | null
  saleId?: string | null
  /** Restringe o que aparece: em contrato, só taxa de locação faz sentido. */
  somente?: 'locacao' | 'venda'
  /** Base para a prévia (aluguel cheio ou preço de venda). */
  valorBase: number
  /** Texto do valorBase, para a prévia. */
  rotuloBase: string
  /** Aviso sobre a direção da taxa, montado pelo chamador. */
  avisoDirecao?: React.ReactNode
  onChange?: () => void
}

const TIPOS_CONTRAPARTE = [
  { value: 'nenhum', label: 'Taxa da própria empresa' },
  { value: 'perfil', label: 'Pessoa da equipe' },
  { value: 'org', label: 'Outra imobiliária do Domus' },
  { value: 'nome', label: 'Imobiliária de fora do sistema' },
] as const

type TipoContraparte = (typeof TIPOS_CONTRAPARTE)[number]['value']

export function FeeTermsEditor({
  propertyId,
  leaseId = null,
  saleId = null,
  somente,
  valorBase,
  rotuloBase,
  avisoDirecao,
  onChange,
}: FeeTermsEditorProps) {
  const [termos, setTermos] = React.useState<FeeTerm[]>([])
  const [carregando, setCarregando] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)
  const [salvando, setSalvando] = React.useState<string | null>(null)
  const [orgs, setOrgs] = React.useState<{ id: string; name: string }[]>([])
  const [pessoas, setPessoas] = React.useState<{ id: string; full_name: string }[]>([])

  const buscar = React.useCallback(async () => {
    if (!propertyId) {
      setTermos([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      let consulta = supabase.from('fee_terms').select('*').eq('property_id', propertyId)
      if (somente === 'locacao') consulta = consulta.in('incide_em', ['locacao', 'ambos'])
      if (somente === 'venda') consulta = consulta.in('incide_em', ['venda', 'ambos'])

      const { data, error } = await consulta.order('created_at', { ascending: false })
      if (error) throw error
      setTermos((data || []) as FeeTerm[])
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [propertyId, somente])

  React.useEffect(() => {
    void buscar()
  }, [buscar])

  // Contrapartes: as duas listas vêm do que a própria org pode ver. A org_id
  // de outra imobiliária só aparece para quem já administra imóvel dela — a
  // RLS não expõe o cadastro alheio, e mesmo que expusesse, uma tela com todas
  // as imobiliárias do Domus seria ruído.
  React.useEffect(() => {
    const caregar = async () => {
      const [{ data: listaOrgs }, { data: listaPessoas }] = await Promise.all([
        supabase.from('organizations').select('id, name').eq('active', true),
        supabase.from('profiles').select('id, full_name').neq('role', 'cliente'),
      ])
      setOrgs(listaOrgs || [])
      setPessoas(listaPessoas || [])
    }
    void caregar()
  }, [])

  const salvar = async (termo: Partial<FeeTerm> & { id?: string }) => {
    const id = termo.id
    setSalvando(id || 'novo')
    setErro(null)
    try {
      if (id) {
        const { error } = await supabase.from('fee_terms').update(termo).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('fee_terms').insert({
          ...termo,
          property_id: propertyId,
          lease_id: leaseId,
          sale_id: saleId,
        } as never)
        if (error) throw error
      }
      await buscar()
      onChange?.()
    } catch (e) {
      const mensagem = (e as Error).message
      setErro(
        /row-level security/i.test(mensagem)
          ? 'Sua conta não tem permissão para alterar taxas.'
          : mensagem,
      )
    } finally {
      setSalvando(null)
    }
  }

  const remover = async (id: string) => {
    setSalvando(id)
    try {
      const { error } = await supabase.from('fee_terms').delete().eq('id', id)
      if (error) throw error
      await buscar()
      onChange?.()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(null)
    }
  }

  if (!propertyId) {
    return (
      <p className="text-sm text-muted-foreground">
        Escolha o imóvel para ver as taxas.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {carregando && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando taxas…
        </p>
      )}

      {erro && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {!carregando && termos.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma taxa registrada. Se outra imobiliária administra este imóvel e
          retém parte do aluguel, cadastre a taxa aqui.
        </p>
      )}

      {termos.map((termo) => (
        <TermoRow
          key={termo.id}
          termo={termo}
          valorBase={valorBase}
          rotuloBase={rotuloBase}
          orgs={orgs}
          pessoas={pessoas}
          somente={somente}
          salvando={salvando === termo.id}
          onChange={salvar}
          onRemove={remover}
        />
      ))}

      <NovaTermo
        incidePadrao={somente === 'venda' ? 'venda' : somente === 'locacao' ? 'locacao' : 'ambos'}
        orgs={orgs}
        pessoas={pessoas}
        salvando={salvando === 'novo'}
        onCreate={salvar}
      />

      {avisoDirecao && (
        <div className="p-3 rounded-md bg-muted/40 border border-border/40 text-xs text-muted-foreground">
          {avisoDirecao}
        </div>
      )}
    </div>
  )
}

function TermoRow({
  termo,
  valorBase,
  rotuloBase,
  orgs,
  pessoas,
  somente,
  salvando,
  onChange,
  onRemove,
}: {
  termo: FeeTerm
  valorBase: number
  rotuloBase: string
  orgs: { id: string; name: string }[]
  pessoas: { id: string; full_name: string }[]
  somente?: 'locacao' | 'venda'
  salvando: boolean
  onChange: (t: FeeTerm) => void
  onRemove: (id: string) => void
}) {
  const base = termo.base
  const valor = calcularTaxa(base, valorBase, termo.percentual, termo.valor_fixo)

  const tipoContraparte: TipoContraparte = termo.contraparte_nome
    ? 'nome'
    : termo.contraparte_org_id
      ? 'org'
      : termo.contraparte_profile_id
        ? 'perfil'
        : 'nenhum'

  return (
    <div className="p-3 rounded-md border border-border/50 bg-background space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{FEE_KIND_LABELS[termo.kind]}</p>
          <p className="text-xs text-muted-foreground">
            {FEE_KIND_DESCRICOES[termo.kind]}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(termo.id)}
            disabled={salvando}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title="Remover taxa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Valor</Label>
          <Select value={termo.base} onValueChange={(v) => onChange({ ...termo, base: v as FeeTerm['base'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentual">Percentual</SelectItem>
              <SelectItem value="valor_fixo">Valor fixo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>{base === 'percentual' ? 'Percentual' : 'Valor (R$)'}</Label>
          <Input
            value={
              base === 'percentual'
                ? formatDecimal(termo.percentual ?? '')
                : formatCurrencyInput(termo.valor_fixo ?? 0)
            }
            onChange={(e) =>
              base === 'percentual'
                ? onChange({ ...termo, percentual: parseDecimal(e.target.value) })
                : onChange({ ...termo, valor_fixo: parseCurrencyInput(e.target.value) })
            }
            onBlur={() => onChange(termo)}
            inputMode="decimal"
            placeholder={base === 'percentual' ? '5,00' : '0,00'}
          />
        </div>

        {!somente && (
          <div className="space-y-1">
            <Label>Incidência</Label>
            <Select value={termo.incide_em} onValueChange={(v) => onChange({ ...termo, incide_em: v as FeeTerm['incide_em'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="locacao">Locação</SelectItem>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="ambos">Locação e venda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label>Credor da taxa</Label>
        <Select
          value={tipoContraparte}
          onValueChange={(v) => {
            const tipo = v as TipoContraparte
            // Trocar o tipo limpa a contraparte anterior: senão o campo ficaria
            // com dois valores ao mesmo tempo, e o relatório escolheria um deles
            // sem aviso.
            if (tipo === 'nenhum') {
              onChange({ ...termo, contraparte_nome: null, contraparte_org_id: null, contraparte_profile_id: null })
            } else if (tipo === 'org') {
              onChange({ ...termo, contraparte_nome: null, contraparte_profile_id: null, contraparte_org_id: orgs[0]?.id ?? null })
            } else if (tipo === 'perfil') {
              onChange({ ...termo, contraparte_nome: null, contraparte_org_id: null, contraparte_profile_id: pessoas[0]?.id ?? null })
            } else {
              onChange({ ...termo, contraparte_org_id: null, contraparte_profile_id: null, contraparte_nome: '' })
            }
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIPOS_CONTRAPARTE.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tipoContraparte === 'org' && (
        <div className="space-y-1">
          <Label>Imobiliária</Label>
          <Select
            value={termo.contraparte_org_id || ''}
            onValueChange={(v) => onChange({ ...termo, contraparte_org_id: v })}
          >
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {tipoContraparte === 'perfil' && (
        <div className="space-y-1">
          <Label>Pessoa</Label>
          <Select
            value={termo.contraparte_profile_id || ''}
            onValueChange={(v) => onChange({ ...termo, contraparte_profile_id: v })}
          >
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {pessoas.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {tipoContraparte === 'nome' && (
        <div className="space-y-1">
          <Label>Nome da imobiliária</Label>
          <Input
            value={termo.contraparte_nome || ''}
            onChange={(e) => onChange({ ...termo, contraparte_nome: e.target.value })}
            onBlur={() => onChange(termo)}
            placeholder="Ex.: Realtoria Central"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Sobre {rotuloBase}, esta taxa fica em{' '}
        <span className="font-medium text-foreground">{formatBRL(valor)}</span>{' '}
        {termo.direction === 'despesa' ? 'a sair do seu caixa.' : 'a entrar no seu caixa.'}
      </p>
    </div>
  )
}

function NovaTermo({
  incidePadrao,
  orgs,
  pessoas,
  salvando,
  onCreate,
}: {
  incidePadrao: FeeTerm['incide_em']
  orgs: { id: string; name: string }[]
  pessoas: { id: string; full_name: string }[]
  salvando: boolean
  onCreate: (t: Partial<FeeTerm>) => void
}) {
  const [tipo, setTipo] = React.useState(incidePadrao === 'venda' ? 'comissao_venda' : 'administracao')
  const [base, setBase] = React.useState<FeeTerm['base']>('percentual')
  const [percentual, setPercentual] = React.useState<number | null>(null)
  const [valorFixo, setValorFixo] = React.useState<number | null>(null)
  const [tipoContraparte, setTipoContraparte] = React.useState<TipoContraparte>('nenhum')
  const [orgId, setOrgId] = React.useState('')
  const [perfilId, setPerfilId] = React.useState('')
  const [nome, setNome] = React.useState('')

  const valido =
    (base === 'percentual' ? percentual !== null && Number(percentual) > 0 : valorFixo !== null && Number(valorFixo) > 0) &&
    (tipoContraparte !== 'org' || !!orgId) &&
    (tipoContraparte !== 'perfil' || !!perfilId) &&
    (tipoContraparte !== 'nome' || nome.trim().length > 1)

  return (
    <div className="p-3 rounded-md border border-dashed border-border bg-background space-y-3">
      <p className="text-sm font-medium flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Nova taxa
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as FeeTerm['kind'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(FEE_KIND_LABELS).map(([v, label]) => (
                <SelectItem key={v} value={v}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{FEE_KIND_DESCRICOES[tipo as FeeTerm['kind']]}</p>
        </div>

        <div className="space-y-1">
          <Label>Valor</Label>
          <Select value={base} onValueChange={(v) => setBase(v as FeeTerm['base'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentual">Percentual</SelectItem>
              <SelectItem value="valor_fixo">Valor fixo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>{base === 'percentual' ? 'Percentual' : 'Valor (R$)'}</Label>
          <Input
            value={base === 'percentual' ? formatDecimal(percentual ?? '') : formatCurrencyInput(valorFixo ?? 0)}
            onChange={(e) =>
              base === 'percentual'
                ? setPercentual(parseDecimal(e.target.value))
                : setValorFixo(parseCurrencyInput(e.target.value))
            }
            inputMode="decimal"
            placeholder={base === 'percentual' ? '5,00' : '0,00'}
          />
        </div>

        <div className="space-y-1">
          <Label>Incidência</Label>
          <Select value={incidePadrao} disabled>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="locacao">Locação</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
              <SelectItem value="ambos">Locação e venda</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <Label>Credor da taxa</Label>
          <Select value={tipoContraparte} onValueChange={(v) => setTipoContraparte(v as TipoContraparte)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS_CONTRAPARTE.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {tipoContraparte === 'org' && (
        <div className="space-y-1">
          <Label>Imobiliária</Label>
          <Select value={orgId} onValueChange={setOrgId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {tipoContraparte === 'perfil' && (
        <div className="space-y-1">
          <Label>Pessoa</Label>
          <Select value={perfilId} onValueChange={setPerfilId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {pessoas.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {tipoContraparte === 'nome' && (
        <div className="space-y-1">
          <Label>Nome da imobiliária</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Realtoria Central" />
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={!valido || salvando}
        onClick={() =>
          onCreate({
            kind: tipo as FeeTerm['kind'],
            incide_em: incidePadrao,
            base,
            percentual: base === 'percentual' ? percentual : null,
            valor_fixo: base === 'valor_fixo' ? valorFixo : null,
            contraparte_nome: tipoContraparte === 'nome' ? nome.trim() : null,
            contraparte_org_id: tipoContraparte === 'org' ? orgId : null,
            contraparte_profile_id: tipoContraparte === 'perfil' ? perfilId : null,
          })
        }
      >
        {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Adicionar taxa
      </Button>
    </div>
  )
}
