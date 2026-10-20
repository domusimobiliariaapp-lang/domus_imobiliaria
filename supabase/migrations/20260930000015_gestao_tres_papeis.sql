-- Migration: os três papéis do dono que também é imobiliária
--
-- A migration 013 modelou só "imóvel de terceiro": a imobiliária recebia o
-- aluguel e repassava ao proprietário, ficando com a taxa. Nesse modelo a
-- taxa é RECEITA da imobiliária.
--
-- Quem é dono dos imóveis e também opera o sistema tem três situações, e a
-- direção do dinheiro é outra em cada uma:
--
--   própria_sem_intermediario
--     O locatário paga para o dono. Ele recebe o aluguel inteiro.
--
--   própria_com_terceirizacao
--     O imóvel É do dono, mas outra imobiliária administra e retém taxa.
--     Aqui a taxa é CUSTO do dono — é o dono que repassa e que paga.
--
--   locacao_direta
--     Aluguel particular, sem intermediário no meio.
--
-- Calcular o segundo caso com a regra da 013 daria "dono recebe 1.900"
-- quando o correto é "a administradora retém 100 e o dono fica com 1.900".
-- O erro de R$ 100 por mês, por imóvel, na direção errada.
--
-- A coluna vai no IMÓVEL, e não no contrato: o mesmo apartamento gera a mesma
-- combinação durante toda a vida dele, e trocar o valor no contrato a cada
-- renovação só criaria chance de divergir. O que é do contrato é apenas a
-- origem ("quem locou"), que muda de contrato para contrato.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS gestao_tipo TEXT NOT NULL DEFAULT 'propria_sem_intermediario'
    CHECK (gestao_tipo IN (
      'propria_sem_intermediario',
      'propria_com_terceirizacao',
      'locacao_direta'
    ));

COMMENT ON COLUMN public.properties.gestao_tipo IS
  'Como o aluguel chega ao dono: sem intermediário, com imobiliária administrando (taxa é custo do dono), ou locação particular.';

-- A taxa da administradora externa. NULL quando não há terceirização, e a
-- regra é ignorada — não vale 0 como "sem taxa", porque 0% de
-- terceirização é um caso que não existe e esconderia erro de digitação.
--
-- Guarda-se o percentual, e não o valor em reais: o valor muda todo mês com o
-- reajuste, e um valor fixo passaria a mentir assim que o aluguel fosse
-- reajustado. Com o percentual, R$ 2.000 a 5% dá R$ 1.900, e R$ 2.100 a 5%
-- dá R$ 1.995, sem ninguém recalcular nada à mão.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS taxa_terceirizacao_percent NUMERIC(5,2)
    CHECK (taxa_terceirizacao_percent IS NULL OR taxa_terceirizacao_percent BETWEEN 0 AND 100);

COMMENT ON COLUMN public.properties.taxa_terceirizacao_percent IS
  'Percentual que a imobiliária administradora retém. Só vale quando gestao_tipo = propria_com_terceirizacao; nos demais é ignorado.';

-- Qual é a origem do contrato, para o financeiro separar por caminho.
--
--   direta         — o próprio dono locou para o locatário
--   terceiro        — outra imobiliária locou, e o repasse é para ela
--
-- Sem isto, o financeiro não distingue "vendi o serviço de gestão" de
-- "intermediei entre locatário e dono", que são receitas de natureza
-- diferente na contabilidade da empresa.
ALTER TABLE public.leases
  ADD COLUMN IF NOT EXISTS origem_contrato TEXT NOT NULL DEFAULT 'direta'
    CHECK (origem_contrato IN ('direta', 'terceiro'));

COMMENT ON COLUMN public.leases.origem_contrato IS
  'Quem locou o imóvel: o próprio dono (direta) ou outra imobiliária (terceiro, que é para onde o repasse vai).';

-- ============================================================
-- VALORES DERIVADOS NOS PAGAMENTOS
-- ============================================================
--
-- 013 já criou fee_amount, repasse_amount e repasse_paid_at. O que faltava era
-- dizer para que lado o valor aponta, porque o nome é o mesmo e o sentido muda
-- conforme quem é o dono.
--
-- bruta  = o que o locatário paga
-- taxa   = o que sai para a administradora (terceirização)
-- liquido = o que fica com o dono
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS valor_liquido NUMERIC(12,2);

COMMENT ON COLUMN public.payments.valor_liquido IS
  'Valor que sobra para o dono depois da taxa de administração. Calculado, nunca digitado.';

-- ============================================================
-- ÍNDICES PARA O RELATÓRIO
-- ============================================================
--
-- O relatório do financeiro agrupa por (gestao_tipo, origem_contrato). Sem
-- estes índices, a consulta varre todos os pagamentos e todos os contratos da
-- org a cada abertura da tela.
CREATE INDEX IF NOT EXISTS idx_properties_gestao
  ON public.properties(org_id, gestao_tipo);
CREATE INDEX IF NOT EXISTS idx_leases_origem
  ON public.leases(org_id, origem_contrato);

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
--
-- Um imóvel marcado como terceirizado sem taxa é a combinação que produz a
-- conta errada sem erro visível: a taxa viraria 0 e o dono receberia tudo,
-- parecendo certo. Este bloco aborta o push se existir.
DO $$
DECLARE
  inconsistentes BIGINT;
BEGIN
  SELECT count(*) INTO inconsistentes
    FROM public.properties
   WHERE gestao_tipo = 'propria_com_terceirizacao'
     AND (taxa_terceirizacao_percent IS NULL OR taxa_terceirizacao_percent <= 0);

  IF inconsistentes > 0 THEN
    RAISE EXCEPTION
      'Há % imóvel(is) marcados como terceirizados sem taxa preenchida. '
      'Sem a taxa, o repasse sairia errado sem nenhum erro na tela.',
      inconsistentes;
  END IF;

  RAISE NOTICE
    'gestao_tipo aplicado. As linhas existentes caem em propria_sem_intermediario por default do NOT NULL.';
END $$;
