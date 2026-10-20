-- Migration: gestão de imóvel de terceiro + fecha vazamento na vitrine pública
--
-- A Domus administra imóveis que não são dela: o cliente é o proprietário e a
-- imobiliária intermedia a locação (ou a venda). properties.owner_id já existia
-- desde o schema inicial para exatamente isso, mas nunca foi usado — não há
-- campo de proprietário no PropertyModal, e o repasse ao dono não é calculado
-- em lugar nenhum.
--
-- Esta migration entrega as três peças:
--   1. fecha o vazamento da RPC pública, que hoje expõe a linha inteira;
--   2. marca a origem da gestão do imóvel;
--   3. registra, por contrato, como o dinheiro circula.

-- ============================================================
-- 1. VAZAMENTO NA VITRINE PÚBLICA
-- ============================================================
--
-- public_property_detail é "RETURNS SETOF public.properties". SETOF devolve a
-- LINHA INTEIRA, então todo visitante da vitrine recebe owner_id (o UUID do
-- proprietário) mais as colunas internas: accepts_fgts, accepts_financing,
-- accepts_exchange, iptu_paid, occupancy_permit, deed_registered,
-- deposit_amount, reference_code, address_number.
--
-- Isso não apareceu até agora porque owner_id estava sempre NULL — o dado
-- vazio mascara o vazamento, e basta o primeiro proprietário cadastrado para
-- o UUID do cliente sair para qualquer pessoa na internet.
--
-- public_property_listings (a listagem) já está correta: declara RETURNS TABLE
-- com uma coluna por vez. A de detalhe ficou para trás, provavelmente porque
-- Adding colunas em properties era mais fácil do que manter a lista sincronizada
-- — daí o "SELECT p.*". A correção é a mesma forma, com a lista explícita.
--
-- Nenhuma coluna de preço interno, taxa ou dado de contrato entra. A vitrine
-- mostra o imóvel e o contato da imobiliária, nunca a ficha do proprietário.

DROP FUNCTION IF EXISTS public.public_property_detail(TEXT, UUID);

