import { useEffect, useState } from 'react'
import { Save, Loader2, Sparkles, RefreshCw, Database, Copy, Check, Building2, Users, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { devAdmin } from '@/lib/devAdmin'
import { supabase } from '@/integrations/supabase/client'
import { getLifetimeSettings, saveLifetimeSettings, type LifetimeSettings, DEFAULT_LIFETIME_SETTINGS } from '@/lib/lifetimeSettings'
import type { SaasPlan } from '@/types'

export function DevPlans() {
  const { addToast } = useToast()
  const [plans, setPlans] = useState<SaasPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isDbSynced, setIsDbSynced] = useState(true)
  const [copiedSql, setCopiedSql] = useState(false)
  const [lifetimeSettings, setLifetimeSettings] = useState<LifetimeSettings>(DEFAULT_LIFETIME_SETTINGS)
  const [savingLifetime, setSavingLifetime] = useState(false)

  const checkTableExists = async () => {
    try {
      const { error } = await supabase.from('saas_plans').select('id').limit(1)
      if (error && (error.message.includes('schema cache') || error.message.includes('does not exist'))) {
        setIsDbSynced(false)
        return false
      }
      setIsDbSynced(true)
      return true
    } catch {
      setIsDbSynced(false)
      return false
    }
  }

  const loadPlans = async () => {
    setLoading(true)
    try {
      await checkTableExists()
      const [data, lifetime] = await Promise.all([
        devAdmin.getPlans(),
        getLifetimeSettings(),
      ])
      setPlans(data)
      setLifetimeSettings(lifetime)
    } catch {
      // Usa fallback silencioso
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLifetime = async () => {
    setSavingLifetime(true)
    try {
      await saveLifetimeSettings(lifetimeSettings)
      addToast('Configurações da Licença Vitalícia salvas com sucesso!', 'success')
    } catch (err: any) {
      if (err.message?.includes('schema cache') || err.message?.includes('does not exist')) {
        addToast('Salvo no navegador! Execute o script SQL no Supabase para sincronizar com o banco.', 'warning')
      } else {
        addToast(`Erro ao salvar licença vitalícia: ${err.message}`, 'error')
      }
    } finally {
      setSavingLifetime(false)
    }
  }

  useEffect(() => {
    loadPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFieldChange = (id: string, field: keyof SaasPlan, value: any) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        return { ...p, [field]: value }
      })
    )
  }

  const handleFeatureToggle = (id: string, featureKey: string, checked: boolean) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        return {
          ...p,
          features: {
            ...p.features,
            [featureKey]: checked,
          },
        }
      })
    )
  }

  const handleSave = async (plan: SaasPlan) => {
    setSavingId(plan.id)
    try {
      await devAdmin.updatePlan({
        id: plan.id,
        price_monthly: Number(plan.price_monthly),
        price_annual_monthly: Number(plan.price_annual_monthly),
        max_properties: plan.max_properties ? Number(plan.max_properties) : null,
        max_users: plan.max_users ? Number(plan.max_users) : null,
        features: plan.features,
        popular: Boolean(plan.popular),
        badge: plan.badge || null,
        active: Boolean(plan.active),
      })
      addToast(`Plano "${plan.name}" salvo com sucesso no banco de dados!`, 'success')
      setIsDbSynced(true)
    } catch (err: any) {
      if (err.message?.includes('schema cache') || err.message?.includes('does not exist')) {
        addToast('Alteração salva localmente! Execute o script SQL no Supabase para sincronizar com o banco.', 'warning')
        setIsDbSynced(false)
      } else {
        addToast(`Erro ao salvar plano: ${err.message}`, 'error')
      }
    } finally {
      setSavingId(null)
    }
  }

  const handleCopyMigrationSql = () => {
    const sql = `-- Script de Criação das Tabelas de Planos e Leads do Domus SaaS
-- Cole este script no SQL Editor do seu projeto Supabase e clique em RUN.

CREATE TABLE IF NOT EXISTS public.saas_plans (
  id                   TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{2,30}$'),
  name                 TEXT NOT NULL,
  description          TEXT,
  price_monthly        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  price_annual_monthly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  max_properties       INTEGER,
  max_users            INTEGER,
  features             JSONB NOT NULL DEFAULT '{}'::jsonb,
  popular              BOOLEAN NOT NULL DEFAULT FALSE,
  badge                TEXT,
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'saas_plans_select_all') THEN
    CREATE POLICY "saas_plans_select_all" ON public.saas_plans FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'saas_plans_all_dev') THEN
    CREATE POLICY "saas_plans_all_dev" ON public.saas_plans FOR ALL USING (is_dev()) WITH CHECK (is_dev());
  END IF;
END $$;

INSERT INTO public.saas_plans (id, name, description, price_monthly, price_annual_monthly, max_properties, max_users, features, popular, badge)
VALUES
  ('starter', 'Starter', 'Para corretores autônomos e imobiliárias boutique com até 35 contratos de aluguel.', 99.90, 89.90, 35, 2, '{"subdomain": true, "portal": false, "crm": false, "vistorias": false, "custom_domain": false}'::jsonb, false, null),
  ('pro', 'Profissional', 'Para imobiliárias com carteira ativa que precisam fechar repasses sem atraso.', 299.90, 249.90, 150, 6, '{"subdomain": true, "portal": true, "crm": true, "vistorias": true, "custom_domain": false}'::jsonb, true, 'Mais contratado'),
  ('enterprise', 'Enterprise', 'Para administradoras com mais de 150 imóveis e múltiplos corretores em campo.', 599.90, 549.90, null, null, '{"subdomain": true, "portal": true, "crm": true, "vistorias": true, "custom_domain": true}'::jsonb, false, 'Grandes carteiras'),
  ('lifetime', 'Licença Vitalícia', 'Acesso definitivo ao sistema em pagamento único. Sem mensalidade obrigatória.', 4500, 375, null, null, '{"subdomain": true, "portal": true, "crm": true, "vistorias": true, "custom_domain": true, "annual_maintenance": 490, "spots_total": 15, "spots_taken": 9}'::jsonb, true, 'Lote Fundador')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_annual_monthly = EXCLUDED.price_annual_monthly,
  max_properties = EXCLUDED.max_properties,
  max_users = EXCLUDED.max_users,
  features = EXCLUDED.features,
  popular = EXCLUDED.popular,
  badge = EXCLUDED.badge,
  active = EXCLUDED.active;

-- RPC para o DEV atualizar valores e limites de um plano
CREATE OR REPLACE FUNCTION public.dev_update_plan(
  p_plan_id              TEXT,
  p_price_monthly        NUMERIC,
  p_price_annual_monthly NUMERIC,
  p_max_properties       INTEGER,
  p_max_users            INTEGER,
  p_features             JSONB,
  p_popular              BOOLEAN,
  p_badge                TEXT,
  p_active               BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT is_dev() THEN
    RAISE EXCEPTION 'Apenas o DEV pode atualizar planos.';
  END IF;

  UPDATE public.saas_plans
     SET price_monthly        = p_price_monthly,
         price_annual_monthly = p_price_annual_monthly,
         max_properties       = p_max_properties,
         max_users            = p_max_users,
         features             = p_features,
         popular              = p_popular,
         badge                = p_badge,
         active               = p_active,
         updated_at           = NOW()
   WHERE id = p_plan_id;

  RETURN jsonb_build_object('success', TRUE, 'plan_id', p_plan_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.dev_update_plan TO authenticated;

-- Tabela de Leads
CREATE TABLE IF NOT EXISTS public.saas_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  agency_name     TEXT NOT NULL,
  subdomain       TEXT NOT NULL,
  portfolio_size  TEXT NOT NULL,
  plan_id         TEXT NOT NULL DEFAULT 'pro',
  status          TEXT NOT NULL DEFAULT 'novo',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saas_leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'saas_leads_insert_public') THEN
    CREATE POLICY "saas_leads_insert_public" ON public.saas_leads FOR INSERT WITH CHECK (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'saas_leads_all_dev') THEN
    CREATE POLICY "saas_leads_all_dev" ON public.saas_leads FOR ALL USING (is_dev()) WITH CHECK (is_dev());
  END IF;
END $$;

GRANT ALL ON public.saas_plans TO anon, authenticated, service_role;
GRANT ALL ON public.saas_leads TO anon, authenticated, service_role;
`
    navigator.clipboard.writeText(sql)
    setCopiedSql(true)
    addToast('Script SQL copiado! Cole no SQL Editor do Supabase para criar as tabelas.', 'success')
    setTimeout(() => setCopiedSql(false), 4000)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#AD7B3B]" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando planos...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Banner de Sincronização do Banco se a tabela ainda não existir no Supabase */}
      {!isDbSynced && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Tabela <code className="bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded text-xs font-mono">saas_plans</code> ainda não criada no Supabase
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Os planos abaixo estão carregados no modo de demonstração. Para salvar no banco, basta copiar o script SQL abaixo e rodar no SQL Editor do seu projeto Supabase.
                </p>
              </div>
            </div>
            <Button
              onClick={handleCopyMigrationSql}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 px-3 shrink-0 flex items-center gap-1.5 cursor-pointer rounded-lg shadow-xs"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'SQL Copiado!' : 'Copiar Script SQL'}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">
            Configuração de Planos & Preços (SaaS)
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Os preços, limites de imóveis e recursos editados aqui são aplicados diretamente na Landing Page e no banco de dados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCopyMigrationSql}
            className="text-xs flex items-center gap-1.5 cursor-pointer h-9"
            title="Copiar script para rodar no Supabase"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Database className="w-3.5 h-3.5 text-[#AD7B3B]" />}
            <span>{copiedSql ? 'SQL Copiado' : 'Copiar SQL'}</span>
          </Button>
          <Button
            variant="outline"
            onClick={loadPlans}
            className="text-xs flex items-center gap-1.5 cursor-pointer h-9"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recarregar</span>
          </Button>
        </div>
      </div>

      {/* CARD DE CONFIGURAÇÃO DA LICENÇA VITALÍCIA (SEM MENSALIDADE) */}
      <Card className="border-2 border-[#AD7B3B]/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#AD7B3B]/10 text-[#AD7B3B] rounded-lg">
                  <Crown className="w-5 h-5" />
                </span>
                <CardTitle className="text-xl font-serif font-bold text-foreground">
                  Licença Vitalícia (Sem Mensalidade / Pagamento Único)
                </CardTitle>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#AD7B3B] text-white">
                  Lote Fundador
                </span>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Configure os valores da venda definitiva do sistema. A imobiliária paga uma única vez para ter acesso vitalício.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer bg-background/80 px-3 py-1.5 rounded-lg border border-border">
                <input
                  type="checkbox"
                  checked={lifetimeSettings.active}
                  onChange={(e) => setLifetimeSettings({ ...lifetimeSettings, active: e.target.checked })}
                  className="rounded border-input text-[#AD7B3B] focus:ring-[#AD7B3B] w-4 h-4 cursor-pointer"
                />
                <span>Oferta Ativa no Site</span>
              </label>
              <Button
                onClick={handleSaveLifetime}
                disabled={savingLifetime}
                className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white text-xs h-9 gap-1.5 shadow-sm"
              >
                {savingLifetime ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salvar Licença Vitalícia</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Preço à Vista (R$)</Label>
              <Input
                type="number"
                value={lifetimeSettings.price_cash}
                onChange={(e) => setLifetimeSettings({ ...lifetimeSettings, price_cash: Number(e.target.value) })}
                className="h-9 text-sm font-bold text-emerald-600"
              />
              <span className="text-[10px] text-muted-foreground">Valor em pagamento único</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Parcelado em 12x (R$)</Label>
              <Input
                type="number"
                value={lifetimeSettings.price_installments}
                onChange={(e) => setLifetimeSettings({ ...lifetimeSettings, price_installments: Number(e.target.value) })}
                className="h-9 text-sm font-semibold"
              />
              <span className="text-[10px] text-muted-foreground">Valor de cada parcela (12x)</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Manutenção Anual (R$)</Label>
              <Input
                type="number"
                value={lifetimeSettings.annual_maintenance}
                onChange={(e) => setLifetimeSettings({ ...lifetimeSettings, annual_maintenance: Number(e.target.value) })}
                className="h-9 text-sm"
              />
              <span className="text-[10px] text-muted-foreground">Opcional a partir do 2º ano</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Vagas Totais do Lote</Label>
              <Input
                type="number"
                value={lifetimeSettings.spots_total}
                onChange={(e) => setLifetimeSettings({ ...lifetimeSettings, spots_total: Number(e.target.value) })}
                className="h-9 text-sm"
              />
              <span className="text-[10px] text-muted-foreground">Para gatilho de escassez</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Vagas Preenchidas</Label>
              <Input
                type="number"
                value={lifetimeSettings.spots_taken}
                onChange={(e) => setLifetimeSettings({ ...lifetimeSettings, spots_taken: Number(e.target.value) })}
                className="h-9 text-sm"
              />
              <span className="text-[10px] text-muted-foreground">
                {Math.max(0, lifetimeSettings.spots_total - lifetimeSettings.spots_taken)} vagas restantes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {plans.map((p) => {
          const isSaving = savingId === p.id
          return (
            <Card key={p.id} className="border-border shadow-sm flex flex-col justify-between">
              <CardHeader className="space-y-1.5 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-muted font-bold text-muted-foreground">
                      {p.id}
                    </span>
                    <CardTitle className="text-xl font-serif font-bold">{p.name}</CardTitle>
                  </div>
                  {p.popular && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#AD7B3B] text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs leading-relaxed">
                  {p.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                {/* Preços */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-3">
                  <span className="font-semibold text-foreground block text-xs">Valores de Cobrança</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Mensal (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={p.price_monthly}
                        onChange={(e) => handleFieldChange(p.id, 'price_monthly', e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Anual /mês (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={p.price_annual_monthly}
                        onChange={(e) => handleFieldChange(p.id, 'price_annual_monthly', e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Limites Operacionais */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-3">
                  <span className="font-semibold text-foreground block text-xs">Limites do Plano</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-[#AD7B3B]" />
                        <span>Máx Imóveis</span>
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ilimitado"
                        value={p.max_properties ?? ''}
                        onChange={(e) =>
                          handleFieldChange(
                            p.id,
                            'max_properties',
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-[10px] text-muted-foreground">Vazio = ilimitado</span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#AD7B3B]" />
                        <span>Máx Usuários</span>
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ilimitado"
                        value={p.max_users ?? ''}
                        onChange={(e) =>
                          handleFieldChange(
                            p.id,
                            'max_users',
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-[10px] text-muted-foreground">Vazio = ilimitado</span>
                    </div>
                  </div>
                </div>

                {/* Permissões e Módulos */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5">
                  <span className="font-semibold text-foreground block text-xs">Módulos Liberados</span>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(p.features.crm)}
                      onChange={(e) => handleFeatureToggle(p.id, 'crm', e.target.checked)}
                      className="rounded border-input text-[#AD7B3B] focus:ring-[#AD7B3B]"
                    />
                    <span>CRM de Atendimento & Funil de Leads</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(p.features.portal)}
                      onChange={(e) => handleFeatureToggle(p.id, 'portal', e.target.checked)}
                      className="rounded border-input text-[#AD7B3B] focus:ring-[#AD7B3B]"
                    />
                    <span>Portal do Inquilino & Proprietário</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(p.features.vistorias)}
                      onChange={(e) => handleFeatureToggle(p.id, 'vistorias', e.target.checked)}
                      className="rounded border-input text-[#AD7B3B] focus:ring-[#AD7B3B]"
                    />
                    <span>Vistorias Digitais com Fotos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(p.features.subdomain)}
                      onChange={(e) => handleFeatureToggle(p.id, 'subdomain', e.target.checked)}
                      className="rounded border-input text-[#AD7B3B] focus:ring-[#AD7B3B]"
                    />
                    <span>Subdomínio Próprio (.gestaodomus.com.br)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(p.features.custom_domain)}
                      onChange={(e) => handleFeatureToggle(p.id, 'custom_domain', e.target.checked)}
                      className="rounded border-input text-[#AD7B3B] focus:ring-[#AD7B3B]"
                    />
                    <span>Domínio Próprio Customizado (exclusivo)</span>
                  </label>
                </div>

                {/* Badge e Destaque */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Badge / Selo</Label>
                    <Input
                      placeholder="Ex: Mais contratado"
                      value={p.badge ?? ''}
                      onChange={(e) => handleFieldChange(p.id, 'badge', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer text-xs pb-2">
                      <input
                        type="checkbox"
                        checked={Boolean(p.popular)}
                        onChange={(e) => handleFieldChange(p.id, 'popular', e.target.checked)}
                        className="rounded border-input text-[#AD7B3B] focus:ring-[#AD7B3B]"
                      />
                      <span className="font-medium text-foreground">Plano em Destaque</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => handleSave(p)}
                    disabled={isSaving}
                    className="w-full h-9 bg-[#17323D] hover:bg-[#17323D]/90 text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Alterações de {p.name}</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
