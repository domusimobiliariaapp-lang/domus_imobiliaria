import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, FileText, Building2, DollarSign, AlertCircle, CheckCircle, Clock, Loader2, Globe } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useSupabase'
import { useLeases } from '@/hooks/useSupabase'
import { usePayments } from '@/hooks/useSupabase'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import * as React from 'react'
import { formatCpfCnpj, formatBrazilianPhone, formatCep, onlyDigits, onlyNumbers, formatDecimal, parseDecimal } from '@/lib/inputMasks'
import { lookupCep } from '@/lib/cepLookup'
import { CustomDomainSetup } from '@/components/domain/CustomDomainSetup'

/**
 * Configurações da empresa.
 *
 * A tabela deixou de ser singleton quando o sistema virou multi-tenant: a chave
 * agora é org_id, uma linha por imobiliária. Buscar pelo id fixo pegaria a
 * linha global, e o UPDATE seria recusado pela policy
 * (WITH CHECK org_id = current_org_id()) — que é exatamente o erro de
 * "não foi possível salvar" que a tela mostrava.
 *
 * O nome e o endereço ficam em organizations, que é a ficha canônica da
 * imobiliária: é de onde a vitrine pública (public_org_branding) e o painel do
 * DEV tiram esses dados. company_settings guarda o que é só da operação —
 * taxa administrativa, índice de reajuste, dias de alerta.
 *
 * Os dois nomes viviam em tabelas diferentes e nada os sincronizava, então
 * renomear a imobiliária aqui não mudava nada no topo do menu. Por isso o save
 * grava nos dois lugares e chama refreshProfile no final.
 */

interface CompanySettings {
  company_name: string
  /** Aceita CPF ou CNPJ — a coluna se chama cnpj por herança, mas a máscara
      aceita os dois. Ver o comentário no formulário. */
  cnpj: string
  /** Coluna legada em texto livre. O endereço agora é editado por partes e
      gravado em organizations.address_*, que monta esta linha no save. Não é
      mais lido nem escrito aqui. */
  address: string
  phone: string
  contact_whatsapp: string
  contact_email: string
  admin_fee_percent: number
  default_reajuste_index: string
  renewal_alert_days: number
}

/** Partes do endereço, que moram em organizations.address_* */
interface CompanyAddress {
  address_street: string
  address_number: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_cep: string
}

const EMPTY_ADDRESS: CompanyAddress = {
  address_street: '',
  address_number: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  address_cep: '',
}

/**
 * Monta a linha de endereço que a vitrine pública e o painel do DEV leem.
 *
 * A ordem segue a de PropertiesAdmin: logradouro, número, bairro, depois
 * CEP/cidade/UF. Many CEPs não devolvem logradouro, então o que o usuário
 * digitou é o que vale.
 */
