-- ==============================================================================
-- Migration: Liberar exclusão de dados e integridade em cascata
-- Executar no SQL Editor do Supabase (gestaodomus)
-- ==============================================================================

-- 1. CORRIGIR RESTRIÇÕES DE CHAVE ESTRANGEIRA (FOREIGN KEYS)
-- Permite que imóveis de teste sejam excluídos sem travar por vendas ou locações antigas.

-- Tabela sales -> properties (ON DELETE CASCADE)
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_property_id_fkey;
ALTER TABLE public.sales 
  ADD CONSTRAINT sales_property_id_fkey 
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- Tabela leases -> properties (ON DELETE CASCADE)
ALTER TABLE public.leases DROP CONSTRAINT IF EXISTS leases_property_id_fkey;
ALTER TABLE public.leases 
  ADD CONSTRAINT leases_property_id_fkey 
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- Tabela payments -> leases (ON DELETE CASCADE)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_lease_id_fkey;
ALTER TABLE public.payments 
  ADD CONSTRAINT payments_lease_id_fkey 
  FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE;

-- 2. POLÍTICAS DE EXCLUSÃO RLS (ROW-LEVEL SECURITY)

-- Exclusão de Clientes em 'profiles' (apenas clientes, protegendo a equipe)
DROP POLICY IF EXISTS "Internal team can delete client profiles" ON public.profiles;
CREATE POLICY "Internal team can delete client profiles" ON public.profiles
FOR DELETE
USING (
  role = 'cliente' 
  AND (public.in_current_org(org_id) AND public.is_internal_team() OR public.is_dev())
);

-- Exclusão de Locações em 'leases'
DROP POLICY IF EXISTS "Internal team can delete leases" ON public.leases;
CREATE POLICY "Internal team can delete leases" ON public.leases
FOR DELETE
USING (
  (public.in_current_org(org_id) AND public.is_internal_team()) 
  OR public.is_dev()
);

-- Exclusão de Vendas em 'sales'
DROP POLICY IF EXISTS "Internal team can delete sales" ON public.sales;
CREATE POLICY "Internal team can delete sales" ON public.sales
FOR DELETE
USING (
  (public.in_current_org(org_id) AND public.is_internal_team()) 
  OR public.is_dev()
);

-- Exclusão de Pagamentos em 'payments'
DROP POLICY IF EXISTS "Internal team can delete payments" ON public.payments;
CREATE POLICY "Internal team can delete payments" ON public.payments
FOR DELETE
USING (
  (public.in_current_org(org_id) AND public.is_internal_team()) 
  OR public.is_dev()
);

-- Exclusão de Imóveis em 'properties'
DROP POLICY IF EXISTS "Internal team can delete properties" ON public.properties;
CREATE POLICY "Internal team can delete properties" ON public.properties
FOR DELETE
USING (
  (public.in_current_org(org_id) AND public.is_internal_team()) 
  OR public.is_dev()
);