CREATE FUNCTION public.public_property_detail(p_slug TEXT, p_property_id UUID)
RETURNS TABLE (
  id                UUID,
  title             TEXT,
  type              public.property_type,
  status            public.property_status,
  address           TEXT,
  address_number    TEXT,
  address_complement TEXT,
  neighborhood      TEXT,
  city              TEXT,
  state             TEXT,
  zip_code          TEXT,
  area_m2           NUMERIC(10,2),
  bedrooms          INTEGER,
  bathrooms         INTEGER,
  parking           INTEGER,
  rent_price        NUMERIC(12,2),
  sale_price        NUMERIC(12,2),
  description       TEXT,
  images            TEXT[],
  videos            TEXT[],
  features          TEXT[],
  purpose           TEXT,
  reference_code    TEXT,
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  reference_point   TEXT,
  proximity_details TEXT,
  furnished_status  TEXT,
  parking_covered   BOOLEAN,
  parking_type      TEXT,
  suites            INTEGER,
  floor_plan_url    TEXT,
  virtual_tour_url  TEXT,
  pet_allowed       BOOLEAN,
  has_elevator      BOOLEAN,
  area_util         NUMERIC(10,2),
  construction_year INTEGER,
  "condition"       TEXT,
  floor_number      INTEGER,
  available_from    DATE
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.title, p.type, p.status, p.address, p.address_number,
         p.address_complement, p.neighborhood, p.city, p.state, p.zip_code,
         p.area_m2, p.bedrooms, p.bathrooms, p.parking, p.rent_price,
         p.sale_price, p.description, p.images, p.videos, p.features,
         p.purpose, p.reference_code, p.latitude, p.longitude,
         p.reference_point, p.proximity_details, p.furnished_status,
         p.parking_covered, p.parking_type, p.suites, p.floor_plan_url,
         p.virtual_tour_url, p.pet_allowed, p.has_elevator, p.area_util,
         p.construction_year, p.condition, p.floor_number, p.available_from
    FROM public.properties p
    JOIN public.organizations o ON o.id = p.org_id
   WHERE o.slug = p_slug
     AND o.active
     AND p.id = p_property_id
     AND p.status = 'disponivel';
$$;

REVOKE ALL ON FUNCTION public.public_property_detail(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_property_detail(TEXT, UUID) TO anon, authenticated;

-- O comentário registra o motivo para a próxima vez não voltar ao SELECT p.*.
COMMENT ON FUNCTION public.public_property_detail(TEXT, UUID) IS
  'Detalhe público de um imóvel. Lista as colunas uma a uma de propósito: como SETOF public.properties, devolveria owner_id e as colunas internas de contrato para qualquer visitante.';

-- ============================================================
-- 2. ORIGEM DA GESTÃO
-- ============================================================
--
-- owner_id já existe e continua sendo a resposta para "de quem é o imóvel".
-- NULL significa imóvel próprio da imobiliária, que é o padrão e não muda
-- nada do que já funciona.
--
-- management_type diz o que a imobiliária faz com o imóvel de terceiro:
--   terceirizado — administra a locação do_property_do cliente;
--   parceria      — imóvel captado para vender, com comissão da imobiliária.
--
-- São casos diferentes na papelada, no contrato e no repasse, mas na estrutura
-- do banco dão no mesmo lugar: a imobiliária não é a dona.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS management_type TEXT
    CHECK (management_type IS NULL OR management_type IN ('terceirizado', 'parceria'));

COMMENT ON COLUMN public.properties.owner_id IS
  'Proprietário do imóvel. NULL quando é próprio da imobiliária.';
COMMENT ON COLUMN public.properties.management_type IS
  'Como a imobiliária administra imóvel de terceiro. NULL quando o imóvel é próprio dela.';

-- A taxa da gestão vive no imóvel, não no contrato: o mesmo apartamento gera
-- a mesma combinação locatário/proprietário durante todo o tempo. O contrato
-- pode ter um valor, mas isso é exceção — daí o override no contrato.
--
-- NULL significa "usar a taxa padrão da imobiliária" (company_settings).
-- Guardar o percentual aqui evita depender de company_settings para um cálculo
-- histórico: se a taxa da empresa mudar amanhã, o repasse de ontem continua
-- com o percentual que valia quando o contrato foi assinado.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS management_fee_percent NUMERIC(5,2)
    CHECK (management_fee_percent IS NULL OR management_fee_percent BETWEEN 0 AND 100);

COMMENT ON COLUMN public.properties.management_fee_percent IS
  'Percentual que a imobiliária retém do aluguel em imóvel de terceiro. NULL usa a taxa padrão de company_settings.';

-- ============================================================
-- 3. COMO O DINHEIRO CIRCULA, POR CONTRATO
-- ============================================================
--
-- Há duas práticas no mercado, e elas convivem na mesma carteira:
--
--   via_imobiliaria — o locatário paga o aluguel para a imobiliária, que repassa
--                     ao proprietário. A imobiliária centraliza o caixa e
--                     controla se o repasse saiu.
--   direto          — o locatário paga direto ao proprietário; a imobiliária
--                     cobra só a taxa de administração. Menos movimento de
--                     caixa, mas ela perde o controle do recebimento.
--
-- O modelo é do CONTRATO e não do imóvel, porque o mesmo imóvel pode ter sido
-- locado de uma forma e vendido de outra — e o repasse é do contrato de
-- locação, que é o que tem pagamento vinculado.
--
-- O default é via_imobiliaria: é o mais comum e o que tem mais sentido quando
-- a imobiliária é a responsável pelo contrato. Um contrato antigo que não
-- preencha o campo se comporta como via_imobiliaria, que é o comportamento
-- anterior e não quebra nada que já exista.

ALTER TABLE public.leases
  ADD COLUMN IF NOT EXISTS repasse_modelo TEXT NOT NULL DEFAULT 'via_imobiliaria'
    CHECK (repasse_modelo IN ('via_imobiliaria', 'direto'));

COMMENT ON COLUMN public.leases.repasse_modelo IS
  'Como o aluguel circula no imóvel de terceiro: via_imobiliaria (repasse ao proprietário) ou direto (cada parte paga ao seu). NULL ou vazio = via_imobiliaria.';

-- Só faz sentido para imóvel de terceiro. Não é CHECK porque exigiria trigger
-- cruzando duas tabelas para algo que o formulário já controla; a validação
-- fica na tela, e o campo em imóvel próprio é simplesmente ignorado.
COMMENT ON COLUMN public.leases.repasse_modelo IS
  'Como o aluguel circula no imóvel de terceiro: via_imobiliaria (repasse ao proprietário) ou direto. Ignorar em imóvel próprio da imobiliária.';

-- O repasse previsto é derivado do contrato e do percentual vigente, nunca
-- digitado: R$ 2.000 a 10% dá R$ 1.800 sempre, sem depender de alguém
-- acertar a conta. O que se guarda é quando o repasse foi de fato pago.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS repasse_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS repasse_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC(12,2);

COMMENT ON COLUMN public.payments.fee_amount IS
  'Retenção da imobiliária sobre este pagamento (calculada, não digitada).';
COMMENT ON COLUMN public.payments.repasse_amount IS
  'Valor destinado ao proprietário quando repasse_modelo = via_imobiliaria.';

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
--
-- A RPC pública não pode devolver owner_id. Este é o teste que pega a
-- regressão, se alguém voltar a usar SETOF ou SELECT p.* um dia.

DO $$
DECLARE
  vazando TEXT;
BEGIN
  -- Um nome que aparece na lista e NÃO é uma coluna pública declarada é
  -- exatamente a assinatura que a RPC está devolvendo.
  SELECT string_agg(nome, ', ')
    INTO vazando
    FROM (
      SELECT unnest(f.proargnames) AS nome
        FROM pg_proc f
        JOIN pg_namespace n ON n.oid = f.pronamespace
       WHERE n.nspname = 'public'
         AND f.proname = 'public_property_detail'
    ) nomes
   WHERE nome IN ('owner_id', 'org_id', 'management_type',
                  'management_fee_percent', 'accepts_fgts',
                  'accepts_financing', 'accepts_exchange', 'iptu_paid',
                  'occupancy_permit', 'deed_registered', 'deposit_amount');

  IF vazando IS NOT NULL THEN
    RAISE EXCEPTION
      'public_property_detail está expondo coluna privada: %. Refaça a RPC com RETURNS TABLE explícito.',
      vazando;
  END IF;

  RAISE NOTICE 'public_property_detail: nenhuma coluna privada exposta.';
END $$;
