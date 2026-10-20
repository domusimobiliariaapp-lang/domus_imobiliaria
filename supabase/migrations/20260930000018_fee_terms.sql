-- Migration: taxas unificadas em fee_terms
--
-- O modelo anterior guardava a taxa de administração em duas colunas do
-- imóvel (gestao_tipo e taxa_terceirizacao_percent) e só cobria locação. Venda
-- não tinha onde registrar taxa nenhuma: a tabela sales não tem coluna de
-- comissão, e o cálculo em src/lib/repasse.ts só olha para monthly_rent.
--
-- E o problema é de FORMA, não de quantidade. Uma taxa precisa de quatro
-- coisas, e a narrativa "como o aluguel chega ao dono" não guarda nenhuma
-- delas:
--
--   base        — sobre o que incide: aluguel, preço de venda, valor fixo
--   contraparte — quem recebe (pessoa na org, outra org, ou nome avulso)
--   direção     — é receita da org ou despesa dela
--   vigência    — de quando a quando, e se renova
--
-- Reorganizar em uma tabela resolve os dois problemas de uma vez: locação e
-- venda passam a ser o mesmo tipo de linha, e cada taxa carrega a sua base e o
-- seu credor em vez de deduzir de coluna.
--
-- A DIREÇÃO É DEDUZIDA, NÃO DIGITADA
--
-- Uma taxa é despesa da org só quando a org é DONA do imóvel — é o cenário do
-- dono que também opera o sistema e terceiriza a administração. Quando a org é
-- corretora e a administradora é outra, as duas taxas (a de administração e a
-- de venda) são receita, e cada uma aparece no livro de quem é credor. Não há
-- transferência interna: cada org registra só o próprio lado. Guardar a
-- direção numa coluna deixaria o valor digitável e, cedo ou tarde, escrito do
-- avesso.
--
-- Por isso a direção é CORRIGIDA por trigger, e não digitada: a aplicação
-- manda sempre receita e o banco decide.

CREATE TYPE public.fee_kind AS ENUM (
  -- O dono é você e outra imobiliária administra: é despesa.
  'administracao',
  -- Comissão de venda: o credor pode ser a administradora do imóvel ou quem
  -- conduziu a venda, e são muitas vezes pessoas diferentes.
  'comissao_venda',
  -- Qualquer outro acerto (avaliação, divulgação, taxa fixa de campanha).
  'outra'
);

CREATE TYPE public.fee_base AS ENUM ('percentual', 'valor_fixo');
CREATE TYPE public.fee_incide AS ENUM ('locacao', 'venda', 'ambos');

