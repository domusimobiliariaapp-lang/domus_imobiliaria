-- Migration: devolve privilégios à service_role
--
-- service_role está com has_schema_privilege('public', 'USAGE') = false. Isso
-- significa que nenhuma função usando a service key consegue ler ou escrever
-- em public: o GoTrue aceita a chave (a autenticação funciona), mas o PostgREST
-- recusa com "permission denied for schema public".
--
-- Só foi descoberto agora porque dev-create-organization é a primeira função a
-- ESCREVER em public. As outras (cliente-login-request, domus-r2-upload) só
-- leem, e por acaso as tabelas que elas tocam já tinham SELECT concedido a
-- outras roles — o que mascarava a falta de privilégio da service_role.
--
-- Não é papel de migration GRANT ser exatamente este: em projetos Supabase
-- comuns, service_role herda os privilégios de postgres. Aqui não herdou, e
-- nenhuma migration anterior concedeu nada explicitamente.

-- USAGE no schema é o mínimo para enxergar os objetos dentro dele. CREATE
-- fica fora: a service role não cria tabela, e dar esse poder a uma chave que
-- vive em variável de ambiente de edge function é desnecessário.
GRANT USAGE ON SCHEMA public TO service_role;

-- O service role precisa dos privilégios de tabela também. Sem isto, USAGE
-- sozinho deixa a função enxergar o schema mas falhar em cada tabela com
-- "permission denied for table X".
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- Sequences: o INSERT com DEFAULT gen_random_uuid() não consome nenhuma, mas
-- qualquer contador usado por uma tabela futura dependeria disto.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Tabelas criadas depois desta migration também precisam ser cobertas. Sem
-- este default, a próxima tabela nova volta a falhar do mesmo jeito.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================

DO $$
DECLARE
  sem_usage BOOLEAN;
  sem_tabela TEXT;
BEGIN
  SELECT NOT has_schema_privilege('service_role', 'public', 'USAGE') INTO sem_usage;

  SELECT string_agg(DISTINCT c.relname, ', ') INTO sem_tabela
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND NOT has_table_privilege('service_role', c.oid, 'SELECT');

  IF sem_usage THEN
    RAISE EXCEPTION 'service_role continua sem USAGE no schema public.';
  ELSIF sem_tabela IS NOT NULL THEN
    RAISE EXCEPTION 'service_role ainda sem SELECT nas tabelas: %', sem_tabela;
  ELSE
    RAISE NOTICE 'service_role com USAGE no schema e privilégios em todas as tabelas.';
  END IF;
END $$;
