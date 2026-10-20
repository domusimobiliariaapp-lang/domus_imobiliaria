-- Migration: clientes passam a viver em profiles
--
-- Havia duas tabelas de pessoas — profiles e clients — e a tela de Clientes
-- lia de uma e escrevia na outra:
--
--   useClients()          -> SELECT em clients
--   useCreateEntity('profiles') -> INSERT em profiles
--
-- Ou seja: criar um cliente não o fazia aparecer na lista, editar salvava em
-- profiles campos que existem só em clients (tipo_relacao, categoria,
-- endereco, status, observacoes), e os ids das duas tabelas não tinham
-- relação — excluir apagava a linha errada.
--
-- A causa de fundo: quando o sistema virou multi-tenant, clients ficou de fora.
-- Não recebeu org_id, não recebeu GRANT, e as policies continuaram com
-- auth.jwt()->>'role' IN ('admin', 'corretor', ...) — que é a role do
-- PostgREST, sempre 'authenticated' para quem está logado, nunca o papel do
-- Domus. A condição dava falso e a leitura era recusada: a tela aparecia vazia.
--
-- A decisão foi unificar em profiles: é a tabela que o login do portal, as
-- leases e os pagamentos já referenciam, e é a que tem org_id e policies
-- corretas. clients sai de cena.

-- ============================================================
-- 1. COLUNAS QUE FALTAVA EM PROFILES
-- ============================================================

-- As mesmas de clients, com os mesmos CHECK para não divergir de nada que já
-- exista. O nome do tipo em clients era TEXT e não enum, então o formato
-- continua aceitando valor NULL sem problema.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tipo_relacao TEXT
    CHECK (tipo_relacao IS NULL OR tipo_relacao IN ('locatario', 'locador', 'comprador', 'vendedor', 'fiador')),
  ADD COLUMN IF NOT EXISTS categoria TEXT
    CHECK (categoria IS NULL OR categoria IN ('pf', 'pj')),
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT
    CHECK (status IS NULL OR status IN ('ativo', 'inativo')),
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

COMMENT ON COLUMN public.profiles.tipo_relacao IS
  'Relação do cliente com o negócio. O papel dele no sistema continua em role.';
COMMENT ON COLUMN public.profiles.status IS
  'Ativo ou inativo como cliente. Não confundir com role, que é equipe ou cliente.';

-- O login do portal busca por cpf_cnpj_limpo E telefone_e164, juntos, dentro
-- da org. Os dois índices já existem desde a migration 03; o compound ajuda
-- porque a busca é sempre pelos dois campos.
CREATE INDEX IF NOT EXISTS idx_profiles_org_cpf ON public.profiles(org_id, cpf_cnpj_limpo);
CREATE INDEX IF NOT EXISTS idx_profiles_org_telefone ON public.profiles(org_id, telefone_e164);

-- ============================================================
-- 2. POLICY DE DELETE
-- ============================================================
--
-- profiles tem REFERENCES de leases.tenant_id, leases.landlord_id,
-- sales.buyer_id, sales.seller_id e payments.tenant_id — todas com
-- ON DELETE RESTRICT. Ou seja: o botão de excluir da tela de Clientes nunca
-- funcionou, e o RLS recusava antes mesmo de o banco tentar.
--
-- Não se cria policy de DELETE aqui de propósito. Apagar um profile derruba o
-- login da pessoa e esbarra nos contratos. A tela precisa avisar antes, e o
-- caminho é desativar (status = 'inativo'), que preserva o histórico.

-- ============================================================
-- 3. VERIFICAÇÃO
-- ============================================================
--
-- As policies de clients usam auth.jwt()->>'role' e estão quebradas. Esta
-- verificação falha alto se clients ainda estiver sendo lida por alguém — é
-- o que transforma um bug silencioso (lista vazia) em erro na hora do push.

DO $$
DECLARE
  quebradas TEXT;
BEGIN
  SELECT string_agg(pol.polname, ', ')
    INTO quebradas
    FROM pg_policy pol
    JOIN pg_class rel ON rel.oid = pol.polrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
   WHERE ns.nspname = 'public'
     AND rel.relname = 'clients'
     AND pol.polqual IS NOT NULL
     AND pol.polqual::text LIKE '%auth.jwt()%role%';

  IF quebradas IS NOT NULL THEN
    RAISE EXCEPTION
      'A tabela clients ainda tem policies com auth.jwt()->>''role'', que é sempre ''authenticated''.-as policies: %',
      quebradas;
  END IF;

  RAISE NOTICE 'Nenhuma policy de clients depende de auth.jwt()->>''role''.';
END $$;

-- Confere que as colunas que a tela usa existem de fato. Sem esta checagem, um
-- erro de digitação no nome de uma coluna só apareceria como "column does not
-- exist" na tela, no meio do uso.
DO $$
DECLARE
  faltando TEXT;
BEGIN
  SELECT string_agg(coluna, ', ')
    INTO faltando
    FROM unnest(ARRAY['tipo_relacao', 'categoria', 'endereco', 'status', 'observacoes', 'cpf_cnpj_limpo', 'telefone_e164', 'org_id']) AS coluna
   WHERE NOT EXISTS (
     SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = coluna
   );

  IF faltando IS NOT NULL THEN
    RAISE EXCEPTION 'Falta(m) em profiles: %', faltando;
  END IF;

  RAISE NOTICE 'profiles tem todas as colunas usadas pela tela de Clientes.';
END $$;