function buildAddressLine(address: CompanyAddress): string {
  const location = [
    address.address_city,
    address.address_state ? `- ${address.address_state}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return [
    address.address_street,
    address.address_number ? `nº ${address.address_number}` : '',
    address.address_neighborhood,
    [address.address_cep ? formatCep(address.address_cep) : '', location]
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(', ')
}

export function AdministrativeAdmin() {
  const { data: stats } = useDashboardStats()
  const { data: leases } = useLeases()
  const { data: payments } = usePayments()
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [address, setAddress] = useState<CompanyAddress>(EMPTY_ADDRESS)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [saving, setSaving] = useState(false)
  const location = useLocation()
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tab, setTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab')
      if (p === 'dominio' || p === 'configuracoes') return p
    }
    return 'visao_geral'
  })

  // Sincroniza a aba ativa quando a URL mudar (ex: ?tab=configuracoes)
  useEffect(() => {
    const p = new URLSearchParams(location.search).get('tab')
    if (p === 'dominio' || p === 'configuracoes' || p === 'visao_geral') {
      setTab(p)
    }
  }, [location.search])

  const [pixKey, setPixKey] = useState('')
  const [pixType, setPixType] = useState('cnpj')
  const [cepMessage, setCepMessage] = useState<string>('')
  const [lookingUpCep, setLookingUpCep] = useState(false)
  const lastFetchedCep = useRef<string | null>(null)
  const inflightCep = useRef<string | null>(null)
  const { profile, refreshProfile } = useAuth()
  const orgId = profile?.org_id

  useEffect(() => {
    async function loadSettings() {
      // Sem org não há linha de configuração possível — a conta ainda não foi
      // vinculada a uma imobiliária.
      if (!orgId) {
        setLoadingSettings(false)
        return
      }

      if (typeof window !== 'undefined') {
        const savedPix = localStorage.getItem(`domus_pix_key_${orgId}`)
        if (savedPix) setPixKey(savedPix)
        const savedType = localStorage.getItem(`domus_pix_type_${orgId}`)
        if (savedType) setPixType(savedType)
      }

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('org_id', orgId)
        .maybeSingle()

      if (error) {
        console.error('[company_settings] error:', error)
        setSaveMessage({
          type: 'error',
          text: `Não foi possível carregar as configurações: ${error.message}`,
        })
        setLoadingSettings(false)
        return
      }

      // maybeSingle devolve null quando a linha não existe ainda (imobiliária
      // recém-criada). O formulário abre com os valores padrão do estado.
      setSettings(data)

      // A ficha de contato e o endereço vivem em organizations. Uma falha aqui
      // não impede editar as configurações: o save grava company_settings
      // primeiro e só mostra a mensagem de erro no segundo passo.
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('address_street, address_number, address_neighborhood, address_city, address_state, address_cep')
        .eq('id', orgId)
        .maybeSingle()

      if (orgError) {
        // Sem estas colunas, o formulário de endereço abre vazio e o CEP
        // "preenche" sem salvar nada. Avisar aqui evita o diagnóstico errado de
        // que a busca por CEP está quebrada, quando o que falta é a migration.
        console.error('[organizations address] error:', orgError)
        setSaveMessage({
          type: 'error',
          text: `O endereço da empresa não pôde ser carregado: ${orgError.message}`,
        })
      }

      if (org) {
        setAddress({
          address_street: org.address_street || '',
          address_number: org.address_number || '',
          address_neighborhood: org.address_neighborhood || '',
          address_city: org.address_city || '',
          address_state: org.address_state || '',
          address_cep: org.address_cep || '',
        })
      }
      lastFetchedCep.current = org?.address_cep ? org.address_cep.replace(/\D/g, '') : null

      setLoadingSettings(false)
    }
    loadSettings()
  }, [orgId])

  // Calculate upcoming renewals using config
  const upcomingRenewals = React.useMemo(() => {
    if (!leases || !settings) return []
    const today = new Date()
    const alertDays = settings.renewal_alert_days || 60

    return leases
      .filter(l => l.status === 'ativo')
      .map(lease => {
        const endDate = new Date(lease.end_date)
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return { ...lease, daysLeft }
      })
      .filter(l => l.daysLeft > 0 && l.daysLeft <= alertDays)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5)
  }, [leases, settings])

  // Calculate overdue payments
  const overduePayments = React.useMemo(() => {
    if (!payments) return []
    const today = new Date()
    return payments
      .filter(p => p.status === 'pendente' && new Date(p.due_date) < today)
      .slice(0, 5)
  }, [payments])

  /**
   * Busca o endereço ao completar o CEP. Preenche logradouro, bairro, cidade e
   * UF; o número fica de fora porque é a única parte que não vem do CEP.
   *
   * A trava de CEP evita refazer a mesma busca a cada tecla: o usuário digita
   * 8 dígitos, a busca dispara, e corrigir um dígito de novo dispararia outra.
   */
  const handleCepChange = async (value: string) => {
    const digits = value.replace(/\D/g, '')
    const next = { ...address, address_cep: value }
    if (digits.length !== 8) {
      // Um CEP incompleto invalida o resultado anterior, senão a rua ficaria
      // misturada com o CEP novo, que ainda não foi buscado.
      if (digits !== lastFetchedCep.current) lastFetchedCep.current = null
      setAddress(next)
      setCepMessage('')
      return
    }
    setAddress(next)
    if (lastFetchedCep.current === digits || inflightCep.current === digits) return

    inflightCep.current = digits
    setLookingUpCep(true)
    setCepMessage('Buscando o endereço do CEP...')
    try {
      const found = await lookupCep(digits)
      if (inflightCep.current !== digits) return
      setAddress(prev => ({
        ...prev,
        address_street: found.street,
        address_neighborhood: found.neighborhood,
        address_city: found.city,
        address_state: found.state,
      }))
      lastFetchedCep.current = digits
      setCepMessage(
        found.street
          ? `Logradouro preenchido: ${found.street}. Confira o número.`
          : 'CEP encontrado. Preencha o logradouro e o número.',
      )
    } catch {
      if (inflightCep.current === digits) setCepMessage('Não foi possível localizar o CEP. Confira os dados.')
    } finally {
      if (inflightCep.current === digits) inflightCep.current = null
      setLookingUpCep(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    if (!orgId) {
      setSaveMessage({
        type: 'error',
        text: 'Sua conta não está vinculada a uma imobiliária. Peça ao administrador para vincular.',
      })
      return
    }
    setSaving(true)
    setSaveMessage(null)

    const payload = {
      org_id: orgId,
      company_name: settings.company_name,
      cnpj: settings.cnpj,
      phone: settings.phone,
      contact_whatsapp: settings.contact_whatsapp,
      contact_email: settings.contact_email,
      admin_fee_percent: Number(settings.admin_fee_percent),
      default_reajuste_index: settings.default_reajuste_index,
      renewal_alert_days: Number(settings.renewal_alert_days),
      updated_at: new Date().toISOString(),
    }

    try {
      // Upsert em vez de update: uma imobiliária recém-criada ainda não tem
      // linha em company_settings, e um UPDATE não a criaria — o .single()
      // falharia por não encontrar nada para atualizar.
      const { error } = await supabase
        .from('company_settings')
        .upsert(payload, { onConflict: 'org_id' })
        .select('id')
        .single()

      if (error) throw error
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : String(err)
      setSaveMessage({ type: 'error', text: `Não foi possível salvar: ${msg}` })
      setSaving(false)
      return
    }

    // A ficha da imobiliária fica em organizations. O nome é o mesmo que o topo
    // do menu mostra, e sem este update a renomeação só mudaria a tela.
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        name: settings.company_name,
        cnpj: settings.cnpj,
        phone: settings.phone,
        whatsapp: settings.contact_whatsapp,
        email: settings.contact_email,
        address_street: address.address_street || null,
        address_number: address.address_number || null,
        address_neighborhood: address.address_neighborhood || null,
        address_city: address.address_city || null,
        address_state: address.address_state || null,
        address_cep: address.address_cep ? onlyDigits(address.address_cep) : null,
        address: buildAddressLine(address),
      })
      .eq('id', orgId)

    if (orgError) {
      // As configurações da operação foram salvas; só a ficha da imobiliária
      // falhou. A mensagem diz isso, senão o usuário acha que nada foi salvo.
      //
      // Os dois casos mais prováveis significam migration pendente, e ambos
      // aparecem como erro genérico de banco sem dizer o que fazer:
      //   · "could not find the 'address_cep' column" — a 012 não foi aplicada,
      //     então nem o endereço nem o nome chegam a ser gravados;
      //   · "row-level security policy" — a 012 foi aplicada mas a policy
      //     (ou a role da conta) impede o UPDATE.
      const mensagem = orgError.message
      const faltaMigration = mensagem.includes('address_cep') || mensagem.includes('schema cache')
      const semPolicy = mensagem.includes('row-level security')
      const dica = faltaMigration
        ? 'Rode "supabase db push" para aplicar a migration 20260930000012.'
        : semPolicy
          ? 'Rode "supabase db push" para aplicar a policy de UPDATE, e confirme que sua conta tem a role admin.'
          : ''

      setSaveMessage({
        type: 'error',
        text: `As configurações foram salvas, mas o nome e o endereço da imobiliária não puderam ser gravados: ${mensagem}${dica ? ` ${dica}` : ''}`,
      })
      setSaving(false)
      return
    }

    // Salva a chave PIX da imobiliária
    if (typeof window !== 'undefined' && orgId) {
      localStorage.setItem(`domus_pix_key_${orgId}`, pixKey)
      localStorage.setItem(`domus_pix_type_${orgId}`, pixType)
      localStorage.setItem(`domus_onboarding_pix_${orgId}`, 'true')
    }

    // O menu lê organizations.name via useAuth. Sem este refresh, o topo
    // continuaria mostrando o nome antigo até a próxima carga da página.
    await refreshProfile()

    setSaveMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
    setSaving(false)
  }

  if (!stats || loadingSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="visao_geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          <TabsTrigger value="dominio" className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#AD7B3B]" />
            <span>Domínio Próprio (.com.br)</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'visao_geral' && (
        <VisaoGeral
          stats={stats}
          upcomingRenewals={upcomingRenewals}
          overduePayments={overduePayments}
        />
      )}

      {tab === 'configuracoes' && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={settings?.company_name || ''}
                    onChange={(e) => setSettings({ ...settings!, company_name: e.target.value })}
                    placeholder="Domus Imobiliária"
                  />
                </div>
                <div className="space-y-1">
                  {/* A coluna se chama cnpj por herança, mas uma imobiliária
                      pode ser MEI ou condomínio: pessoa jurídica com CNPJ, mas
                      nada impede que a ficha saia com CPF. Renomear a coluna
                      mexeria na vitrine pública e no dev_org_names() sem
                      ganho nenhum. */}
                  <Label>CPF ou CNPJ</Label>
                  <Input
                    value={formatCpfCnpj(settings?.cnpj || '')}
                    onChange={(e) => setSettings({ ...settings!, cnpj: formatCpfCnpj(e.target.value) })}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    inputMode="numeric"
                    maxLength={18}
                  />
                  <p className="text-xs text-muted-foreground">
                    A máscara se ajusta ao tamanho do que for digitado: 11 dígitos
                    formam CPF, 14 formam CNPJ.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input
                    value={formatBrazilianPhone(settings?.phone || '')}
                    onChange={(e) => setSettings({ ...settings!, phone: formatBrazilianPhone(e.target.value) })}
                    placeholder="(00) 0000-0000"
                    type="text"
                    inputMode="tel"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-1">
                  <Label>WhatsApp público</Label>
                  <Input
                    value={formatBrazilianPhone(settings?.contact_whatsapp || '')}
                    onChange={(e) => setSettings({ ...settings!, contact_whatsapp: formatBrazilianPhone(e.target.value) })}
                    placeholder="(11) 99999-9999"
                    type="text"
                    inputMode="tel"
                    maxLength={15}
                  />
                  <p className="text-xs text-muted-foreground">Usado no botão de contato da página pública.</p>
                </div>
                <div className="space-y-1">
                  <Label>E-mail público</Label>
                  <Input
                    type="email"
                    value={settings?.contact_email || ''}
                    onChange={(e) => setSettings({ ...settings!, contact_email: e.target.value })}
                    placeholder="contato@imobiliaria.com.br"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Endereço</Label>
                  <div className="grid gap-4 md:grid-cols-6">
                    <div className="md:col-span-3">
                      <Input
                        value={address.address_street}
                        onChange={(e) => setAddress({ ...address, address_street: e.target.value })}
                        placeholder="Rua, avenida..."
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Input
                        value={address.address_number}
                        onChange={(e) => setAddress({ ...address, address_number: e.target.value })}
                        placeholder="Número"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        value={address.address_neighborhood}
                        onChange={(e) => setAddress({ ...address, address_neighborhood: e.target.value })}
                        placeholder="Bairro"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="company_zip" className="sr-only">CEP</Label>
                      <Input
                        id="company_zip"
                        value={formatCep(address.address_cep)}
                        onChange={(e) => void handleCepChange(e.target.value)}
                        placeholder="CEP"
                        inputMode="numeric"
                        maxLength={9}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        value={address.address_city}
                        onChange={(e) => setAddress({ ...address, address_city: e.target.value })}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Input
                        value={address.address_state}
                        onChange={(e) => setAddress({
                          ...address,
                          address_state: e.target.value.toUpperCase().slice(0, 2),
                        })}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
                    {lookingUpCep && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {cepMessage || 'O CEP preenche o logradouro, o bairro, a cidade e a UF.'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Tipo de Chave PIX</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={pixType}
                    onChange={(e) => setPixType(e.target.value)}
                  >
                    <option value="cnpj">CNPJ</option>
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Celular</option>
                    <option value="aleatoria">Chave Aleatória (EVP)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Chave PIX da Imobiliária</Label>
                  <Input
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Ex: financeiro@imobiliaria.com.br"
                  />
                  <p className="text-xs text-muted-foreground">Usada para cobrança de aluguéis e repasses aos proprietários.</p>
                </div>
                <div className="space-y-1">
                  <Label>Taxa Administrativa (%)</Label>
                  <Input
                    value={settings?.admin_fee_percent ? formatDecimal(settings.admin_fee_percent) : ''}
                    onChange={(e) => setSettings({ ...settings!, admin_fee_percent: parseDecimal(e.target.value) })}
                    placeholder="5,00"
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Índice de Reajuste Padrão</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={settings?.default_reajuste_index || 'IGPM'}
                    onChange={(e) => setSettings({ ...settings!, default_reajuste_index: e.target.value })}
                  >
                    <option value="IGPM">IGP-M</option>
                    <option value="IPCA">IPCA</option>
                    <option value="INCC">INCC</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Dias de Alerta para Renovação</Label>
                  <Input
                    value={settings?.renewal_alert_days ? String(settings.renewal_alert_days) : ''}
                    onChange={(e) => setSettings({
                      ...settings!,
                      renewal_alert_days: parseInt(onlyNumbers(e.target.value)) || 60,
                    })}
                    placeholder="60"
                    inputMode="numeric"
                  />
                  <p className="text-xs text-muted-foreground">Contratos com vencimento dentro deste período aparecerão na tela de renovações.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                {saveMessage && (
                  <div className={`text-sm ${saveMessage.type === 'success' ? 'text-emerald-600' : 'text-destructive'}`}>
                    {saveMessage.text}
                  </div>
                )}
                <Button type="submit" disabled={saving} className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white">
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === 'dominio' && <CustomDomainSetup />}
    </div>
  )
}

function VisaoGeral({
  stats,
  upcomingRenewals,
  overduePayments,
}: {
  stats: any
  upcomingRenewals: any[]
  overduePayments: any[]
}) {
  return (
    <>
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total_properties}</p>
                <p className="text-xs text-muted-foreground">Imóveis Cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.active_leases}</p>
                <p className="text-xs text-muted-foreground">Locações Ativas</p>
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
                <p className="text-2xl font-semibold">{stats.pending_payments}</p>
                <p className="text-xs text-muted-foreground">Pagamentos Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total_sales}</p>
                <p className="text-xs text-muted-foreground">Vendas Realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Renewals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Renovações Próximas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma renovação prevista</p>
            ) : (
              <div className="space-y-3">
                {upcomingRenewals.map((lease: any) => (
                  <div key={lease.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Contrato #{lease.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        Término: {new Date(lease.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant={lease.daysLeft <= 7 ? 'destructive' : 'secondary'}>
                      {lease.daysLeft} dias
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Pagamentos Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overduePayments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum pagamento atrasado</p>
            ) : (
              <div className="space-y-3">
                {overduePayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Contrato #{payment.lease_id?.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="font-medium text-destructive">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Recebido</p>
              <p className="text-2xl font-semibold text-emerald-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total_collected)}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Pendente</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total_pending_amount)}
              </p>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo Total</p>
              <p className="text-2xl font-semibold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  stats.total_collected + stats.total_pending_amount
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white">
          <a href="/admin/properties">
            <Building2 className="h-4 w-4 mr-2" />
            Gerenciar Imóveis
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="/admin/clients">
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Clientes
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="/admin/financial">
            <DollarSign className="h-4 w-4 mr-2" />
            Ver Financeiro
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="/admin/contracts">
            <FileText className="h-4 w-4 mr-2" />
            Ver Contratos
          </a>
        </Button>
      </div>
    </>
  )
}
