-- Migration: Sistema de Planos, Limites e Assinaturas (SaaS Multi-tenant)
--
-- 1. Cria tabela saas_plans com preços, limites e recursos editáveis pela conta DEV.
-- 2. Vincula organizações ao seu respectivo plano e estado de assinatura (trial de 3 dias, ativo, bloqueado).
-- 3. Valida no banco de dados (trigger) o limite de imóveis por plano.
-- 4. Cria RPCs seguras para o DEV gerenciar preços e limites sem redeploy.

CREATE TABLE IF NOT EXISTS public.saas_plans (
  id                   TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{2,30}$'),
  name                 TEXT NOT NULL,
  description          TEXT,
  price_monthly        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  price_annual_monthly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  max_properties       INTEGER, -- NULL = ilimitado
  max_users            INTEGER, -- NULL = ilimitado
  features             JSONB NOT NULL DEFAULT '{}'::jsonb,
  popular              BOOLEAN NOT NULL DEFAULT FALSE,
  badge                TEXT,
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.saas_plans IS
  'Planos de assinatura do Domus SaaS. Gerenciados exclusivamente pela conta DEV.';

-- Habilita RLS
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;

-- Leitura pública (Landing page e clientes precisam ver planos ativos; DEV vê todos)
DROP POLICY IF EXISTS "saas_plans_select_all" ON public.saas_plans;
CREATE POLICY "saas_plans_select_all"
  ON public.saas_plans
  FOR SELECT
  USING (active = TRUE OR is_dev());

-- Apenas a conta DEV pode alterar, criar ou remover planos
DROP POLICY IF EXISTS "saas_plans_insert_dev" ON public.saas_plans;
CREATE POLICY "saas_plans_insert_dev"
  ON public.saas_plans
  FOR INSERT
  WITH CHECK (is_dev());

DROP POLICY IF EXISTS "saas_plans_update_dev" ON public.saas_plans;
CREATE POLICY "saas_plans_update_dev"
  ON public.saas_plans
  FOR UPDATE
  USING (is_dev())
  WITH CHECK (is_dev());

DROP POLICY IF EXISTS "saas_plans_delete_dev" ON public.saas_plans;
CREATE POLICY "saas_plans_delete_dev"
  ON public.saas_plans
  FOR DELETE
  USING (is_dev());

-- Inserção dos planos iniciais do Domus
INSERT INTO public.saas_plans (
  id, name, description, price_monthly, price_annual_monthly, max_properties, max_users, features, popular, badge, active
) VALUES
(
  'starter',
  'Starter',
  'Para corretores autônomos e imobiliárias boutique com até 35 contratos de aluguel.',
  99.90,
  89.90,
  35,
  2,
  '{"crm": false, "portal": false, "vistorias": false, "subdomain": true, "custom_domain": false}'::jsonb,
  FALSE,
  NULL,
  TRUE
),
(
  'pro',
  'Profissional',
  'Para imobiliárias com carteira ativa que precisam fechar repasses sem atraso.',
  299.90,
  249.90,
  150,
  6,
  '{"crm": true, "portal": true, "vistorias": true, "subdomain": true, "custom_domain": false}'::jsonb,
  TRUE,
  'Mais contratado',
  TRUE
),
(
  'enterprise',
  'Enterprise',
  'Para administradoras com mais de 150 imóveis e múltiplos corretores em campo.',
  599.90,
  549.90,
  NULL,
  NULL,
  '{"crm": true, "portal": true, "vistorias": true, "subdomain": true, "custom_domain": true}'::jsonb,
  FALSE,
  'Grandes carteiras',
  TRUE
),
(
  'lifetime',
  'Licença Vitalícia',
  'Acesso definitivo ao sistema em pagamento único. Sem mensalidade obrigatória.',
  4500.00,
  375.00,
  NULL,
  NULL,
  '{"crm": true, "portal": true, "vistorias": true, "subdomain": true, "custom_domain": true, "annual_maintenance": 490, "spots_total": 15, "spots_taken": 9}'::jsonb,
  TRUE,
  'Lote Fundador',
  TRUE
)
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

-- Adiciona campos de plano e assinatura na tabela organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.saas_plans(id) DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days');

-- Ajusta organizações existentes para Enterprise ativa
UPDATE public.organizations
   SET plan_id = 'enterprise',
       subscription_status = 'active',
       trial_ends_at = NULL
 WHERE plan_id IS NULL OR plan_id = 'pro';

-- Validação de limite de imóveis por plano no banco de dados
CREATE OR REPLACE FUNCTION public.check_property_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan_id        TEXT;
  v_max_properties INTEGER;
  v_current_count  INTEGER;
  v_status         TEXT;
  v_trial_ends_at  TIMESTAMPTZ;
BEGIN
  -- Conta DEV não tem limite de imóveis
  IF is_dev() THEN
    RETURN NEW;
  END IF;

  -- Se org_id não estiver preenchido, usa a org atual
  IF NEW.org_id IS NULL THEN
    NEW.org_id := current_org_id();
  END IF;

  IF NEW.org_id IS NULL THEN
    RAISE EXCEPTION 'Imóvel sem organização vinculada.';
  END IF;

  -- Busca o plano e o status da organização
  SELECT o.plan_id, o.subscription_status, o.trial_ends_at, p.max_properties
    INTO v_plan_id, v_status, v_trial_ends_at, v_max_properties
    FROM public.organizations o
    LEFT JOIN public.saas_plans p ON p.id = o.plan_id
   WHERE o.id = NEW.org_id;

  -- Se a assinatura estiver bloqueada ou cancelada
  IF v_status = 'blocked' OR v_status = 'canceled' THEN
    RAISE EXCEPTION 'A assinatura da sua imobiliária está suspensa. Entre em contato com o suporte para regularizar o acesso.';
  END IF;

  -- Se estiver em trial e o prazo de 3 dias já tiver expirado
  IF v_status = 'trial' AND v_trial_ends_at IS NOT NULL AND v_trial_ends_at < NOW() THEN
    RAISE EXCEPTION 'Seu período de teste de 3 dias expirou. Escolha um plano para continuar cadastrando imóveis.';
  END IF;

  -- Se o plano tiver limite máximo de imóveis
  IF v_max_properties IS NOT NULL THEN
    SELECT COUNT(*)
      INTO v_current_count
      FROM public.properties
     WHERE org_id = NEW.org_id;

    IF v_current_count >= v_max_properties THEN
      RAISE EXCEPTION 'Limite de % imóveis atingido para o plano da sua imobiliária. Faça upgrade do plano para cadastrar mais imóveis.', v_max_properties;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_property_plan_limit ON public.properties;
CREATE TRIGGER trg_check_property_plan_limit
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.check_property_plan_limit();

-- RPC pública para obter os planos ativos (usada pela Landing Page e simuladores)
CREATE OR REPLACE FUNCTION public.get_public_plans()
RETURNS TABLE (
  id                   TEXT,
  name                 TEXT,
  description          TEXT,
  price_monthly        NUMERIC,
  price_annual_monthly NUMERIC,
  max_properties       INTEGER,
  max_users            INTEGER,
  features             JSONB,
  popular              BOOLEAN,
  badge                TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id, name, description, price_monthly, price_annual_monthly,
         max_properties, max_users, features, popular, badge
    FROM public.saas_plans
   WHERE active = TRUE
   ORDER BY price_monthly ASC;
$$;

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

-- RPC para o DEV alterar o plano e status de uma organização
CREATE OR REPLACE FUNCTION public.dev_set_org_subscription(
  p_org_id              UUID,
  p_plan_id             TEXT,
  p_subscription_status TEXT,
  p_extend_days         INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_trial TIMESTAMPTZ;
BEGIN
  IF NOT is_dev() THEN
    RAISE EXCEPTION 'Apenas o DEV pode gerenciar assinaturas de organizações.';
  END IF;

  IF p_subscription_status = 'trial' THEN
    v_new_trial := NOW() + (p_extend_days || ' days')::INTERVAL;
  ELSE
    v_new_trial := NULL;
  END IF;

  UPDATE public.organizations
     SET plan_id             = p_plan_id,
         subscription_status = p_subscription_status,
         trial_ends_at       = COALESCE(v_new_trial, trial_ends_at),
         updated_at          = NOW()
   WHERE id = p_org_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'org_id', p_org_id,
    'plan_id', p_plan_id,
    'status', p_subscription_status
  );
END;
$$;

-- Permissões de tabela
GRANT SELECT ON public.saas_plans TO anon, authenticated;
GRANT ALL ON public.saas_plans TO service_role;

-- Atualiza dev_org_names() para incluir plan_id, subscription_status e trial_ends_at
DROP FUNCTION IF EXISTS public.dev_org_names();

CREATE FUNCTION public.dev_org_names()
RETURNS TABLE (
  id                  UUID,
  name                TEXT,
  slug                TEXT,
  active              BOOLEAN,
  cnpj                TEXT,
  phone               TEXT,
  whatsapp            TEXT,
  email               TEXT,
  logo_url            TEXT,
  address             TEXT,
  plan_id             TEXT,
  subscription_status TEXT,
  trial_ends_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.name, o.slug, o.active, o.cnpj, o.phone, o.whatsapp,
         o.email, o.logo_url, o.address, o.plan_id, o.subscription_status,
         o.trial_ends_at, o.created_at, o.updated_at
    FROM public.organizations o
   WHERE public.is_dev()
   ORDER BY o.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.dev_org_names() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dev_org_names() TO authenticated;