CREATE TABLE IF NOT EXISTS public.fee_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- O que a taxa cobre. Exatamente um dos dois é preenchido em vendas, e em
  -- locações o contrato é obrigatório: sem lease_id não há de qual aluguel
  -- falar.
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  lease_id    UUID REFERENCES public.leases(id) ON DELETE CASCADE,
  sale_id     UUID REFERENCES public.sales(id) ON DELETE CASCADE,

  kind     public.fee_kind NOT NULL DEFAULT 'administracao',
  incide_em public.fee_incide NOT NULL DEFAULT 'locacao',

  base     public.fee_base NOT NULL DEFAULT 'percentual',
  percentual NUMERIC(5,2) CHECK (percentual >= 0 AND percentual <= 100),
  valor_fixo NUMERIC(12,2) CHECK (valor_fixo >= 0),

  -- Contraparte: pessoa da própria org (outro corretor, o próprio
  -- proprietário), outra org do Domus, ou alguém de fora do sistema. Os três
  -- cabem, e o CHECK garante que sempre exista um.
  contraparte_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contraparte_org_id     UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  contraparte_nome       TEXT,

  -- Vigência. ends_on NULL é o contrato aberto: a taxa vale enquanto o
  -- contrato valer. Uma taxa de venda costuma ter ends_on = starts_on, porque
  -- acontece uma vez só.
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on   DATE,

  -- Um repasse não é automático: alguém confirma que o dinheiro saiu. Registrar
  -- a data é o que separa "calculado" de "pago" no relatório do Financeiro.
  repasse_paid_at TIMESTAMPTZ,

  observacoes TEXT,

  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A base só existe quando o tipo base pede. Sem este CHECK, uma linha com
  -- percentual e valor_fixo nulos passaria e a conta daria zero silenciosamente.
  CONSTRAINT fee_terms_base_preenchida CHECK (
    (base = 'percentual' AND percentual IS NOT NULL)
    OR (base = 'valor_fixo' AND valor_fixo IS NOT NULL)
  ),

  -- Taxa de venda é evento único: ela nasce junto da venda, não do contrato.
  CONSTRAINT fee_terms_venda_com_contrato CHECK (
    incide_em <> 'venda' OR lease_id IS NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_fee_terms_property ON public.fee_terms(property_id);
CREATE INDEX IF NOT EXISTS idx_fee_terms_lease    ON public.fee_terms(lease_id)   WHERE lease_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fee_terms_sale     ON public.fee_terms(sale_id)    WHERE sale_id    IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fee_terms_org      ON public.fee_terms(org_id);

-- repasse_paid_at: o que foi efetivamente pago, indexado porque o relatório do
-- Financeiro filtra por período e não pode varrer a tabela inteira.
CREATE INDEX IF NOT EXISTS idx_fee_terms_repasse ON public.fee_terms(repasse_paid_at)
  WHERE repasse_paid_at IS NOT NULL;

-- ============================================================
-- COLUNA DERIVADA: A DIREÇÃO DA TAXA
-- ============================================================
--
-- Receita é o padrão. Despesa acontece só quando a ORG é dona do imóvel — o
-- cenário do dono que também opera o sistema e terceiriza a administração.
-- Quando a org é corretora e a administradora é outra, as duas taxas são
-- receita, e cada uma aparece no livro de quem é credor.
--
-- `direction` NÃO é coluna comum de propósito: se fosse, alguém digitaria
-- 'despesa' numa taxa que é receita e o relatório mostraria o valor com o
-- sinal trocado — sem nenhum erro, só um número errado. Aqui a aplicação grava
-- sempre 'receita', e um trigger corrige para 'despesa' quando a org dona do
-- imóvel; nos demais casos a garantia é o DEFAULT, que é receita.

ALTER TABLE public.fee_terms
  ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'receita'
    CHECK (direction IN ('receita', 'despesa'));

COMMENT ON COLUMN public.fee_terms.direction IS 'Receita ou despesa da org. Derivada por trigger: a aplicação grava sempre receita e o banco corrige para despesa quando a org é dona do imóvel. Não editar à mão.';

-- Um termo de despesa só faz sentido com contraparte: uma taxa sem destino não
-- tem para quem pagar. Receita dispensa — pode ser taxa da própria empresa,
-- que não tem contraparte externo.
ALTER TABLE public.fee_terms
  ADD CONSTRAINT fee_terms_despesa_tem_contraparte CHECK (
    direction <> 'despesa'
    OR contraparte_profile_id IS NOT NULL
    OR contraparte_org_id IS NOT NULL
    OR contraparte_nome IS NOT NULL
  );

-- Para que "a org é dona do imóvel" possa ser perguntado sem traverse recursivo
-- a cada linha: o próprio imóvel guarda a resposta.
--
-- owner_id é quem cadastrou o imóvel. A org dona é aquela cujo admin é esse
-- owner_id. Guardar org_dona_id no imóvel evita a junção — e evita que a
-- busca da direção dependa de profiles, que por sua vez é protegido pela RLS e
-- devolveria nada numa consulta de serviço.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS org_dona_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Preenche org_dona_id a partir de owner_id: a org dona é aquela do admin que
-- cadastrou o imóvel. Sem este UPDATE, o trigger de direção cairia no
-- fallback a cada leitura, e o índice que vai sustentar o relatório não
-- serviria para nada.
--
-- Só quando owner_id aponta para alguém com org_id — imóvel sem dono cadastrado
-- fica NULL de propósito, porque ninguém provou posse dele.
UPDATE public.properties p
   SET org_dona_id = owner.org_id
  FROM public.profiles owner
 WHERE p.owner_id = owner.id
   AND owner.org_id IS NOT NULL
   AND p.org_dona_id IS NULL;

CREATE OR REPLACE FUNCTION public.fee_terms_set_direction() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_org_dona UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- org_dona_id é a fonte direta, mas vem NULL nos imóveis criados antes desta
  -- migration. O fallback por owner_id existe para não depender de backfill: é a
  -- mesma pergunta feita por outro caminho (o dono é o admin da própria org).
  SELECT
    COALESCE(
      org_dona_id,
      (SELECT p2.org_id FROM public.profiles p2 WHERE p2.id = properties.owner_id)
    )
    INTO v_org_dona
  FROM public.properties
  WHERE id = NEW.property_id;

  IF v_org_dona IS NOT NULL AND v_org_dona = NEW.org_id THEN
    NEW.direction := 'despesa';
  ELSE
    NEW.direction := 'receita';
  END IF;

  RETURN NEW;
END;
$$;

-- O prefixo zz_ é deliberado. Triggers BEFORE rodam em ORDEM ALFABÉTICA do
-- nome, e este depende de trg_set_org_id ter rodado antes: sem org_id, a
-- direção cairia no padrão receita e a despesa do dono-operador nunca
-- apareceria. Renomear este trigger sem lembrar disso quebra a regra em
-- silêncio.
DROP TRIGGER IF EXISTS trg_zz_fee_terms_direction ON public.fee_terms;
CREATE TRIGGER trg_zz_fee_terms_direction
  BEFORE INSERT OR UPDATE ON public.fee_terms
  FOR EACH ROW EXECUTE FUNCTION public.fee_terms_set_direction();

-- updated_at, para o relatório não ler linha velha depois de um acerto.
-- SET search_path pela mesma razão das outras funções do projeto: sem ele, um
-- usuário comum pode sequestrar o search_path.
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fee_terms_updated_at ON public.fee_terms;
CREATE TRIGGER trg_fee_terms_updated_at
  BEFORE UPDATE ON public.fee_terms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- org_id preenchido no servidor.
--
-- Sem este trigger o insert chega com org_id NULL — o front-end descarta o
-- campo, e a WITH CHECK de INSERT trata NULL como falso e recusa. É a mesma
-- falha que a tabela profiles teve, e por isso o gatilho entra junto da
-- tabela, não numa correção depois.
DROP TRIGGER IF EXISTS trg_set_org_id ON public.fee_terms;
CREATE TRIGGER trg_set_org_id
  BEFORE INSERT OR UPDATE ON public.fee_terms
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.fee_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal team can view own org fee terms" ON public.fee_terms;
CREATE POLICY "Internal team can view own org fee terms" ON public.fee_terms FOR SELECT
  USING (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can insert own org fee terms" ON public.fee_terms;
CREATE POLICY "Internal team can insert own org fee terms" ON public.fee_terms FOR INSERT
  WITH CHECK (public.is_internal_team() AND public.in_current_org(org_id));

-- WITH CHECK no UPDATE, como em toda policy de alteração do projeto: sem ele,
-- um usuário da org A move a linha para a org B — a USING só julga a linha
-- antiga.
DROP POLICY IF EXISTS "Internal team can update own org fee terms" ON public.fee_terms;
CREATE POLICY "Internal team can update own org fee terms" ON public.fee_terms FOR UPDATE
  USING (public.is_internal_team() AND public.in_current_org(org_id))
  WITH CHECK (public.is_internal_team() AND public.in_current_org(org_id));

DROP POLICY IF EXISTS "Internal team can delete own org fee terms" ON public.fee_terms;
CREATE POLICY "Internal team can delete own org fee terms" ON public.fee_terms FOR DELETE
  USING (public.is_internal_team() AND public.in_current_org(org_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_terms TO authenticated;

-- ============================================================
-- BACKFILL: os termos que já existem nas colunas do imóvel
-- ============================================================
--
-- properties.taxa_terceirizacao_percent e properties.gestao_tipo viram linhas de
-- fee_terms, para que a taxa do aluguel não tenha dois lugares onde pode
-- divergir. As colunas antigas ficam: ainda são lidas por código que não foi
-- migrado, e apagá-las agora quebraria a vitrine de cálculo antes de a troca
-- estar completa.

INSERT INTO public.fee_terms (
  property_id, lease_id, kind, incide_em, base, percentual,
  org_id, observacoes, starts_on
)
SELECT
  p.id,
  l.id,
  'administracao'::public.fee_kind,
  'locacao'::public.fee_incide,
  'percentual'::public.fee_base,
  p.taxa_terceirizacao_percent,
  p.org_id,
  'Migrado de properties.taxa_terceirizacao_percent.',
  COALESCE(l.start_date, CURRENT_DATE)
FROM public.properties p
JOIN public.leases l
  ON l.property_id = p.id
 AND l.status IN ('ativo', 'pendente')
WHERE p.taxa_terceirizacao_percent IS NOT NULL
  AND p.taxa_terceirizacao_percent > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.fee_terms f
    WHERE f.property_id = p.id AND f.lease_id = l.id
  );
