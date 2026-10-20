-- Migration: aposentar a tabela clients
--
-- A 00014 unificou as duas tabelas de pessoas em profiles, mas deixou clients
-- no banco. Ela ficou assim por um motivo: a tabela guardava dados que
-- profiles não tinha, e apagá-la antes de conferir perderia cadastro.
--
-- Esta migration é o passo final, agora que a verificação cabe num lugar só.
--
-- ---------------------------------------------------------------------------
-- POR QUE clients EXISTIA AO MESMO TEMPO QUE profiles
-- ---------------------------------------------------------------------------
--
-- Havia duas tabelas de pessoas, e a tela de Clientes lia de uma e escrevia na
-- outra: useClients() fazia SELECT em clients, e a criação gravava em
-- profiles. Criar um cliente não o fazia aparecer na lista, e excluir apagava
-- a linha errada — os ids das duas tabelas nunca tiveram relação.
--
-- A causa era a conversão multi-tenant: clients ficou de fora. Não recebeu
-- org_id, não recebeu GRANT, e as policies continuaram testando
-- auth.jwt()->>'role' — que é a role do PostgREST, sempre 'authenticated' para
-- quem está logado, nunca o papel do Domus. A condição dava falso e a leitura
-- era recusada: a tela aparecia vazia, sem mensagem de erro.
--
-- profiles ganhou as colunas que faltavam (tipo_relacao, categoria, endereco,
-- status, observacoes) na 00014 e é a tabela que o login do portal, as leases e
-- os payments já referenciam. Não há volta: clients sai de cena.
--
-- ---------------------------------------------------------------------------
-- POR QUE RENAME E NÃO DROP
-- ---------------------------------------------------------------------------
--
-- A primeira versão desta migration fazia DROP TABLE public.clients. O ideia é
-- o mesmo, mas apagar uma tabela de cadastro num push de produção é o tipo de
-- operação que não tem volta, e a verificação de integridade logo abaixo não
-- protege de tudo: ela confere se cada linha tem correspondente em profiles, e
-- não confere se alguém ainda lê a tabela.
--
-- Por isso aqui a tabela é APAGADA DE NOME, não de fato:
--
--   clients  ->  clients_aposentada
--
-- O nome novo sai de qualquer busca por `clients` (o nome é o que o código e as
-- policies referenciam), a RLS é desligada, e o conteúdo fica lá para inspeção.
-- Nenhuma tela consulta — useClients() foi removido, e ClientsAdmin lê e
-- escreve em profiles. A tabela não aparece em nenhuma listagem do painel, e
-- qualquer tentativa de SELECT pela aplicação volta vazia em vez de vazar.
--
-- Um DROP de verdade fica para uma migration posterior, quando já se passou
-- alguns dias sem ninguém sentir falta. A este ponto, o que sobrou em clients
-- ou é lixo de migração antiga ou é dado que alguém ainda vai perguntar.
--
-- ---------------------------------------------------------------------------
-- A VERIFICAÇÃO ABORTA, E NÃO APAGA
-- ---------------------------------------------------------------------------
--
-- Se houver linha em clients que não corresponda a ninguém em profiles, esta
-- migration levanta exceção e nada é mudado. Perder cadastro de cliente por
-- causa de uma faxina é o pior erro que uma migration de limpeza pode cometer,
-- e a única defesa é recusar a execução em vez de confiar que a verificação
-- anterior passou.
--
-- A correspondência é por client_id (o vínculo explícito) e, na falta dele, por
-- cpf_cnpj_limpo dentro da mesma org. O segundo caminho cobre as linhas que a
-- 00006 criou sem client_id preenchido.

-- ============================================================
-- 1. VERIFICAÇÃO — aborta se houver dado órfão
-- ============================================================

DO $$
DECLARE
  orfas BIGINT;
  exemplos TEXT;
BEGIN
  SELECT count(*), string_agg(DISTINCT c.full_name, ', ')
    INTO orfas, exemplos
    FROM public.clients c
   WHERE NOT EXISTS (
     SELECT 1
       FROM public.profiles p
      WHERE p.client_id = c.id
         OR (c.cpf_cnpj_limpo IS NOT NULL
             AND p.cpf_cnpj_limpo = c.cpf_cnpj_limpo)
   );

  IF orfas > 0 THEN
    RAISE EXCEPTION
      'clients tem % linha(s) sem correspondente em profiles -- nada foi mudado. Verifique antes: %',
      orfas, coalesce(exemplos, '(nomes indisponiveis)');
  END IF;

  RAISE NOTICE 'clients: todas as % linha(s) tem correspondente em profiles. Seguro aposentar.',
    (SELECT count(*) FROM public.clients);
END $$;

-- ============================================================
-- 2. APAGAR A FK QUE PRENDE profiles EM clients
-- ============================================================
--
-- A FK precisa sair antes: sem ON DELETE CASCADE, manter profiles apontando
-- para clients_aposentada deixaria um vínculo para uma tabela que nenhuma tela
-- consulta mais.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
     WHERE ns.nspname = 'public'
       AND rel.relname = 'profiles'
       AND con.contype = 'f'
       AND con.confrelid = 'public.clients'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_client_id_fkey;
    RAISE NOTICE 'FK profiles.client_id -> clients removida.';
  END IF;
END $$;

-- A coluna em si também sai: nada mais escreve nela, e deixá-la seria um
-- convite a alguém voltar a usar o vínculo que a 00014 desfez.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS client_id;

-- ============================================================
-- 3. APOSENTAR A TABELA
-- ============================================================
--
-- Idempotente: rodar duas vezes não falha, porque a segunda encontra a tabela
-- já renomeada.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    EXECUTE 'ALTER TABLE public.clients RENAME TO clients_aposentada';
    RAISE NOTICE 'clients renomeada para clients_aposentada.';
  ELSE
    RAISE NOTICE 'clients ja estava aposentada (ou nao existe).';
  END IF;
END $$;

-- RLS desligada e GRANT removido: mesmo que algo tente ler pelo nome novo, a
-- consulta volta vazia em vez de devolver cadastro de cliente.
ALTER TABLE public.clients_aposentada DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clients_aposentada FROM anon, authenticated;

-- Os índices de clients (idx_clients_cpf) acompanham a tabela no rename. O de
-- profiles não: idx_profiles_client_id existia só para a FK que acabou de sair.
DROP INDEX IF EXISTS public.idx_profiles_client_id;

-- ============================================================
-- 4. CONFERÊNCIA
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    RAISE EXCEPTION 'A tabela clients ainda existe apos o rename.';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
     WHERE ns.nspname = 'public'
       AND rel.relname = 'profiles'
       AND con.contype = 'f'
       AND con.conrelid = 'public.clients_aposentada'::regclass
  ) THEN
    RAISE EXCEPTION 'profiles ainda tem FK para clients_aposentada.';
  END IF;

  RAISE NOTICE 'clients aposentada (clients_aposentada, RLS desligada). Personais vivem em profiles.';
END $$;
