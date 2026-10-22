-- Migration: Módulo de Energia Solar (SaaS Multi-tenant)
--
-- 1. Habilita suporte a múltiplos módulos em organizations sem afetar o sistema imobiliário existente.
-- 2. Cria tipos (enums) com prefixo solar_* para evitar conflitos de nomes.
-- 3. Cria tabelas do ecossistema solar com chave estrangeira org_id -> organizations(id).
-- 4. Habilita RLS blindado por tenant em todas as tabelas (org_id = current_org_id() OR is_dev()).
-- 5. Não altera, remove ou substitui nenhuma tabela existente do Domus Imobiliária.

-- 1. Campo de módulos contratados na organização
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS enabled_modules TEXT[] NOT NULL DEFAULT ARRAY['imobiliaria'];

-- Comentário explicativo
COMMENT ON COLUMN public.organizations.enabled_modules IS
  'Módulos ativos contratados pela organização: imobiliaria, solar, engenharia, odonto.';

-- 2. Enums exclusivos do Módulo Solar
DO $$ BEGIN
  CREATE TYPE public.solar_document_type AS ENUM ('CPF', 'CNPJ');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.solar_roof_type AS ENUM ('CERAMICA', 'FIBROCIMENTO', 'METALICA', 'LAJE', 'SOLO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.solar_project_status AS ENUM (
    'DOCUMENTACAO',
    'HOMOLOGACAO',
    'INSTALACAO',
    'VISTORIA',
    'CONEXAO',
    'MONITORAMENTO',
    'CONCLUIDO'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.solar_quote_status AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.solar_product_category AS ENUM (
    'MODULO',
    'INVERSOR',
    'ESTRUTURA',
    'CABO',
    'CONECTOR',
    'OUTROS'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.solar_installation_type AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'INDUSTRIAL', 'RURAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.solar_transaction_type AS ENUM ('RECEITA', 'DESPESA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.solar_transaction_status AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Tabela: Configurações da Empresa de Energia Solar
CREATE TABLE IF NOT EXISTS public.solar_company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Empresa de Energia Solar',
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo_url TEXT,
  concessionaire_name TEXT,
  default_tariff NUMERIC(10,4) DEFAULT 0.9500,
  default_fio_b NUMERIC(10,4) DEFAULT 0.2800,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT solar_company_settings_org_unique UNIQUE (org_id)
);

-- 4. Tabela: Clientes do Módulo Solar
CREATE TABLE IF NOT EXISTS public.solar_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  document TEXT NOT NULL,
  document_type public.solar_document_type NOT NULL DEFAULT 'CPF',
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  consumer_unit TEXT,
  concessionaire TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_clients_org_id ON public.solar_clients(org_id);
CREATE INDEX IF NOT EXISTS idx_solar_clients_doc ON public.solar_clients(org_id, document);

-- 5. Tabela: Fornecedores Solares (distribuidores de inversores e placas)
CREATE TABLE IF NOT EXISTS public.solar_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  document_type public.solar_document_type DEFAULT 'CNPJ',
  contact_person TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_suppliers_org_id ON public.solar_suppliers(org_id);

-- 6. Tabela: Produtos e Equipamentos Solares (Estoque / Catálogo)
CREATE TABLE IF NOT EXISTS public.solar_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category public.solar_product_category NOT NULL,
  sku TEXT,
  brand TEXT,
  model TEXT,
  power_w INTEGER,
  unit TEXT DEFAULT 'un',
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  supplier_id UUID REFERENCES public.solar_suppliers(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_products_org_id ON public.solar_products(org_id);
CREATE INDEX IF NOT EXISTS idx_solar_products_category ON public.solar_products(org_id, category);

-- 7. Tabela: Kits Fotovoltaicos Pré-Montados
CREATE TABLE IF NOT EXISTS public.solar_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_type TEXT NOT NULL DEFAULT 'on_grid', -- on_grid, hibrido, off_grid
  total_power_kwp NUMERIC(10,3) NOT NULL DEFAULT 0.000,
  min_consumption_kwh NUMERIC(10,2),
  max_consumption_kwh NUMERIC(10,2),
  min_area_m2 NUMERIC(10,2),
  max_area_m2 NUMERIC(10,2),
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_kits_org_id ON public.solar_kits(org_id);

-- 8. Tabela: Bancos e Linhas de Financiamento Solar
CREATE TABLE IF NOT EXISTS public.solar_financing_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_rate NUMERIC(6,3) NOT NULL DEFAULT 1.500,
  max_rate NUMERIC(6,3) NOT NULL DEFAULT 2.500,
  min_installments INTEGER NOT NULL DEFAULT 12,
  max_installments INTEGER NOT NULL DEFAULT 60,
  max_grace_period INTEGER NOT NULL DEFAULT 6,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_financing_banks_org_id ON public.solar_financing_banks(org_id);

-- 9. Tabela: Orçamentos / Propostas Solares
CREATE TABLE IF NOT EXISTS public.solar_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.solar_clients(id) ON DELETE SET NULL,
  status public.solar_quote_status NOT NULL DEFAULT 'DRAFT',
  
  -- Localização da instalação
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip_code TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  roof_type public.solar_roof_type,
  
  -- Consumo e Dimensionamento
  average_monthly_kwh NUMERIC(10,2),
  tariff NUMERIC(10,4),
  fio_b NUMERIC(10,4) DEFAULT 0,
  tariff_group TEXT DEFAULT 'B',
  tariff_subgroup TEXT,
  simultaneity_factor NUMERIC(6,3) DEFAULT 0.800,
  compensated_energy_tax NUMERIC(10,4) DEFAULT 0,
  availability_cost NUMERIC(10,2) DEFAULT 0,
  monthly_bills JSONB DEFAULT '[]'::jsonb,
  recommended_power_kwp NUMERIC(10,3),
  estimated_generation_kwh NUMERIC(10,2),
  modules_quantity INTEGER,
  inverter_power_kw NUMERIC(10,2),
  modules TEXT,
  inverter TEXT,
  structure TEXT,
  cables_connectors TEXT,
  
  -- Serviços inclusos
  installation BOOLEAN DEFAULT true,
  homologation BOOLEAN DEFAULT true,
  monitoring BOOLEAN DEFAULT true,
  
  -- Custos e Precificação
  equipment_cost NUMERIC(12,2) DEFAULT 0.00,
  labor_cost NUMERIC(12,2) DEFAULT 0.00,
  additional_costs NUMERIC(12,2) DEFAULT 0.00,
  additional_cost_items JSONB DEFAULT '[]'::jsonb,
  discount NUMERIC(12,2) DEFAULT 0.00,
  total NUMERIC(12,2) DEFAULT 0.00,
  
  -- Retorno do Investimento
  monthly_savings NUMERIC(12,2),
  payback_months INTEGER,
  roi_25_years NUMERIC(12,2),
  
  -- Condições de Pagamento / Financiamento
  payment_type TEXT DEFAULT 'avista',
  financing_bank TEXT,
  financing_installments INTEGER,
  financing_rate NUMERIC(6,3),
  financing_down_payment NUMERIC(12,2),
  financing_installment_value NUMERIC(12,2),
  payment_details JSONB,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_quotes_org_id ON public.solar_quotes(org_id);
CREATE INDEX IF NOT EXISTS idx_solar_quotes_client_id ON public.solar_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_solar_quotes_status ON public.solar_quotes(org_id, status);

-- 10. Tabela: Projetos Solares (Execução e Homologação na Concessionária)
CREATE TABLE IF NOT EXISTS public.solar_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.solar_clients(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.solar_quotes(id) ON DELETE SET NULL,
  status public.solar_project_status NOT NULL DEFAULT 'DOCUMENTACAO',
  installation_type public.solar_installation_type DEFAULT 'RESIDENCIAL',
  power_kwp NUMERIC(10,3),
  checklist JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  start_date DATE,
  estimated_end_date DATE,
  actual_end_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_role TEXT DEFAULT 'VENDEDOR',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_projects_org_id ON public.solar_projects(org_id);
CREATE INDEX IF NOT EXISTS idx_solar_projects_status ON public.solar_projects(org_id, status);
CREATE INDEX IF NOT EXISTS idx_solar_projects_client_id ON public.solar_projects(client_id);

-- 11. Tabela: Ordens de Serviço (Instalação e Vistoria em Campo)
CREATE TABLE IF NOT EXISTS public.solar_service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.solar_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, EM_ANDAMENTO, CONCLUIDO, CANCELADO
  priority TEXT NOT NULL DEFAULT 'MEDIA',  -- BAIXA, MEDIA, ALTA, URGENTE
  opening_date DATE DEFAULT CURRENT_DATE,
  deadline_date DATE,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_service_orders_org_id ON public.solar_service_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_solar_service_orders_project ON public.solar_service_orders(project_id);

-- 12. Tabela: Diário e Histórico da Ordem de Serviço
CREATE TABLE IF NOT EXISTS public.solar_service_order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_order_id UUID NOT NULL REFERENCES public.solar_service_orders(id) ON DELETE CASCADE,
  notes TEXT NOT NULL,
  sector TEXT,
  checklist_state JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_service_order_logs_so ON public.solar_service_order_logs(service_order_id);

-- 13. Tabela: Anexos e Fotos da Ordem de Serviço
CREATE TABLE IF NOT EXISTS public.solar_service_order_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_order_id UUID NOT NULL REFERENCES public.solar_service_orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_so_attachments_so ON public.solar_service_order_attachments(service_order_id);

-- 14. Tabela: Movimentações de Estoque Solar
CREATE TABLE IF NOT EXISTS public.solar_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.solar_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL, -- ENTRADA, SAIDA, AJUSTE
  reason TEXT,
  project_id UUID REFERENCES public.solar_projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_stock_movements_org ON public.solar_stock_movements(org_id);

-- 15. Tabela: Transações Financeiras Específicas do Solar
CREATE TABLE IF NOT EXISTS public.solar_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type public.solar_transaction_type NOT NULL,
  status public.solar_transaction_status NOT NULL DEFAULT 'PENDENTE',
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  category TEXT,
  client_id UUID REFERENCES public.solar_clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.solar_projects(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.solar_suppliers(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_transactions_org ON public.solar_transactions(org_id);

-- ==============================================================================
-- 16. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS) E POLÍTICAS MULTI-TENANT BLINDADAS
-- Padrão Domus: org_id = current_org_id() OR is_dev()
-- ==============================================================================

-- solar_company_settings
ALTER TABLE public.solar_company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_company_settings_isolation" ON public.solar_company_settings;
CREATE POLICY "solar_company_settings_isolation" ON public.solar_company_settings
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_clients
ALTER TABLE public.solar_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_clients_isolation" ON public.solar_clients;
CREATE POLICY "solar_clients_isolation" ON public.solar_clients
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_suppliers
ALTER TABLE public.solar_suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_suppliers_isolation" ON public.solar_suppliers;
CREATE POLICY "solar_suppliers_isolation" ON public.solar_suppliers
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_products
ALTER TABLE public.solar_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_products_isolation" ON public.solar_products;
CREATE POLICY "solar_products_isolation" ON public.solar_products
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_kits
ALTER TABLE public.solar_kits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_kits_isolation" ON public.solar_kits;
CREATE POLICY "solar_kits_isolation" ON public.solar_kits
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_financing_banks
ALTER TABLE public.solar_financing_banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_financing_banks_isolation" ON public.solar_financing_banks;
CREATE POLICY "solar_financing_banks_isolation" ON public.solar_financing_banks
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_quotes
ALTER TABLE public.solar_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_quotes_isolation" ON public.solar_quotes;
CREATE POLICY "solar_quotes_isolation" ON public.solar_quotes
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_projects
ALTER TABLE public.solar_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_projects_isolation" ON public.solar_projects;
CREATE POLICY "solar_projects_isolation" ON public.solar_projects
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_service_orders
ALTER TABLE public.solar_service_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_service_orders_isolation" ON public.solar_service_orders;
CREATE POLICY "solar_service_orders_isolation" ON public.solar_service_orders
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_service_order_logs
ALTER TABLE public.solar_service_order_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_service_order_logs_isolation" ON public.solar_service_order_logs;
CREATE POLICY "solar_service_order_logs_isolation" ON public.solar_service_order_logs
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_service_order_attachments
ALTER TABLE public.solar_service_order_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_service_order_attachments_isolation" ON public.solar_service_order_attachments;
CREATE POLICY "solar_service_order_attachments_isolation" ON public.solar_service_order_attachments
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_stock_movements
ALTER TABLE public.solar_stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_stock_movements_isolation" ON public.solar_stock_movements;
CREATE POLICY "solar_stock_movements_isolation" ON public.solar_stock_movements
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- solar_transactions
ALTER TABLE public.solar_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solar_transactions_isolation" ON public.solar_transactions;
CREATE POLICY "solar_transactions_isolation" ON public.solar_transactions
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());
