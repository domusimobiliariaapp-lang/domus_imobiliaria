-- Migration: CRM de Leads e Atendimentos com Radar de Cruzamento (Smart Match)
--
-- Gerencia o funil comercial de potenciais locatários e compradores antes da assinatura
-- do contrato. Registra preferências (tipo, orçamento, quartos, bairros) e histórico de
-- interações (WhatsApp, ligações, visitas).

CREATE TYPE public.crm_lead_stage AS ENUM ('novo', 'contato', 'visita', 'proposta', 'fechado', 'perdido');
CREATE TYPE public.crm_interest_type AS ENUM ('locacao', 'venda', 'ambos');

CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  origin TEXT DEFAULT 'site',
  
  interest_type public.crm_interest_type NOT NULL DEFAULT 'locacao',
  property_type TEXT,
  max_budget NUMERIC(12,2),
  min_bedrooms INTEGER DEFAULT 1,
  preferred_neighborhoods TEXT[] DEFAULT '{}',

  stage public.crm_lead_stage NOT NULL DEFAULT 'novo',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'ligacao', 'visita', 'email', 'nota')),
  notes TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_org_stage ON public.crm_leads(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned ON public.crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_interest ON public.crm_leads(interest_type);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_lead ON public.crm_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_org ON public.crm_interactions(org_id);

-- Triggers
DROP TRIGGER IF EXISTS trg_crm_leads_updated_at ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_crm_leads_org_id ON public.crm_leads;
CREATE TRIGGER trg_set_crm_leads_org_id
  BEFORE INSERT OR UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS trg_set_crm_interactions_org_id ON public.crm_interactions;
CREATE TRIGGER trg_set_crm_interactions_org_id
  BEFORE INSERT OR UPDATE ON public.crm_interactions
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

-- RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal team can view crm_leads" ON public.crm_leads;
CREATE POLICY "Internal team can view crm_leads" ON public.crm_leads FOR SELECT
  USING (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can insert crm_leads" ON public.crm_leads;
CREATE POLICY "Internal team can insert crm_leads" ON public.crm_leads FOR INSERT
  WITH CHECK (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can update crm_leads" ON public.crm_leads;
CREATE POLICY "Internal team can update crm_leads" ON public.crm_leads FOR UPDATE
  USING (public.is_internal_team() AND public.in_current_org(org_id))
  WITH CHECK (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can delete crm_leads" ON public.crm_leads;
CREATE POLICY "Internal team can delete crm_leads" ON public.crm_leads FOR DELETE
  USING (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can view crm_interactions" ON public.crm_interactions;
CREATE POLICY "Internal team can view crm_interactions" ON public.crm_interactions FOR SELECT
  USING (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can insert crm_interactions" ON public.crm_interactions;
CREATE POLICY "Internal team can insert crm_interactions" ON public.crm_interactions FOR INSERT
  WITH CHECK (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can delete crm_interactions" ON public.crm_interactions;
CREATE POLICY "Internal team can delete crm_interactions" ON public.crm_interactions FOR DELETE
  USING (public.is_internal_team() AND public.in_current_org(org_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_interactions TO authenticated;
