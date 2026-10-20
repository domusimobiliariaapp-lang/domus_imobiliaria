-- Migration: company_settings aceita upsert por org_id
--
-- A tela de Configurações passou a usar .upsert(..., { onConflict: 'org_id' })
-- porque uma imobiliária recém-criada ainda não tem linha em company_settings,
-- e um UPDATE não criaria a linha — o .single() falharia por não encontrar
-- nada para atualizar.
--
-- Para o onConflict funcionar, o Postgres precisa de uma CONSTRAINT UNIQUE.
-- O que existia era apenas um CREATE UNIQUE INDEX, e o PostgREST não resolve
-- conflito por índice solto: a chamada retornava
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification".
--
-- A constraint já garante a unicidade, então o índice solto é removido para não
-- manter duas estruturas garantindo a mesma coisa.

ALTER TABLE public.company_settings
  DROP CONSTRAINT IF EXISTS company_settings_org_id_key;

ALTER TABLE public.company_settings
  ADD CONSTRAINT company_settings_org_id_key UNIQUE (org_id);

-- A coluna é NOT NULL desde a migration 00005, e a constraint agora cobre a
-- unicidade. A verificação abaixo aborta se algo estiver inconsistente — o que
-- impediria o CREATE de falhar com um erro genérico.
DO $$
DECLARE
  duplicadas BIGINT;
BEGIN
  SELECT count(*) INTO duplicadas
    FROM (
      SELECT org_id
        FROM public.company_settings
       GROUP BY org_id
      HAVING count(*) > 1
    ) d;

  IF duplicadas > 0 THEN
    RAISE EXCEPTION
      'Há % orgs com mais de uma linha em company_settings. Remova as duplicadas antes.',
      duplicadas;
  END IF;

  RAISE NOTICE 'company_settings com constraint UNIQUE em org_id — upsert funciona.';
END $$;
