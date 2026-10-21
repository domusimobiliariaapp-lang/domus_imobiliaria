import { useState, useEffect } from 'react'
import {
  CreditCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Save,
  Loader2,
  RefreshCw,
  ExternalLink,
  Flame,
  Radio,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import {
  getAsaasConfig,
  saveAsaasConfig,
  testAsaasConnection,
  simulateAsaasPaymentConfirmation,
  type AsaasConfig,
  type AsaasEnvironment,
  DEFAULT_ASAAS_CONFIG,
} from '@/lib/asaas'
import { supabase } from '@/integrations/supabase/client'
import type { Organization } from '@/types'

export function DevAsaas() {
  const { addToast } = useToast()
  const [config, setConfig] = useState<AsaasConfig>(DEFAULT_ASAAS_CONFIG)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    tested: boolean
    success: boolean
    message: string
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  // Organizações para teste de simulação
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    async function load() {
      const savedConfig = await getAsaasConfig()
      setConfig(savedConfig)

      // Carrega organizações para a ferramenta de teste
      try {
        const { data } = await supabase
          .from('organizations')
          .select('id, name, slug, subscription_status, plan_id, active, created_at')
          .order('name', { ascending: true })
        if (data) {
          setOrganizations(data as Organization[])
          if (data.length > 0) setSelectedOrgId(data[0].id)
        }
      } catch {
        // fallback
      }
    }
    load()
  }, [])

  const handleEnvironmentChange = (env: AsaasEnvironment) => {
    setConfig((prev) => ({ ...prev, environment: env }))
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await testAsaasConnection(config)
      setTestResult({
        tested: true,
        success: res.success,
        message: res.message,
      })
      if (res.success) {
        addToast(res.message, 'success')
      } else {
        addToast(res.message, 'error')
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err.message || 'Falha ao conectar à API do Asaas.',
      })
      addToast('Erro ao testar conexão', 'error')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveAsaasConfig(config)
      addToast('Configurações do Asaas salvas com sucesso!', 'success')
    } catch (err: any) {
      addToast(`Erro ao salvar: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  // URL do Webhook do projeto
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co'
  const webhookUrl = `${supabaseUrl}/functions/v1/asaas-webhook`

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopiedWebhook(true)
      addToast('URL do Webhook copiada para a área de transferência!', 'success')
      setTimeout(() => setCopiedWebhook(false), 2500)
    } catch {
      // fallback
    }
  }

  const handleSimulatePayment = async () => {
    if (!selectedOrgId) {
      addToast('Selecione uma imobiliária para simular', 'error')
      return
    }

    setSimulating(true)
    try {
      const res = await simulateAsaasPaymentConfirmation({
        orgId: selectedOrgId,
        planId: 'lifetime',
        value: 3490,
      })

      if (res.success) {
        addToast(res.message, 'success')
        // Atualiza a lista local
        setOrganizations((prev) =>
          prev.map((org) =>
            org.id === selectedOrgId
              ? { ...org, subscription_status: 'active', plan_id: 'lifetime' }
              : org,
          ),
        )
      } else {
        addToast(res.message, 'error')
      }
    } catch (err: any) {
      addToast(`Erro na simulação: ${err.message}`, 'error')
    } finally {
      setSimulating(false)
    }
  }

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#AD7B3B]/10 text-[#AD7B3B] rounded-lg">
              <CreditCard className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              Integração Asaas & Cobrança Automática
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Configure suas chaves de API do Asaas, escolha entre <strong>Sandbox</strong> (testes) ou <strong>Produção</strong> e ative a liberação automática do sistema pós-pagamento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white gap-2 shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </div>

      {/* 1. SELEÇÃO DE AMBIENTE: SANDBOX vs PRODUÇÃO */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#AD7B3B]" />
              1. Selecione o Ambiente de Execução
            </CardTitle>
            <Badge
              variant="outline"
              className={
                config.environment === 'production'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                  : 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
              }
            >
              {config.environment === 'production' ? '● PRODUÇÃO (VALORES REAIS)' : '▲ SANDBOX (HOMOLOGAÇÃO / TESTES)'}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Alterne entre testes com dinheiro fictício no Sandbox ou cobranças reais em Produção:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opção Sandbox */}
            <div
              onClick={() => handleEnvironmentChange('sandbox')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                config.environment === 'sandbox'
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                  : 'border-border hover:bg-muted/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧪</span>
                    <h3 className="font-bold text-sm text-foreground">Sandbox (Testes / Homologação)</h3>
                  </div>
                  {config.environment === 'sandbox' && (
                    <Badge className="bg-amber-500 text-white text-[10px]">Ativo</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ideal para testar agora sem gastar nada. As cobranças geradas aqui não movimentam dinheiro real e usam a URL <code>sandbox.asaas.com</code>.
                </p>
              </div>
              <div className="pt-2 border-t border-border/50 text-[11px] text-amber-700 dark:text-amber-400 font-mono">
                API: https://sandbox.asaas.com/api/v3
              </div>
            </div>

            {/* Opção Produção */}
            <div
              onClick={() => handleEnvironmentChange('production')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                config.environment === 'production'
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                  : 'border-border hover:bg-muted/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <h3 className="font-bold text-sm text-foreground">Produção (Valores Reais)</h3>
                  </div>
                  {config.environment === 'production' && (
                    <Badge className="bg-emerald-600 text-white text-[10px]">Ativo</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ambiente oficial para receber pagamentos reais dos seus clientes. As transferências e Pix cairão diretamente na sua conta jurídica do Asaas.
                </p>
              </div>
              <div className="pt-2 border-t border-border/50 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                API: https://api.asaas.com/v3
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. CHAVES DE API & TESTE DE CONEXÃO */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#AD7B3B]" />
            2. Chaves de Acesso da sua Conta Asaas
          </CardTitle>
          <CardDescription className="text-xs">
            Gere sua chave em <strong>Menu → Configurações → Integrações → Chaves de API</strong> no painel do Asaas ({config.environment === 'production' ? 'asaas.com' : 'sandbox.asaas.com'}):
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Chave de API (API Key)</Label>
              <a
                href={
                  config.environment === 'production'
                    ? 'https://www.asaas.com/config/integrations'
                    : 'https://sandbox.asaas.com/config/integrations'
                }
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#AD7B3B] hover:underline flex items-center gap-1"
              >
                Obter Chave no Asaas <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="$aact_YTU5YTE0M2M6N2Z..."
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="h-10 text-sm font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Chave de autorização privada enviada nas requisições seguras.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Token do Webhook (Opcional / Recomendado)</Label>
              <div className="relative">
                <Input
                  type={showWebhookSecret ? 'text' : 'password'}
                  placeholder="Ex: asaas_secret_token_123"
                  value={config.webhookSecret}
                  onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
                  className="h-10 text-sm font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Código secreto definido no Asaas para autenticar o envio do webhook.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">E-mail para Notificações de Pagamento</Label>
              <Input
                type="email"
                placeholder="financeiro@suaempresa.com"
                value={config.notificationEmail || ''}
                onChange={(e) => setConfig({ ...config, notificationEmail: e.target.value })}
                className="h-10 text-sm"
              />
              <span className="text-[11px] text-muted-foreground">
                Receba alertas quando um novo cliente pagar o sistema.
              </span>
            </div>
          </div>

          {/* Botão de Testar Conexão */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
              className="gap-2 text-xs h-9 border-[#AD7B3B]/40 text-[#AD7B3B] hover:bg-[#AD7B3B]/10 hover:text-[#AD7B3B] shadow-xs"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Testar Conexão com Asaas
            </Button>

            {testResult && (
              <div
                className={`text-xs p-2.5 rounded-lg flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. LIBERAÇÃO AUTOMÁTICA & CONFIGURAÇÃO DO WEBHOOK */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#AD7B3B]" />
            3. Liberação Automática do Sistema pós-pagamento
          </CardTitle>
          <CardDescription className="text-xs">
            Assim que o cliente efetuar o pagamento do Pix, Cartão ou Boleto, o sistema libera o acesso dele instantaneamente:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle de Ativação Automática */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <strong className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Ativar o cliente automaticamente ao receber pagamento
              </strong>
              <p className="text-xs text-muted-foreground">
                Muda o status da imobiliária de <code>trial</code> para <code>active</code> e vincula o plano pago sem necessidade de aprovação manual.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoActivation}
                onChange={(e) => setConfig({ ...config, autoActivation: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* URL do Webhook */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              URL do Webhook do seu Sistema (Cole no painel do Asaas):
            </Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={webhookUrl}
                className="h-9 text-xs font-mono bg-muted/50 select-all"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyWebhookUrl}
                className="gap-1.5 text-xs h-9 min-w-[110px]"
              >
                {copiedWebhook ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar URL
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Passo a Passo no Asaas */}
          <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Como configurar o Webhook no Asaas (Passo a Passo em 1 minuto):
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Acesse o menu <strong>Configurações → Integrações → Webhooks</strong> no Asaas.</li>
              <li>Clique em <strong>Novo Webhook</strong> e selecione o tipo <strong>Cobranças</strong>.</li>
              <li>Cole a URL acima no campo <strong>URL do Webhook</strong>.</li>
              <li>
                Marque os eventos essenciais:
                <ul className="list-disc list-inside pl-3 pt-1 space-y-0.5 font-mono text-[11px] text-foreground">
                  <li><code>PAYMENT_RECEIVED</code> e <code>PAYMENT_CONFIRMED</code> (Libera a imobiliária instantaneamente)</li>
                  <li><code>PAYMENT_OVERDUE</code> (Ativa aviso de tolerância de 5 dias por fatura em atraso)</li>
                  <li><code>SUBSCRIPTION_DELETED</code> (Registra cancelamento de plano)</li>
                </ul>
              </li>
              <li>Clique em Salvar. Pronto! Seu sistema já está ouvindo e orquestrando clientes 100% no automático.</li>
            </ol>
          </div>

          {/* Guia da Régua de Comunicação Gratuita do Asaas */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📢</span>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Régua de Comunicação Gratuita do Asaas (Notificações ao Cliente):
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O Asaas possui uma régua de cobrança automatizada que notifica seus clientes sem custo adicional:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Antes do Vencimento:</strong> Envia e-mail e SMS lembrando que a fatura vence em 3 dias com o link do PIX/Boleto.</li>
              <li><strong>No Dia do Vencimento:</strong> Envia o código PIX copia e cola e o link do boleto para pagamento imediato.</li>
              <li><strong>Em Caso de Atraso:</strong> Envia lembretes cordiais com o link atualizado da fatura.</li>
            </ul>
            <p className="text-[11px] text-muted-foreground pt-1 border-t border-emerald-500/10">
              Para ativar ou personalizar as mensagens, acesse <strong>Menu → Configurações → Régua de Comunicação</strong> no seu painel do Asaas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. FERRAMENTA DE SIMULAÇÃO DE LIBERAÇÃO (TESTE AO VIVO) */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            4. Simulador de Liberação Instantânea (Validação de Teste)
          </CardTitle>
          <CardDescription className="text-xs">
            Teste se o fluxo de ativação automática funciona sem precisar esperar um pagamento real:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground block">
                Selecione a Imobiliária para Teste:
              </span>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="flex h-9 w-full sm:w-80 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.subscription_status || 'sem status'})
                  </option>
                ))}
              </select>
              {selectedOrg && (
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-muted-foreground">Status Atual:</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {selectedOrg.subscription_status || 'trial'}
                  </Badge>
                  <span className="text-muted-foreground">• Plano: {selectedOrg.plan_id || 'pro'}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleSimulatePayment}
              disabled={simulating || !selectedOrgId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 gap-2 shrink-0 shadow-sm"
            >
              {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Simular Confirmação e Ativar Imobiliária
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default DevAsaas
