-- Migration: Permitir que administradores e equipe interna excluam perfis de clientes
--
-- A política RLS em profiles possuía SELECT, INSERT e UPDATE, mas não DELETE.
-- Esta policy permite que admins e corretores excluam clientes da sua própria organização
-- (apenas registros onde role = 'cliente', protegendo usuários de equipe/admin).

DROP POLICY IF EXISTS "Internal team can delete client profiles" ON profiles;

CREATE POLICY "Internal team can delete client profiles" ON profiles
FOR DELETE
USING (
  role = 'cliente' 
  AND (public.in_current_org(org_id) AND public.is_internal_team() OR public.is_dev())
);
