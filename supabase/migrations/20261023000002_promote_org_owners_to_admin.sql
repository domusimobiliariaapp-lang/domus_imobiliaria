-- Migration: Garante papel de ADMIN e plano vitalício para donos de organização
--
-- Evita que quem compra o SaaS ou cria uma nova imobiliária caia no papel 'cliente'.
-- Quem é proprietário ou primeiro membro de uma organização deve ser 'admin' da empresa.

-- 1. Promove perfis vinculados a organizações que ficaram com papel 'cliente' por engano
UPDATE public.profiles p
SET 
  role = 'admin'::public.user_role,
  updated_at = NOW()
WHERE p.org_id IS NOT NULL
  AND p.role = 'cliente'
  AND (
    -- É o e-mail cadastrado na própria organização
    EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = p.org_id AND LOWER(o.email) = LOWER(p.email)
    )
    -- Ou é o único usuário da organização
    OR (
      SELECT COUNT(*) FROM public.profiles p2 WHERE p2.org_id = p.org_id
    ) = 1
  );

-- 2. Sincroniza o app_metadata no auth.users para refletir a role 'admin'
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) 
  || jsonb_build_object('role', 'admin', 'org_id', p.org_id)
FROM public.profiles p
WHERE p.id = u.id
  AND p.role = 'admin'
  AND p.org_id IS NOT NULL
  AND (
    u.raw_app_meta_data->>'role' IS NULL 
    OR u.raw_app_meta_data->>'role' = 'cliente'
  );

-- 3. Garante que organizações com plano vitalício fiquem com status 'active'
UPDATE public.organizations
SET 
  subscription_status = 'active',
  trial_ends_at = NULL,
  updated_at = NOW()
WHERE plan_id = 'lifetime'
  AND subscription_status != 'active';
