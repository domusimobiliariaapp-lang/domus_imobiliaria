-- Migration: Vistorias Digitais Fotográficas com Checklist na Nuvem (R2)
--
-- Registra vistorias de entrada, saída e periódicas de imóveis, com itens por cômodo,
-- fotos salvas no Cloudflare R2 e aprovação pelo portal do cliente.

CREATE TABLE IF NOT EXISTS public.property_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
  inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'periodica')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'contestada', 'finalizada')),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,

  general_notes TEXT,
  tenant_comments TEXT,
  tenant_approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES public.property_inspections(id) ON DELETE CASCADE,

  room TEXT NOT NULL,
  item_name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('novo', 'bom', 'regular', 'com_avarias')),
  notes TEXT,
  photos TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspections_org_prop ON public.property_inspections(org_id, property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_lease ON public.property_inspections(lease_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection ON public.inspection_items(inspection_id);

-- Triggers
DROP TRIGGER IF EXISTS trg_inspections_updated_at ON public.property_inspections;
CREATE TRIGGER trg_inspections_updated_at
  BEFORE UPDATE ON public.property_inspections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_inspections_org_id ON public.property_inspections;
CREATE TRIGGER trg_set_inspections_org_id
  BEFORE INSERT OR UPDATE ON public.property_inspections
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS trg_set_inspection_items_org_id ON public.inspection_items;
CREATE TRIGGER trg_set_inspection_items_org_id
  BEFORE INSERT OR UPDATE ON public.inspection_items
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

-- RLS
ALTER TABLE public.property_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;

-- Equipe interna
DROP POLICY IF EXISTS "Internal team can manage inspections" ON public.property_inspections;
CREATE POLICY "Internal team can manage inspections" ON public.property_inspections
  FOR ALL USING (public.is_internal_team() AND public.in_current_org(org_id))
  WITH CHECK (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can manage inspection items" ON public.inspection_items;
CREATE POLICY "Internal team can manage inspection items" ON public.inspection_items
  FOR ALL USING (public.is_internal_team() AND public.in_current_org(org_id))
  WITH CHECK (public.is_internal_team() AND public.in_current_org(org_id));

-- Clientes (inquilinos e proprietários podem visualizar a vistoria do seu imóvel/contrato)
DROP POLICY IF EXISTS "Clients can view their inspections" ON public.property_inspections;
CREATE POLICY "Clients can view their inspections" ON public.property_inspections FOR SELECT
  USING (
    public.is_client() AND (
      lease_id IN (SELECT id FROM public.leases WHERE tenant_id = auth.uid()) OR
      property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can view inspection items" ON public.inspection_items;
CREATE POLICY "Clients can view inspection items" ON public.inspection_items FOR SELECT
  USING (
    public.is_client() AND inspection_id IN (
      SELECT id FROM public.property_inspections WHERE (
        lease_id IN (SELECT id FROM public.leases WHERE tenant_id = auth.uid()) OR
        property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
      )
    )
  );

-- Inquilino pode aprovar ou contestar
DROP POLICY IF EXISTS "Tenants can update inspection response" ON public.property_inspections;
CREATE POLICY "Tenants can update inspection response" ON public.property_inspections FOR UPDATE
  USING (
    public.is_client() AND lease_id IN (SELECT id FROM public.leases WHERE tenant_id = auth.uid())
  )
  WITH CHECK (
    public.is_client() AND lease_id IN (SELECT id FROM public.leases WHERE tenant_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_inspections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_items TO authenticated;
