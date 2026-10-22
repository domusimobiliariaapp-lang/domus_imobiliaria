-- Migration: Gerenciamento de Módulos por Login e Organização no Painel DEV
--
-- 1. Adiciona coluna enabled_modules em profiles (para controle por login/usuário individual)
-- 2. Cria RPC dev_set_user_modules com verificação SECURITY DEFINER e is_dev()
-- 3. Cria RPC dev_set_org_modules com verificação SECURITY DEFINER e is_dev()

-- 1. Campo de módulos individuais no perfil do usuário
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS enabled_modules TEXT[];

COMMENT ON COLUMN public.profiles.enabled_modules IS
  'Módulos específicos habilitados para este login. Se nulo ou vazio, herda os módulos da organização.';

-- 2. RPC para o DEV atualizar os módulos de um login individual
CREATE OR REPLACE FUNCTION public.dev_set_user_modules(
  p_user_id UUID,
  p_modules TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  IF NOT is_dev() THEN
    RAISE EXCEPTION 'Apenas a conta DEV pode gerenciar módulos de logins.';
  END IF;

  SELECT email INTO v_user_email FROM public.profiles WHERE id = p_user_id;

  UPDATE public.profiles
     SET enabled_modules = p_modules,
         updated_at = NOW()
   WHERE id = p_user_id;

  -- Registra auditoria
  INSERT INTO public.admin_audit_log (
    actor_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    auth.uid(),
    'update_user_modules',
    'profiles',
    p_user_id,
    jsonb_build_object('modules', p_modules, 'email', v_user_email)
  );

  RETURN jsonb_build_object('success', TRUE, 'user_id', p_user_id, 'modules', p_modules);
END;
$$;

-- 3. RPC para o DEV atualizar os módulos da organização inteira
CREATE OR REPLACE FUNCTION public.dev_set_org_modules(
  p_org_id UUID,
  p_modules TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org_name TEXT;
BEGIN
  IF NOT is_dev() THEN
    RAISE EXCEPTION 'Apenas a conta DEV pode gerenciar módulos de organizações.';
  END IF;

  SELECT name INTO v_org_name FROM public.organizations WHERE id = p_org_id;

  UPDATE public.organizations
     SET enabled_modules = p_modules,
         updated_at = NOW()
   WHERE id = p_org_id;

  -- Registra auditoria
  INSERT INTO public.admin_audit_log (
    actor_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    auth.uid(),
    'update_org_modules',
    'organizations',
    p_org_id,
    jsonb_build_object('modules', p_modules, 'org_name', v_org_name)
  );

  RETURN jsonb_build_object('success', TRUE, 'org_id', p_org_id, 'modules', p_modules);
END;
$$;
