-- Migration: fundação multi-tenant
--
-- Cria a noção de organização (uma imobiliária) e ancora cada tabela de negócio
-- nela. A coluna chama-se org_id, e não tenant_id, porque "tenant" já é usado
-- no sentido de locatário em leases.tenant_id e payments.tenant_id — misturar os
-- dois sentidos é a forma mais fácil de introduzir um vazamento de dados.
--
-- org_id nasce NULLABLE de propósito: os dados existentes só serão atribuídos
-- no backfill manual, e o NOT NULL vem numa migration posterior.

CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,40}$'),
  name        TEXT NOT NULL,
  cnpj        TEXT,
  phone       TEXT,
  whatsapp    TEXT,
  email       TEXT,
  logo_url    TEXT,
  address     TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.organizations IS
  'Uma imobiliária. Toda linha de negócio pertence a exatamente uma organização; apenas a conta DEV fica sem organização.';

-- O papel DEV entra no enum para existir sem org. Não pode ser usado no mesmo
-- bloco de transação em que é adicionado — por isso o uso fica na migration 03.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'dev';

-- Identidade. profiles é a âncora: toda FK de negócio aponta para cá.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.leases
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.lease_history
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT;

-- Notificações seguem o usuário, e o usuário já é de uma única org.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Configuracoes guarda o telefone de contato usado como fallback no login do
-- portal. Sendo global, ele vazaria o número de uma imobiliária para as outras.
ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Coluna desnormalizada em todas as tabelas, em vez de derivar por join:
-- a policy fica org_id = current_org_id(), uma comparação direta no índice,
-- sem auto-juntagem contra uma tabela que a própria RLS está filtrando.
CREATE INDEX IF NOT EXISTS idx_profiles_org        ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_org         ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_properties_org      ON properties(org_id);
CREATE INDEX IF NOT EXISTS idx_leases_org          ON leases(org_id);
CREATE INDEX IF NOT EXISTS idx_sales_org           ON sales(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_org        ON payments(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_org       ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_lease_history_org   ON lease_history(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org   ON notifications(org_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_org   ON configuracoes(org_id);

-- O índice de properties_reference_code é global e passa a colidir entre
-- imobiliárias: "REF-001" na Domus não pode existir na outra.
DROP INDEX IF EXISTS idx_properties_reference_code;
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_reference_code
  ON properties(org_id, reference_code)
  WHERE reference_code IS NOT NULL;

-- O login do portal identifica o cliente por CPF/CNPJ + telefone. O índice
-- composto serve a busca do caso multi-org e não serve mais como índice global.
DROP INDEX IF EXISTS idx_profiles_role_cpf;
CREATE INDEX IF NOT EXISTS idx_profiles_org_role_cpf
  ON profiles(org_id, role, cpf_cnpj_limpo);
