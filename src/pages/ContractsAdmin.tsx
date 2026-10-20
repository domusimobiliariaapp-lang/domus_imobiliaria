import { CRUDPage } from '@/components/CRUDPage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileText, AlertCircle, ScrollText, Printer, Send, CheckCircle2 } from 'lucide-react'
import { useLeases, useCreateEntity, useUpdateEntity, useDeleteEntity, useProperties, useProfiles } from '@/hooks/useSupabase'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { calcularRepasseLocacao, formatBRL } from '@/lib/repasse'
import { generateRentalContract, type GeneratedContract } from '@/lib/contractGenerator'
import { FeeTermsEditor } from '@/components/FeeTermsEditor'
import { formatCurrencyInput, parseCurrencyInput, onlyNumbers } from '@/lib/inputMasks'
import type { Lease, Property } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import * as React from 'react'

type LeaseStatus = Lease['status']

const LEASE_STATUSES: { value: LeaseStatus; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'vencido', label: 'Vencido' },
]

const FILTER_STATUS = LEASE_STATUSES

export function ContractsAdmin() {
  const { data: leases, error, refetch } = useLeases()
  const { data: properties } = useProperties()
  const { data: profiles } = useProfiles()
  const { create } = useCreateEntity('leases')
  const { update } = useUpdateEntity('leases')
  const { remove } = useDeleteEntity('leases')

  const tenants = (profiles || []).filter(p => p.role === 'cliente')
  const landlords = (profiles || []).filter(p => p.role === 'cliente')

  const { organization } = useAuth()
  const [contractModalOpen, setContractModalOpen] = React.useState(false)
  const [generatedContract, setGeneratedContract] = React.useState<GeneratedContract | null>(null)
  const [selectedLeaseForContract, setSelectedLeaseForContract] = React.useState<Lease | null>(null)
  const [enviandoAssinatura, setEnviandoAssinatura] = React.useState(false)

  const handleOpenContractMinuta = (lease: Lease) => {
    const prop = (properties || []).find((p) => p.id === lease.property_id)
    const tenant = (profiles || []).find((p) => p.id === lease.tenant_id)
    const landlord = (profiles || []).find((p) => p.id === lease.landlord_id)

    if (!prop || !tenant || !landlord) {
      alert('Dados de imóvel, locador ou locatário incompletos para gerar a minuta.')
      return
    }

    const contract = generateRentalContract({
      lease,
      property: prop,
      tenant,
      landlord,
      organization,
    })

    setSelectedLeaseForContract(lease)
    setGeneratedContract(contract)
    setContractModalOpen(true)
  }

  const handleSendToSignature = async () => {
    if (!selectedLeaseForContract || !generatedContract) return
    setEnviandoAssinatura(true)
    try {
      await update(selectedLeaseForContract.id, {
        signature_status: 'aguardando_assinaturas',
        signature_provider: 'zapsign',
        external_document_id: `ENV-${Date.now().toString(36).toUpperCase()}`,
        signers: generatedContract.signers,
      })
      alert('Contrato enviado com sucesso para assinatura eletrônica dos participantes!')
      setContractModalOpen(false)
      void refetch()
    } catch {
      alert('Erro ao enviar contrato para assinatura.')
    } finally {
      setEnviandoAssinatura(false)
    }
  }

  const handleMarkAsSigned = async () => {
    if (!selectedLeaseForContract) return
    await update(selectedLeaseForContract.id, {
      signature_status: 'assinado',
      signed_at: new Date().toISOString(),
    })
    alert('Contrato marcado como assinado!')
    setContractModalOpen(false)
    void refetch()
  }

  const columns: Array<{ key: string; header: string; render: (l: Lease & { property?: Property }) => React.ReactNode }> = [
    {
      key: 'property',
      header: 'Imóvel',
      render: (l: any) => <span className="font-medium">{l.property?.title || 'Carregando...'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (l: Lease) => <StatusBadge type="lease" value={l.status} />
    },
    {
      key: 'signature_status',
      header: 'Assinatura',
      render: (l: Lease) => {
        const s = l.signature_status || 'rascunho'
        const map: Record<string, { label: string; className: string }> = {
          rascunho: { label: 'Minuta', className: 'bg-muted text-muted-foreground' },
          aguardando_assinaturas: { label: 'Aguardando', className: 'bg-amber-100 text-amber-800 border-amber-300' },
          assinado: { label: 'Assinado', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
          recusado: { label: 'Recusado', className: 'bg-red-100 text-red-800 border-red-300' },
        }
        const badge = map[s] || map.rascunho
        return <Badge variant="outline" className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
      },
    },
    {
      key: 'tenant',
      header: 'Locatário',
      render: (l: any) => <span>{l.tenant?.full_name || 'N/A'}</span>
    },
    {
      key: 'monthly_rent',
      header: 'Aluguel (R$)',
      render: (l: Lease) => <span className="font-medium">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.monthly_rent)}
      </span>
    },
    {
      key: 'start_date',
      header: 'Início',
      render: (l: Lease) => new Date(l.start_date).toLocaleDateString('pt-BR')
    },
    {
      key: 'end_date',
      header: 'Término',
      render: (l: Lease) => new Date(l.end_date).toLocaleDateString('pt-BR')
    },
  ]

  /**
   * O status do imóvel é consequência do contrato, não uma escolha à parte.
   *
   * Sem isto, um imóvel com locação ativa continuava com status 'disponivel' e
   * a vitrine pública o mostrava como disponível para alugar — a RPC pública
   * filtra por status = 'disponivel', e nada no sistema o mudava.
   *
   * A volta para 'disponivel' só acontece quando o contrato deixa de valer: um
   * imóvel que voltou ao mercado é o único caso em que a vitrine deve oferecê-lo
   * de novo. Ele só é devolvido se ninguém mais tiver locação ativa, porque dois
   * contratos ativos no mesmo imóvel significam que o status não é
   * 'disponivel' — é um dado errado, não uma regra.
   */
  const syncPropertyStatus = async (propertyId: string | undefined) => {
    if (!propertyId) return
    const { data: imovel } = await supabase
      .from('properties')
      .select('status')
      .eq('id', propertyId)
      .maybeSingle()

    // Não mexe em imóvel vendido ou reservado: o status carrega informação de
    // venda que a locação não pode apagar.
    if (!imovel || imovel.status === 'vendido' || imovel.status === 'reservado') return

    const { data: ativos } = await supabase
      .from('leases')
      .select('id')
      .eq('property_id', propertyId)
      .eq('status', 'ativo')

    const novoStatus = (ativos?.length || 0) > 0 ? 'alugado' : 'disponivel'
    if (novoStatus === imovel.status) return

    await supabase.from('properties').update({ status: novoStatus }).eq('id', propertyId)
  }

  const handleCreate = async (data: Partial<Lease>) => {
    const { data: result, error } = await create(data)
    if (error) throw error
    await syncPropertyStatus(result.property_id)
    void refetch()
    return result
  }

  const handleUpdate = async (id: string, data: Partial<Lease>) => {
    const { data: result, error } = await update(id, data)
    if (error) throw error
    // Precisa do id do contrato anterior: ao editar, o imóvel pode ter mudado,
    // e o antigo precisa ser liberado.
    const anterior = (leases || []).find((l) => l.id === id)
    await syncPropertyStatus(result.property_id)
    if (anterior?.property_id && anterior.property_id !== result.property_id) {
      await syncPropertyStatus(anterior.property_id)
    }
    void refetch()
    return result
  }

  const handleDelete = async (id: string) => {
    // Guardar o imóvel antes de remover: depois do delete, o contrato não
    // existe mais e não há como saber qual imóvel liberar.
    const alvo = (leases || []).find((l) => l.id === id)
    const { error } = await remove(id)
    if (error) throw error
    await syncPropertyStatus(alvo?.property_id)
    void refetch()
  }

  const renderForm = ({
    formData,
    setFormData,
  }: {
    item: Lease | null
    formData: Partial<Lease>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Lease>>>
    onSubmit: (e: React.FormEvent) => void
    saving: boolean
    isEditing: boolean
  }) => {
    // O repasse só aparece quando o imóvel escolhido tem proprietário. A taxa vem
    // do imóvel; sem ela, da empresa — a mesma ordem da prévia na aba Gestão, e
    // por isso as duas telas nunca discordam do valor.
    const imovelSelecionado = (properties || []).find((p) => p.id === formData.property_id)
    // Só há taxa quando OUTRA imobiliária administra o imóvel. Em imóvel
    // próprio sem intermediário, ou em locação particular, o dono fica com o
    // aluguel inteiro — e a taxa da empresa não se aplica aqui, porque ela é a
    // receita de quem administra, não um desconto para o dono.
    const repasseDoContrato = imovelSelecionado
      ? calcularRepasseLocacao({
          monthlyRent: Number(formData.monthly_rent) || 0,
          // A prévia mostra o cenário de pagamento em dia; o relatório do
          // Financeiro usa o que foi realmente pago. Aqui a taxa vem das
          // colunas legadas do imóvel — os termos em fee_terms entram quando
          // a tela de taxas for ligada, e o valor não muda no meio do caminho.
          pagoNoPeriodo: Number(formData.monthly_rent) || 0,
          termos: imovelSelecionado.taxa_terceirizacao_percent
            ? [{
                id: 'preview',
                property_id: imovelSelecionado.id,
                kind: 'administracao',
                incide_em: 'locacao',
                base: 'percentual',
                percentual: imovelSelecionado.taxa_terceirizacao_percent,
              }]
            : [],
        })
      : null

    /**
     * Escolher o imóvel puxa o que já está cadastrado nele: aluguel e depósito
     * vêm do imóvel e eram digitados de novo, com risco de divergir do que
     * está publicado na vitrine. O locador também — em imóvel de terceiro o
     * proprietário é o locador, e pedir para escolher era trabalho redundante
     * que só permitia errar.
     *
     * O locatário NÃO é preenchido: são quantas pessoas diferentes num
     * contrato, e não dá para adivinhar.
     */
    const handlePropertyChange = (propertyId: string) => {
      const imovel = (properties || []).find((p) => p.id === propertyId)
      if (!imovel) return

      setFormData((prev) => ({
        ...prev,
        property_id: propertyId,
        // Só preenche o que está vazio: ao trocar o imóvel de um contrato que já
        // tem valor acertado, sobrescrever o aluguel silenciosamente mudaria o
        // valor de um contrato vivo.
        monthly_rent: prev.monthly_rent || imovel.rent_price || 0,
        deposit: prev.deposit || imovel.deposit_amount || 0,
        // Imóvel de terceiro: o dono é o locador, e a aba Gestão do imóvel já
        // registrou quem é.
        landlord_id: imovel.owner_id || prev.landlord_id || '',
      }))
    }

    /**
     * Um imóvel não pode ter duas locações ativas. A trava é por contrato, e não
     * por status do imóvel, porque o status é uma consequência que pode estar
     * desatualizada — o critério confiável é o contrato.
     */
    const contratosDoImovel = (properties || [])
      .find((p) => p.id === formData.property_id)
      ? (leases || []).filter(
          (l) => l.property_id === formData.property_id && l.status === 'ativo' && l.id !== formData.id,
        )
      : []
    const imovelOcupado = contratosDoImovel.length > 0

    return (
      <div>
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Imóvel</Label>
              <Select
                value={formData.property_id || ''}
                onValueChange={handlePropertyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.title} - {prop.city}/{prop.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {imovelSelecionado && (
                <p className="text-xs text-muted-foreground">
                  {[imovelSelecionado.neighborhood, imovelSelecionado.city, imovelSelecionado.state]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {imovelOcupado && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  Este imóvel já tem locação ativa
                  {contratosDoImovel[0]?.tenant_id &&
                    ` com ${profiles?.find((p) => p.id === contratosDoImovel[0].tenant_id)?.full_name || 'outro locatário'}`}
                  . Encerre o contrato atual antes de criar outro.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Locatário</Label>
              <Select
                value={formData.tenant_id || ''}
                onValueChange={(v) => setFormData({ ...formData, tenant_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o locatário" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Locador</Label>
              <Select
                value={formData.landlord_id || ''}
                onValueChange={(v) => setFormData({ ...formData, landlord_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o locador" />
                </SelectTrigger>
                <SelectContent>
                  {landlords.map((landlord) => (
                    <SelectItem key={landlord.id} value={landlord.id}>
                      {landlord.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Aluguel Mensal (R$)</Label>
              <Input
                value={formatCurrencyInput(formData.monthly_rent)}
                onChange={(e) => setFormData({ ...formData, monthly_rent: parseCurrencyInput(e.target.value) })}
                placeholder="0,00"
                inputMode="decimal"
                required
                min={0}
              />
            </div>

            <div className="space-y-1">
              <Label>Dia de Vencimento</Label>
              <Input
                value={formData.payment_day ? String(formData.payment_day) : ''}
                onChange={(e) => setFormData({ ...formData, payment_day: parseInt(onlyNumbers(e.target.value)) || 1 })}
                placeholder="1-31"
                inputMode="numeric"
                maxLength={2}
                required
              />
            </div>

            {/* Só faz sentido em imóvel de terceiro. Mostrar sempre deixaria
                uma escolha sem efeito em quase todo contrato, e a equipe
                acabaria preenchendo no automático sem saber para quê serve. */}
            {imovelSelecionado?.owner_id && (
              <>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Como o aluguel circula</Label>
                  <Select
                    value={formData.repasse_modelo || 'via_imobiliaria'}
                    onValueChange={(v) => setFormData({ ...formData, repasse_modelo: v as Lease['repasse_modelo'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="via_imobiliaria">
                        Pela imobiliária — locatário paga aqui, e repassa ao proprietário
                      </SelectItem>
                      <SelectItem value="direto">
                        Direto ao proprietário — locatário paga ao dono, a imobiliária cobra só a taxa
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {repasseDoContrato && (
                  <div className="sm:col-span-2 p-3 rounded-md bg-muted/40 border border-border/40">
                    <p className="text-sm">
                      Aluguel de{' '}
                      <span className="font-medium">{formatBRL(Number(formData.monthly_rent) || 0)}</span> a{' '}
                      o proprietário recebe{' '}
                      <span className="font-medium">{formatBRL(repasseDoContrato.liquido)}</span> e a
                      imobiliária retém{' '}
                      <span className="font-medium">{formatBRL(repasseDoContrato.taxas)}</span> por mês.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Calculado a partir do contrato e da taxa do imóvel — não é
                      digitado em lugar nenhum.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-1">
              <Label>Valor do Depósito (R$)</Label>
              <Input
                value={formatCurrencyInput(formData.deposit)}
                onChange={(e) => setFormData({ ...formData, deposit: parseCurrencyInput(e.target.value) })}
                placeholder="0,00"
                inputMode="decimal"
                min={0}
              />
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={formData.status || 'pendente'}
                onValueChange={(v) => setFormData({ ...formData, status: v as LeaseStatus })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {LEASE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Data Término</Label>
              <Input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o contrato"
                rows={3}
              />
            </div>
          </div>
        </form>

        {/* Taxas de administração. Só incide em locação aqui: venda não tem
            contrato, então fee_terms com lease_id não faz sentido. O imóvel já
            foi escolhido, e a prévia do repasse acima mostrou o que estava
            configurado — este bloco é para ajustar o que falta ou corrigir. */}
        <div className="p-4 rounded-md border border-border/40 bg-background mt-6">
          <h3 className="font-serif font-medium text-lg text-primary mb-3">Taxas de administração</h3>
          <FeeTermsEditor
            propertyId={formData.property_id || ''}
            leaseId={formData.property_id || null}
            somente="locacao"
            valorBase={Number(formData.monthly_rent) || 0}
            rotuloBase="um mês de aluguel"
            onChange={() => {}}
          />
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
          <p className="font-medium">Erro ao carregar contratos</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <>
    <CRUDPage<Lease & { property?: Property }>
      title="Contratos"
      subtitle="Cadastre e gerencie os contratos de locação"
      columns={columns}
      fetchData={async () => {
        const { data: dbLeases, error: errLeases } = await supabase
          .from('leases')
          .select('*')
          .order('created_at', { ascending: false })
        if (errLeases) throw new Error(errLeases.message)
        const enriched = (dbLeases || []).map((lease) => ({
          ...lease,
          property: properties?.find((p) => p.id === lease.property_id),
          tenant: profiles?.find((p) => p.id === lease.tenant_id),
          landlord: profiles?.find((p) => p.id === lease.landlord_id),
        }))
        return enriched
      }}
      createItem={handleCreate}
      updateItem={handleUpdate}
      deleteItem={handleDelete}
      getItemId={(l) => l.id}
      filters={{
        status: FILTER_STATUS,
      }}
      renderForm={renderForm}
      formSize="2xl"
      emptyStateIcon={
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
      }
      emptyStateMessage="Nenhum contrato cadastrado"
      renderActions={(item: any, { edit, delete: deleteItem }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenContractMinuta(item)}
            className="text-[#AD7B3B] hover:bg-amber-50 hover:text-[#AD7B3B] transition-transform hover:scale-110 active:scale-95"
            title="Gerar Minuta & Assinatura Digital"
          >
            <ScrollText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => edit(item)}
            className="text-muted-foreground hover:text-primary transition-transform hover:scale-110 active:scale-95"
            title="Editar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteItem(item)}
            className="text-muted-foreground hover:text-destructive transition-transform hover:scale-110 active:scale-95"
            title="Excluir"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </Button>
        </div>
      )}
    />

    {/* Modal de Minuta de Contrato & Assinatura Digital */}
    <Dialog open={contractModalOpen} onOpenChange={setContractModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center justify-between pr-6">
            <span>{generatedContract?.title}</span>
            <Badge variant="outline" className="text-xs bg-muted">
              {generatedContract?.contractNumber}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Minuta jurídica nos termos da Lei nº 8.245/1991 e MP nº 2.200-2/2001 para assinatura eletrônica.
          </DialogDescription>
        </DialogHeader>

        {generatedContract && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 my-2">
            {/* Signatários */}
            <div className="bg-muted/40 p-3 rounded-md border text-xs">
              <span className="font-semibold text-primary block mb-2">Signatários Vinculados:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {generatedContract.signers.map((s, idx) => (
                  <div key={idx} className="bg-card p-2 rounded border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {s.role}
                    </span>
                    <strong className="truncate block text-foreground">{s.name}</strong>
                    <span className="text-muted-foreground text-[11px] truncate block">{s.email || 'Sem e-mail'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documento Renderizado */}
            <div
              className="p-6 bg-white rounded-md border shadow-xs"
              dangerouslySetInnerHTML={{ __html: generatedContract.htmlContent }}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir / Salvar PDF
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsSigned}
              className="text-xs text-emerald-700 hover:bg-emerald-50 gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Marcar como Assinado
            </Button>

            <Button
              size="sm"
              disabled={enviandoAssinatura}
              onClick={handleSendToSignature}
              className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white gap-1.5 text-xs shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              {enviandoAssinatura ? 'Enviando...' : 'Enviar para Assinatura'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
