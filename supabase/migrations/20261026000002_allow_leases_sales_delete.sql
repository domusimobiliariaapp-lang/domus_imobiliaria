-- Migration: Permitir exclusão de locações, vendas e pagamentos por administradores/equipe interna
--
-- O schema original do Supabase continha políticas RLS para SELECT, INSERT e UPDATE nas tabelas
-- 'leases', 'sales' e 'payments', mas OMITIU as políticas de DELETE.
-- Sem uma política de DELETE com RLS ativado, o PostgreSQL/Supabase rejeita silenciosamente qualquer
-- tentativa de exclusão de contratos feita pelo frontend autenticado.
-- Além disso, atualizamos a chave estrangeira em payments para ON DELETE CASCADE.

-- 1. Políticas de exclusão para leases (Locações / Contratos)
DROP POLICY IF EXISTS "Internal team can delete leases" ON leases;
CREATE POLICY "Internal team can delete leases" ON leases
FOR DELETE
USING (
  (public.in_current_org(org_id) AND public.is_internal_team()) 
  OR public.is_dev()
);

-- 2. Políticas de exclusão para sales (Vendas)
DROP POLICY IF EXISTS "Internal team can delete sales" ON sales;
CREATE POLICY "Internal team can delete sales" ON sales
FOR DELETE
USING (
  (public.in_current_org(org_id) AND public.is_internal_team()) 
  OR public.is_dev()
);

-- 3. Políticas de exclusão para payments (Pagamentos / Parcelas)
DROP POLICY IF EXISTS "Internal team can delete payments" ON payments;
CREATE POLICY "Internal team can delete payments" ON payments
FOR DELETE
USING (
  (public.in_current_org(org_id) AND public.is_internal_team()) 
  OR public.is_dev()
);

-- 4. Garantir que payments tenha cascade ao remover contrato
DO $$
BEGIN
  -- Se existir a constraint restritiva antiga, altera para CASCADE
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_lease_id_fkey' AND table_name = 'payments'
  ) THEN
    ALTER TABLE public.payments DROP CONSTRAINT payments_lease_id_fkey;
    ALTER TABLE public.payments 
      ADD CONSTRAINT payments_lease_id_fkey 
      FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE;
  END IF;
END $$;
