-- Migration: Tabela de Leads do SaaS e Conversão Direta no Painel DEV
--
-- 1. Cria tabela saas_leads para salvar os cadastros de teste de 3 dias da Landing Page.
-- 2. Permite inserção anônima (para qualquer visitante do site).
-- 3. Leitura e gestão restritas à conta DEV.

CREATE TABLE IF NOT EXISTS public.saas_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  agency_name     TEXT NOT NULL,
  subdomain       TEXT NOT NULL,
  portfolio_size  TEXT NOT NULL,
  plan_id         TEXT NOT NULL DEFAULT 'pro',
  status          TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'convertido', 'descartado')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.saas_leads IS
  'Leads e solicitações de teste de 3 dias gerados pela Landing Page do Domus SaaS.';

ALTER TABLE public.saas_leads ENABLE ROW LEVEL SECURITY;

-- Visitantes do site podem inserir solicitações (anônimo ou autenticado)
DROP POLICY IF EXISTS "saas_leads_insert_public" ON public.saas_leads;
CREATE POLICY "saas_leads_insert_public"
  ON public.saas_leads
  FOR INSERT
  WITH CHECK (TRUE);

-- Apenas a conta DEV pode visualizar e gerenciar os leads do SaaS
DROP POLICY IF EXISTS "saas_leads_select_dev" ON public.saas_leads;
CREATE POLICY "saas_leads_select_dev"
  ON public.saas_leads
  FOR SELECT
  USING (is_dev());

DROP POLICY IF EXISTS "saas_leads_update_dev" ON public.saas_leads;
CREATE POLICY "saas_leads_update_dev"
  ON public.saas_leads
  FOR UPDATE
  USING (is_dev())
  WITH CHECK (is_dev());

DROP POLICY IF EXISTS "saas_leads_delete_dev" ON public.saas_leads;
CREATE POLICY "saas_leads_delete_dev"
  ON public.saas_leads
  FOR DELETE
  USING (is_dev());

-- Permissões
GRANT INSERT ON public.saas_leads TO anon, authenticated;
GRANT ALL ON public.saas_leads TO service_role;
