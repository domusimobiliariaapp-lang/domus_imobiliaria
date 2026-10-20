import { CRUDPage } from '@/components/CRUDPage'
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { User, AlertCircle, Loader2 } from 'lucide-react'
import { useProfiles } from '@/hooks/useSupabase'
import type { Client } from '@/types'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
import { formatCpfCnpj, formatBrazilianPhone, toBrazilianE164, onlyDigits, formatCep } from '@/lib/inputMasks'
import { lookupCep } from '@/lib/cepLookup'
import { createClient, updateClient } from '@/lib/clientCreate'
import { supabase } from '@/integrations/supabase/client'

type TipoRelacao = NonNullable<Client['tipo_relacao']>
type Categoria = NonNullable<Client['categoria']>
type StatusCliente = NonNullable<Client['status']>

const RELATION_TYPES: { value: TipoRelacao; label: string }[] = [
  { value: 'locatario', label: 'Locatário' },
  { value: 'locador', label: 'Locador' },
  { value: 'comprador', label: 'Comprador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'fiador', label: 'Fiador' },
]

const CATEGORIES: { value: Categoria; label: string }[] = [
  { value: 'pf', label: 'Pessoa Física' },
  { value: 'pj', label: 'Pessoa Jurídica' },
]

const STATUSES: { value: StatusCliente; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
]

const FILTER_STATUS = STATUSES.map(s => ({ value: s.value, label: s.label }))
const FILTER_TYPE = RELATION_TYPES.map(t => ({ value: t.value, label: t.label }))
const FILTER_CATEGORY = CATEGORIES.map(c => ({ value: c.value, label: c.label }))

/**
 * Monta a linha de endereço a partir das partes.
 *
 * A coluna endereco continua existindo e é o que outros lugares leem; as
 * partes é que permitem buscar e reusar. Montar aqui evita dois lugares
 * divergirem na hora de juntar as mesmas informações.
 */
function montarEndereco(d: Partial<Client>): string {
  return [
    d.endereco_street,
    d.endereco_number ? `nº ${d.endereco_number}` : '',
    d.endereco_complement,
    d.endereco_neighborhood,
    d.endereco_cep ? formatCep(d.endereco_cep) : '',
    [d.endereco_city, d.endereco_state ? `- ${d.endereco_state}` : ''].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ')
}

export function ClientsAdmin() {
  /**
   * A lista vem de profiles, e não de clients.
   *
   * Antes a tela lia de clients e escrevia em profiles: criar um cliente não o
   * fazia aparecer na lista, editar salvava campos que só existem em clients, e
   * os ids das duas não tinham relação. profiles é a tabela que o login do
   * portal, as leases e os pagamentos já referenciam.
   *
   * O filtro por role é o que separa cliente de equipe: a mesma tabela guarda os
   * dois, e a lista de clientes sem isso mostraria os próprios corretores.
   */
  const { error, refetch } = useProfiles()
  const { addToast } = useToast()

  // O endereço em partes vive dentro do formData, que o CRUDPage já recria a
  // cada tecla. Um estado separado aqui dessincronizaria os dois.
  const [cepMessage, setCepMessage] = React.useState('')
  const [buscandoCep, setBuscandoCep] = React.useState(false)
  const cepBuscado = React.useRef<string | null>(null)
  const cepEmVoo = React.useRef<string | null>(null)

  /**
   * Busca o endereço por CEP e devolve as partes preenchidas.
   *
   * Devolve em vez de escrever direto: quem chama decide o que fazer com o
   * resultado, porque o modal de imóvel também usa isto e o estado dele é
   * outro.
   */
  const handleCepBlur = async (cep: string): Promise<Partial<Client> | null> => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8 || cepBuscado.current === digits || cepEmVoo.current === digits) return null

    cepEmVoo.current = digits
    setBuscandoCep(true)
    setCepMessage('Buscando o endereço do CEP...')
    try {
      const found = await lookupCep(digits)
      if (cepEmVoo.current !== digits) return null
      cepBuscado.current = digits
      setCepMessage(
        found.street
          ? `Endereço preenchido: ${found.street}. Confira o número.`
          : 'CEP encontrado. Preencha o logradouro e o número.',
      )
      return {
        endereco_street: found.street,
        endereco_neighborhood: found.neighborhood,
        endereco_city: found.city,
        endereco_state: found.state,
        endereco_cep: digits,
      }
    } catch {
      if (cepEmVoo.current === digits) {
        setCepMessage('Não foi possível localizar o CEP. Confira os dados.')
      }
      return null
    } finally {
      if (cepEmVoo.current === digits) cepEmVoo.current = null
      setBuscandoCep(false)
    }
  }

  const columns: Array<{ key: string; header: string; render: (c: Client) => React.ReactNode }> = [
    { key: 'full_name', header: 'Nome / Razão Social', render: (c: Client) => <span className="font-medium">{c.full_name}</span> },
    { key: 'cpf_cnpj_limpo', header: 'CPF/CNPJ', render: (c: Client) => <span className="font-mono text-sm">{c.cpf_cnpj_limpo ? formatCpfCnpj(c.cpf_cnpj_limpo) : '-'}</span> },
    { key: 'telefone_e164', header: 'Telefone', render: (c: Client) => <span>{c.telefone_e164 ? formatBrazilianPhone(c.telefone_e164) : '-'}</span> },
    { key: 'tipo_relacao', header: 'Relação', render: (c: Client) => <span className="text-sm capitalize">{c.tipo_relacao ? c.tipo_relacao.replace('_', ' ') : '-'}</span> },
    { key: 'email', header: 'E-mail', render: (c: Client) => c.email ? <span className="font-mono text-sm">{c.email}</span> : <span className="text-muted-foreground">-</span> },
    { key: 'status', header: 'Status', render: (c: Client) => <StatusBadge type="document" value={c.status === 'inativo' ? 'suspenso' : 'concluido'} /> },
  ]

  const handleCreate = async (data: Partial<Client>) => {
    const id = await createClient({
      full_name: data.full_name!,
      email: data.email!,
      cpf_cnpj_limpo: onlyDigits(data.cpf_cnpj_limpo || ''),
      telefone_e164: toBrazilianE164(data.telefone_e164 || ''),
      tipo_relacao: data.tipo_relacao,
      categoria: data.categoria,
      status: data.status,
      observacoes: data.observacoes,
      // Endereço em partes: a edge function salva cada uma. A coluna
      //-legada address é montada a partir delas, para o que outros lugares
      // leem.
      endereco: montarEndereco(data),
     endereco_cep: data.endereco_cep,
     endereco_street: data.endereco_street,
     endereco_number: data.endereco_number,
     endereco_complement: data.endereco_complement,
     endereco_neighborhood: data.endereco_neighborhood,
     endereco_city: data.endereco_city,
     endereco_state: data.endereco_state,
    })
    // O CRUDPage espera o próprio registro de volta para a listagem, e o
    // refetch no handleSave puxa o que está no banco.
    return { id } as Client
  }

  const handleUpdate = async (id: string, data: Partial<Client>) => {
    await updateClient(id, {
      full_name: data.full_name,
      email: data.email,
      cpf_cnpj_limpo: data.cpf_cnpj_limpo ? onlyDigits(data.cpf_cnpj_limpo) : undefined,
      telefone_e164: data.telefone_e164 ? toBrazilianE164(data.telefone_e164) : undefined,
      tipo_relacao: data.tipo_relacao,
      categoria: data.categoria,
      status: data.status,
      observacoes: data.observacoes,
     endereco_cep: data.endereco_cep,
     endereco_street: data.endereco_street,
     endereco_number: data.endereco_number,
     endereco_complement: data.endereco_complement,
     endereco_neighborhood: data.endereco_neighborhood,
     endereco_city: data.endereco_city,
     endereco_state: data.endereco_state,
     endereco: montarEndereco(data),
    })
    return { id } as Client
  }

  /**
   * Não existe exclusão de cliente, e a ausência é deliberada.
   *
   * profiles é referenciada por leases.tenant_id, leases.landlord_id,
   * sales.buyer_id, sales.seller_id e payments.tenant_id, todas com ON DELETE
   * RESTRICT — apagar esbarra nos contratos. E apagar o profile derruba o login
   * de quem pagou o aluguel no portal.
   *
   * Desativar preserva o histórico: os contratos continuam apontando para a
   * pessoa, os pagamentos continuam lançados, e a pessoa não entra mais.
   */
  const handleDelete = async (id: string) => {
    await updateClient(id, { status: 'inativo' })
    addToast('Cliente desativado. O histórico de contratos foi preservado.', 'success')
  }

  const renderForm = ({
    item,
    formData,
    setFormData,
    isEditing,
  }: {
    item: Client | null
    formData: Partial<Client>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Client>>>
    isEditing: boolean
  }) => {
    // Use item to show client name in title when editing
    const formTitle = isEditing && item ? `Editar ${item.full_name}` : 'Novo Cliente'

    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">{formTitle}</h3>
        </div>
        {/* Sem <form> aqui: o CRUDPage já envolve o renderForm em um, e form
            aninhado é HTML inválido — o browser descarta o interno, e o
            onSubmit dele nunca dispara. Por isso o botão Salvar do modal
            seemed não funcionar. */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Nome / Razão Social</Label>
              <Input
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nome completo ou razão social"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Tipo de Relação</Label>
              <Select
                value={formData.tipo_relacao || 'locatario'}
                onValueChange={(v) => setFormData({ ...formData, tipo_relacao: v as TipoRelacao })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select
                value={formData.categoria || 'pf'}
                onValueChange={(v) => setFormData({ ...formData, categoria: v as Categoria })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>CPF / CNPJ</Label>
              <Input
                value={formatCpfCnpj(formData.cpf_cnpj_limpo || '')}
                onChange={(e) => setFormData({ ...formData, cpf_cnpj_limpo: formatCpfCnpj(e.target.value) })}
                inputMode="numeric"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                maxLength={18}
              />
            </div>

            {/* E-mail e telefone são obrigatórios por uma razão que não é o formulário:
                os dois são a chave de entrada do cliente no portal. Ele se
                identifica por CPF/CNPJ + telefone, mas o código de verificação
                chega no e-mail — sem um dos dois o cadastro fica registrado e
                inacessível. */}
            <div className="space-y-1 sm:col-span-2">
              <Label>E-mail {isEditing ? '' : '*'}</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required={!isEditing}
              />
              {!isEditing && (
                <p className="text-xs text-muted-foreground">
                  É por este e-mail que o cliente recebe o código para entrar no portal.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Telefone {isEditing ? '' : '*'}</Label>
              <Input
                value={formatBrazilianPhone(formData.telefone_e164 || '')}
                onChange={(e) => setFormData({ ...formData, telefone_e164: formatBrazilianPhone(e.target.value) })}
                type="text"
                inputMode="tel"
                placeholder="(00) 00000-0000"
                maxLength={15}
                required={!isEditing}
              />
              {!isEditing && (
                <p className="text-xs text-muted-foreground">Com DDD. É por ele que o cliente se identifica no portal.</p>
              )}
            </div>

            {/* O CEP vem primeiro: é o único campo do endereço que se descobre
                sozinho. Ao completar os 8 dígitos, rua, bairro, cidade e UF são
                preenchidos; o número fica por conta da pessoa, porque é a única
                parte que o CEP não traz. */}
            <div className="space-y-1">
              <Label htmlFor="cliente_cep">CEP</Label>
              <Input
                id="cliente_cep"
                value={formatCep(formData.endereco_cep || '')}
                onChange={async (e) => {
                  const masked = formatCep(e.target.value)
                  setFormData({ ...formData, endereco_cep: masked })
                  const partes = await handleCepBlur(masked)
                  if (partes) setFormData((prev) => ({ ...prev, ...partes }))
                }}
                onBlur={async () => {
                  const partes = await handleCepBlur(formData.endereco_cep || '')
                  if (partes) setFormData((prev) => ({ ...prev, ...partes }))
                }}
                placeholder="00000-000"
                inputMode="numeric"
                maxLength={9}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente_numero">Número</Label>
              <Input
                id="cliente_numero"
                value={formData.endereco_number || ''}
                onChange={(e) => setFormData({ ...formData, endereco_number: e.target.value })}
                placeholder="Nº"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="cliente_logradouro">Endereço</Label>
              <Input
                id="cliente_logradouro"
                value={formData.endereco_street || ''}
                onChange={(e) => setFormData({ ...formData, endereco_street: e.target.value })}
                placeholder="Rua, avenida..."
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="cliente_complemento">Complemento</Label>
              <Input
                id="cliente_complemento"
                value={formData.endereco_complement || ''}
                onChange={(e) => setFormData({ ...formData, endereco_complement: e.target.value })}
                placeholder="Apto, bloco, sala..."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente_bairro">Bairro</Label>
              <Input
                id="cliente_bairro"
                value={formData.endereco_neighborhood || ''}
                onChange={(e) => setFormData({ ...formData, endereco_neighborhood: e.target.value })}
                placeholder="Bairro"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente_cidade">Cidade</Label>
              <Input
                id="cliente_cidade"
                value={formData.endereco_city || ''}
                onChange={(e) => setFormData({ ...formData, endereco_city: e.target.value })}
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente_uf">UF</Label>
              <Input
                id="cliente_uf"
                value={formData.endereco_state || ''}
                onChange={(e) => setFormData({ ...formData, endereco_state: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="UF"
                maxLength={2}
              />
            </div>

            <p className="sm:col-span-2 flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
              {buscandoCep && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {cepMessage || 'O CEP preenche o endereço, o bairro, a cidade e a UF.'}
            </p>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={formData.status || 'ativo'}
                onValueChange={(v) => setFormData({ ...formData, status: v as StatusCliente })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações internas"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center gap-4 text-destructive bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Erro ao carregar clientes</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <CRUDPage<Client>
      title="Clientes"
      subtitle="Gerencie os clientes da imobiliária"
      columns={columns}
      fetchData={async () => {
        // O refetch precisa devolver os dados, não só disparar.
        //
        // A alternativa (await refetch(); return clients) depende de o
        // setData do hook provocar um re-render antes do return — e não
        // provoca: o await resolve no mesmo tick, antes do React reprocessar.
        // A lista devolvida era a anterior, então o cliente recém-criado só
        // aparecia depois de recarregar a página. Como o hook não expõe os
        // dados do refetch, a consulta é feita aqui.
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw new Error(error.message)
        return ((data || []) as Client[]).filter((p) => p.role === 'cliente')
      }}
      createItem={handleCreate}
      updateItem={handleUpdate}
      deleteItem={handleDelete}
      confirmDeleteTitle="Desativar cliente"
      confirmDeleteMessage="O cliente deixa de entrar no sistema, mas o histórico de contratos e pagamentos é preservado. Não há como apagar um cliente que já tem contrato — o registro é apagado apenas junto com os contratos que apontam para ele."
      confirmDeleteLabel="Desativar"
      getItemId={(c) => c.id}
      filters={{
        status: FILTER_STATUS,
        type: FILTER_TYPE,
        category: FILTER_CATEGORY,
      }}
      renderForm={renderForm}
      emptyStateIcon={
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
      }
      emptyStateMessage="Nenhum cliente cadastrado"
    />
  )
}
