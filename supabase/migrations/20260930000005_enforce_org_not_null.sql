-- Migration: org_id obrigatório (POR TRÁS DE PORTÃO)
--
-- ⛔ NÃO APLIQUE ESTA MIGRATION ANTES DE RODAR O BACKFILL DA FASE 4.
--
-- A migration 03 já reescreveu as policies de RLS, e org_id ainda está NULL em
-- todas as linhas. A esta altura o sistema aparece vazio — é o estado esperado.
-- Rode o backfill (o SQL está no arquivo README-multi-tenant.md deste diretório),
-- confirme que as contagens de órfãos voltaram a zero, e só então aplique isto.
--
-- Enquanto org_id for NULL, uma policy que compara org_id = current_org_id() não
-- casa nenhuma linha. A ordem importa: policies antes do backfill dão sistema
-- vazio; NOT NULL antes do backfill dá erro de migração.
--
-- profiles fica de fora de propósito: é lá que o DEV vive com org_id NULL.

DO $$
DECLARE
  orfaos BIGINT;
BEGIN
  -- Portão: se sobrou alguma linha sem org, aborta com uma mensagem que diz
  -- o que fazer, em vez de estourar um NOT NULL genérico no meio da migration.
  --
  -- profiles é a única exceção: a conta DEV fica com org_id NULL por definição,
  -- e uma conta recém-criada e ainda não vinculada usa o mesmo estado. Sem
  -- excluir o DEV, este portão nunca passaria depois que ele existir.
  SELECT (SELECT count(*) FROM profiles     WHERE org_id IS NULL AND role <> 'dev')
       + (SELECT count(*) FROM clients      WHERE org_id IS NULL)
       + (SELECT count(*) FROM properties   WHERE org_id IS NULL)
       + (SELECT count(*) FROM leases       WHERE org_id IS NULL)
       + (SELECT count(*) FROM sales        WHERE org_id IS NULL)
       + (SELECT count(*) FROM payments     WHERE org_id IS NULL)
       + (SELECT count(*) FROM documents    WHERE org_id IS NULL)
       + (SELECT count(*) FROM lease_history WHERE org_id IS NULL)
       + (SELECT count(*) FROM company_settings WHERE org_id IS NULL)
       + (SELECT count(*) FROM configuracoes WHERE org_id IS NULL)
    INTO orfaos;

  IF orfaos > 0 THEN
    RAISE EXCEPTION
      'Migration abortada: % linhas ainda sem org_id. Rode o backfill manual antes (ver README-multi-tenant.md).',
      orfaos;
  END IF;
END $$;

ALTER TABLE public.properties     ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.leases         ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.sales          ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.payments       ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.documents      ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.lease_history  ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.company_settings ALTER COLUMN org_id SET NOT NULL;

-- notifications fica nullable: a coluna segue o destinatário, e o DEV não tem
-- org. Uma notificação para a conta DEV ficaria org_id NULL e quebraria aqui.
-- A policy já garante que cada usuário só lê as próprias notificações.

-- clients: todo cliente pertence a uma imobiliária, mesmo antes de ter login.
ALTER TABLE public.clients        ALTER COLUMN org_id SET NOT NULL;

-- profiles é a única exceção: é lá que a conta DEV fica, por definição sem org.
-- Uma conta recém-criada e ainda não vinculada também usa esse estado.
ALTER TABLE public.profiles       ALTER COLUMN org_id DROP NOT NULL;

-- company_settings sai definitively do estado singleton: uma linha por org,
-- e a chave id fixa deixa de ter sentido.
DROP INDEX IF EXISTS idx_company_settings_org;
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_settings_org ON company_settings(org_id);

-- O índice de configuracoes sobre (org_id, chave) já é único desde a migration 02.
DROP INDEX IF EXISTS idx_configuracoes_org;

-- O gatilho set_org_id passa a ser redundante para org_id NOT NULL, mas continua
-- necessário: sem ele, o INSERT sem org_id falharia em vez de ser preenchido.

-- config.toml desliga o signup público. Só a edge function dev-create-organization
-- cria contas, e ela escreve a role e a org em app_metadata (não user_metadata),
-- que é o que o handle_new_user da migration 03 aceita.
