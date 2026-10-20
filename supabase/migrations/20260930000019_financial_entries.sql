-- Migration: entradas financeiras (receitas e despesas)
--
-- O relatório de repasse cobre o que vem de aluguel e comissão de venda, e é
-- calculado — nunca digitado. Mas o caixa da imobiliária tem mais coisa: uma
-- taxa de cadastro cobrada do locatário, um conserto de encanamento, o IPTU, a
-- multa de atraso. Sem um lugar para isso, a equipe anota no papel ou no
-- observações do contrato, e o caixa nunca fechava.
--
-- financial_entries é o lugar para o que NÃO é calculado. É digitado, tem uma
-- data, um tipo, uma categoria e um valor. O repasse continua sendo calculado
-- em fee_terms — os dois não se confundem: um é o que o dono recebe do
-- aluguel, o outro é o que a imobiliária move por conta própria.
--
-- A direção (receita/despesa) É digitada aqui, ao contrário de fee_terms:
-- fee_terms é despesa só quando a org é dona do imóvel, e isso é verificado
-- pelo banco. Uma entrada financeira é o que a equipe diz que é — não há como
-- errar o sinal de uma taxa de cadastro.

CREATE TYPE public.financial_entry_type AS ENUM ('receita', 'despesa');

CREATE TABLE IF NOT EXISTS public.financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- 'receita' ou 'despesa'. Não há trigger corrigindo: é o que foi digitado.
  type public.financial_entry_type NOT NULL,

  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),

  -- Livro de caixa: a data em que o dinheiro entrou ou saiu, e quando foi
  -- efetivamente liquidado. Muitos valores são lançados no vencimento mas
  -- só batem o caixa depois.
  entry_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,

  -- Vínculo opcional: uma entrada pode estar ligada a um contrato, imóvel,
  -- venda ou cliente. Sem vínculo, é uma entrada avulsa (IPTU, salário).
  related_type TEXT CHECK (related_type IN ('lease', 'property', 'sale', 'client')),
  related_id UUID,

  -- Usado pela tela de categorias: "manutenção", "imposto", "multa", "taxa de cadastro".
  category TEXT,

  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_org ON public.financial_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_date ON public.financial_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_type ON public.financial_entries(type);
CREATE INDEX IF NOT EXISTS idx_financial_entries_related ON public.financial_entries(related_type, related_id);

-- updated_at, para o relatório não ler linha velha depois de um acerto.
DROP TRIGGER IF EXISTS trg_financial_entries_updated_at ON public.financial_entries;
CREATE TRIGGER trg_financial_entries_updated_at
  BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- org_id preenchido no servidor, como em toda tabela de negócio. Sem este
-- trigger o insert chega com org_id NULL, e a WITH CHECK de INSERT recusa.
DROP TRIGGER IF EXISTS trg_set_org_id ON public.financial_entries;
CREATE TRIGGER trg_set_org_id
  BEFORE INSERT OR UPDATE ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal team can view own org financial entries" ON public.financial_entries;
CREATE POLICY "Internal team can view own org financial entries" ON public.financial_entries FOR SELECT
  USING (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can insert own org financial entries" ON public.financial_entries;
CREATE POLICY "Internal team can insert own org financial entries" ON public.financial_entries FOR INSERT
  WITH CHECK (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can update own org financial entries" ON public.financial_entries;
CREATE POLICY "Internal team can update own org financial entries" ON public.financial_entries FOR UPDATE
  USING (public.is_internal_team() AND public.in_current_org(org_id))
  WITH CHECK (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can delete own org financial entries" ON public.financial_entries;
CREATE POLICY "Internal team can delete own org financial entries" ON public.financial_entries FOR DELETE
  USING (public.is_internal_team() AND public.in_current_org(org_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_entries TO authenticated;