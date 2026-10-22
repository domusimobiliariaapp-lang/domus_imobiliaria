-- Migration: Módulo de Engenharia Civil & Obras (SaaS Multi-tenant)
--
-- 1. Cria tipos e enums exclusivos com prefixo obras_*
-- 2. Cria tabelas com chave estrangeira org_id -> organizations(id) ON DELETE CASCADE
-- 3. Habilita RLS blindado por tenant em todas as tabelas (org_id = current_org_id() OR is_dev())
-- 4. Não altera, remove ou substitui nenhuma tabela existente do Domus ou do Solar.

-- 1. Enums exclusivos do Módulo de Obras
DO $$ BEGIN
  CREATE TYPE public.obras_status_enum AS ENUM (
    'planejamento',
    'em_andamento',
    'pausada',
    'concluida',
    'cancelada'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.obras_tipo_cliente AS ENUM ('pf', 'pj');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.obras_status_medicao AS ENUM ('rascunho', 'enviada', 'aprovada', 'faturada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.obras_status_pedido AS ENUM ('pendente', 'cotacao', 'aprovado', 'entregue', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tabela: Clientes / Contratantes das Obras
CREATE TABLE IF NOT EXISTS public.obras_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tipo public.obras_tipo_cliente NOT NULL DEFAULT 'pf',
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  cpf_cnpj TEXT NOT NULL,
  rg_ie TEXT,
  email TEXT,
  telefone TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obras_clientes_org_id ON public.obras_clientes(org_id);
CREATE INDEX IF NOT EXISTS idx_obras_clientes_doc ON public.obras_clientes(org_id, cpf_cnpj);

-- 3. Tabela: Obras & Empreendimentos (Projetos de Construção)
CREATE TABLE IF NOT EXISTS public.obras_projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  cliente_id UUID REFERENCES public.obras_clientes(id) ON DELETE RESTRICT,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.obras_status_enum NOT NULL DEFAULT 'planejamento',
  orcamento NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  valor_executado NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  progresso INTEGER NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
  data_inicio_prevista DATE,
  data_fim_prevista DATE,
  data_inicio_real DATE,
  data_fim_real DATE,
  cep TEXT,
  logradouro TEXT,
  numero_endereco TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT obras_projetos_org_numero_unique UNIQUE (org_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_obras_projetos_org_id ON public.obras_projetos(org_id);
CREATE INDEX IF NOT EXISTS idx_obras_projetos_status ON public.obras_projetos(org_id, status);

-- 4. Tabela: Equipe Técnica da Obra
CREATE TABLE IF NOT EXISTS public.obras_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES public.obras_projetos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  funcao TEXT NOT NULL DEFAULT 'Engenheiro de Campo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT obras_equipe_obra_user_unique UNIQUE (obra_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_obras_equipe_obra_id ON public.obras_equipe(obra_id);

-- 5. Tabela: Diário de Obra Digital (RDO)
CREATE TABLE IF NOT EXISTS public.obras_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES public.obras_projetos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  clima TEXT DEFAULT 'Ensolarado',
  temperatura NUMERIC(5,2),
  efetivo JSONB NOT NULL DEFAULT '[]'::jsonb, -- Pedreiros, serventes, carpinteiros, eletricistas
  atividades TEXT NOT NULL,
  ocorrencias TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obras_diarios_obra_data ON public.obras_diarios(obra_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_obras_diarios_org ON public.obras_diarios(org_id);

-- 6. Tabela: Fotos Comprobatórias do Diário de Obra
CREATE TABLE IF NOT EXISTS public.obras_diarios_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  diario_id UUID NOT NULL REFERENCES public.obras_diarios(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  descricao TEXT,
  etapa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obras_diarios_fotos_diario ON public.obras_diarios_fotos(diario_id);

-- 7. Tabela: Boletins de Medição de Obras
CREATE TABLE IF NOT EXISTS public.obras_medicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  obra_id UUID NOT NULL REFERENCES public.obras_projetos(id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  percentual_total NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  status public.obras_status_medicao NOT NULL DEFAULT 'rascunho',
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obras_medicoes_obra ON public.obras_medicoes(obra_id);
CREATE INDEX IF NOT EXISTS idx_obras_medicoes_org ON public.obras_medicoes(org_id);

-- 8. Tabela: Itens de Medição de Obra
CREATE TABLE IF NOT EXISTS public.obras_medicoes_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  medicao_id UUID NOT NULL REFERENCES public.obras_medicoes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  unidade TEXT DEFAULT 'm²',
  quantidade_prevista NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  quantidade_medida NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obras_medicoes_itens_medicao ON public.obras_medicoes_itens(medicao_id);

-- 9. Tabela: Cronograma Físico-Financeiro (Etapas da Obra)
CREATE TABLE IF NOT EXISTS public.obras_cronograma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES public.obras_projetos(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL, -- Fundação, Estrutura, Alvenaria, Instalações, Acabamento
  ordem INTEGER NOT NULL DEFAULT 1,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  peso_percentual NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  progresso_real INTEGER NOT NULL DEFAULT 0 CHECK (progresso_real BETWEEN 0 AND 100),
  custo_previsto NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  custo_realizado NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obras_cronograma_obra ON public.obras_cronograma(obra_id, ordem);

-- 10. Tabela: Pedidos de Compra & Insumos para Canteiro de Obras
CREATE TABLE IF NOT EXISTS public.obras_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES public.obras_projetos(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  fornecedor_nome TEXT NOT NULL,
  fornecedor_cnpj TEXT,
  status public.obras_status_pedido NOT NULL DEFAULT 'pendente',
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  previsao_entrega DATE,
  entregue_em TIMESTAMPTZ,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obras_compras_obra ON public.obras_compras(obra_id);
CREATE INDEX IF NOT EXISTS idx_obras_compras_org ON public.obras_compras(org_id);

-- ==============================================================================
-- 11. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS) E POLÍTICAS MULTI-TENANT BLINDADAS
-- Padrão Domus: org_id = current_org_id() OR is_dev()
-- ==============================================================================

-- obras_clientes
ALTER TABLE public.obras_clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obras_clientes_isolation" ON public.obras_clientes;
CREATE POLICY "obras_clientes_isolation" ON public.obras_clientes
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- obras_projetos
ALTER TABLE public.obras_projetos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obras_projetos_isolation" ON public.obras_projetos;
CREATE POLICY "obras_projetos_isolation" ON public.obras_projetos
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- obras_equipe
ALTER TABLE public.obras_equipe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obras_equipe_isolation" ON public.obras_equipe;
CREATE POLICY "obras_equipe_isolation" ON public.obras_equipe
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- obras_diarios
ALTER TABLE public.obras_diarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obras_diarios_isolation" ON public.obras_diarios;
CREATE POLICY "obras_diarios_isolation" ON public.obras_diarios
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- obras_diarios_fotos
ALTER TABLE public.obras_diarios_fotos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obras_diarios_fotos_isolation" ON public.obras_diarios_fotos;
CREATE POLICY "obras_diarios_fotos_isolation" ON public.obras_diarios_fotos
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- obras_medicoes
ALTER TABLE public.obras_medicoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obras_medicoes_isolation" ON public.obras_medicoes;
CREATE POLICY "obras_medicoes_isolation" ON public.obras_medicoes
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- obras_medicoes_itens
ALTER TABLE public.obras_medicoes_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obras_medicoes_itens_isolation" ON public.obras_medicoes_itens;
CREATE POLICY "obras_medicoes_itens_isolation" ON public.obras_medicoes_itens
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- obras_cronograma
ALTER TABLE public.obras_cronograma ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obras_cronograma_isolation" ON public.obras_cronograma;
CREATE POLICY "obras_cronograma_isolation" ON public.obras_cronograma
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());

-- obras_compras
ALTER TABLE public.obras_compras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obras_compras_isolation" ON public.obras_compras;
CREATE POLICY "obras_compras_isolation" ON public.obras_compras
  FOR ALL
  USING (org_id = current_org_id() OR is_dev())
  WITH CHECK (org_id = current_org_id() OR is_dev());
