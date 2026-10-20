-- Migration: backfill do org_id
--
-- A 00003 reescreveu as políticas de RLS e a 00004 exige org_id NOT NULL. Esta
-- migration é o passo intermediário que torna a 00004 aplicável: sem ela, o
-- NOT NULL falha por haver linhas órfãs.
--
-- O conteúdo é o SQL que estava no README-multi-tenant.md, agora versionado
-- para que a sequência de migrations seja executável sem passo manual.

-- ============================================================
-- 1. A CONTA DEV
-- ============================================================

-- admin@domus.com era o admin da Domus e passa a ser a conta DEV. Precisa
-- acontecer ANTES do preenchimento abaixo: o UPDATE de profiles pula quem tem
-- role='dev', e é essa_skip que deixa a conta sem org — que é como is_dev()
-- a identifica.
--
-- Efeito colateral esperado: a conta perde o acesso a /admin e passa a usar
-- /dev. A org 'domus' continua existindo e vazia; o admin dela se cria pelo
-- painel /dev.
UPDATE public.profiles
   SET role = 'dev'
 WHERE email = 'admin@domus.com'
   AND role <> 'dev';

-- ============================================================
-- 2. A ORGANIZAÇÃO DA DOMUS
-- ============================================================

-- A 00002 já cria a org 'domus'; o ON CONFLICT mantém a migration idempotente.
INSERT INTO public.organizations (slug, name)
VALUES ('domus', 'Domus Imobiliária')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. ATRIBUIÇÃO
-- ============================================================

-- Tudo o que existe hoje é da Domus. Para um sistema onde alguma linha já
-- pertença a outra imobiliária, estes UPDATE precisam ser filtrados por
-- tabela em vez de um WHERE org_id IS NULL genérico — o RLS não avisa quando o
-- backfill erra, ele só passa a esconder a linha da equipe certa.
--
-- O trigger set_org_id não atrapalha: sem sessão autenticada (é o caso de uma
-- migration) ele retorna cedo e respeita o valor informado.

UPDATE public.profiles
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL
   AND role <> 'dev';

UPDATE public.clients
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL;

UPDATE public.properties
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL;

UPDATE public.leases
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL;

UPDATE public.sales
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL;

UPDATE public.payments
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL;

UPDATE public.documents
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL;

UPDATE public.lease_history
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL;

UPDATE public.notifications
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL;

UPDATE public.company_settings
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL;

UPDATE public.configuracoes
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
 WHERE org_id IS NULL;

-- ============================================================
-- 4. CONFERÊNCIA
-- ============================================================

-- Não aborta: a 00004 tem o próprio portão e conta as órfãs. Aqui só se avisa,
-- para o resultado aparecer no log de quem aplicou a migration.
DO $$
DECLARE
  restantes BIGINT;
BEGIN
  SELECT (SELECT count(*) FROM public.profiles        WHERE org_id IS NULL AND role <> 'dev')
       + (SELECT count(*) FROM public.clients         WHERE org_id IS NULL)
       + (SELECT count(*) FROM public.properties      WHERE org_id IS NULL)
       + (SELECT count(*) FROM public.leases          WHERE org_id IS NULL)
       + (SELECT count(*) FROM public.sales           WHERE org_id IS NULL)
       + (SELECT count(*) FROM public.payments        WHERE org_id IS NULL)
       + (SELECT count(*) FROM public.documents       WHERE org_id IS NULL)
       + (SELECT count(*) FROM public.lease_history   WHERE org_id IS NULL)
       + (SELECT count(*) FROM public.company_settings WHERE org_id IS NULL)
       + (SELECT count(*) FROM public.configuracoes   WHERE org_id IS NULL)
    INTO restantes;

  IF restantes > 0 THEN
    RAISE WARNING 'Backfill deixou % linhas sem org_id — a 00004 vai abortar.', restantes;
  ELSE
    RAISE NOTICE 'Backfill concluído: nenhuma linha sem org_id.';
  END IF;
END $$;
