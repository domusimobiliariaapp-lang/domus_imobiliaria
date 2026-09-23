import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, FileText, Building2, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useSupabase'
import { useLeases } from '@/hooks/useSupabase'
import { usePayments } from '@/hooks/useSupabase'
import { supabase } from '@/integrations/supabase/client'
import * as React from 'react'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

interface CompanySettings {
  company_name: string
  cnpj: string
  address: string
  phone: string
  admin_fee_percent: number
  default_reajuste_index: string
  renewal_alert_days: number
}

export function AdministrativeAdmin() {
  const { data: stats } = useDashboardStats()
  const { data: leases } = useLeases()
  const { data: payments } = usePayments()
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('visao_geral')
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function loadSettings() {
      // Use maybeSingle to avoid error when no row exists yet
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .maybeSingle()
      if (error) {
        console.error('[company_settings] error:', error)
        // Show error on screen, not via alert()
        setLoadingSettings(false)
        // If the table is empty, that's OK — we'll show defaults
        if (error.message?.includes('single')) {
          // Table exists but has no row — use defaults
          setSettings(null)
          return
        }
        return
      }
      if (data) {
        setSettings(data)
      }
      setLoadingSettings(false)
    }
    loadSettings()
  }, [])

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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('company_settings')
        .update({
          company_name: settings.company_name,
          cnpj: settings.cnpj,
          address: settings.address,
          phone: settings.phone,
          admin_fee_percent: Number(settings.admin_fee_percent),
          default_reajuste_index: settings.default_reajuste_index,
          renewal_alert_days: Number(settings.renewal_alert_days),
          updated_at: new Date().toISOString(),
        })
        .eq('id', SETTINGS_ID)
      if (error) throw error
      setSaveMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : String(err)
      setSaveMessage({ type: 'error', text: `Não foi possível salvar: ${msg}` })
    } finally {
      setSaving(false)
    }
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
                  <Label>CNPJ</Label>
                  <Input
                    value={settings?.cnpj || ''}
                    onChange={(e) => setSettings({ ...settings!, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input
                    value={settings?.phone || ''}
                    onChange={(e) => setSettings({ ...settings!, phone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={settings?.address || ''}
                    onChange={(e) => setSettings({ ...settings!, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Taxa Administrativa (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings?.admin_fee_percent ?? ''}
                    onChange={(e) => setSettings({ ...settings!, admin_fee_percent: parseFloat(e.target.value) || 0 })}
                    placeholder="5.00"
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
                    type="number"
                    value={settings?.renewal_alert_days ?? ''}
                    onChange={(e) => setSettings({ ...settings!, renewal_alert_days: parseInt(e.target.value) || 60 })}
                    placeholder="60"
                    min={1}
                    max={365}
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
