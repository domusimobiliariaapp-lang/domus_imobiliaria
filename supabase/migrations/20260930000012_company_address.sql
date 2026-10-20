-- Migration: endereço estruturado da imobiliária
--
-- A ficha da imobiliária mora em organizations — é o que a vitrine pública
-- (public_org_branding) e o painel do DEV já leem. Mas address era um único
-- TEXT livre, escrito à mão, sem número, bairro, cidade ou UF separados.
--
-- address continua existindo: é o que a vitrine pública mostra no rodapé e no
-- cabeçalho. As colunas novas alimentam o formulário de Configurações, e o
-- front monta address a partir delas. Não há coluna nova em company_settings
-- de propósito: a ficha da imobiliária não deveria ficar dividida em duas
-- tabelas, que era exatamente o que fazia o nome do menu não acompanhar a
-- alteração feita na tela de Configurações.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS address_street       TEXT,
  ADD COLUMN IF NOT EXISTS address_number       TEXT,
  ADD COLUMN IF NOT EXISTS address_neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS address_city         TEXT,
  ADD COLUMN IF NOT EXISTS address_state        TEXT,
  ADD COLUMN IF NOT EXISTS address_cep          TEXT;

COMMENT ON COLUMN public.organizations.address IS
  'Endereço montado a partir das colunas address_*, para exibição na vitrine pública e no painel do DEV.';

-- Backfill: o endereço da Domus original existia só em texto livre. Sem isso o
-- formulário de Configurações abriria vazio e o primeiro save sobrescreveria
-- address com uma string vazia, apagando o que já estava lá.
--
-- Só o CEP é extraído, porque tem formato fixo. Logradouro, número, bairro e
-- cidade não têm como ser inferidos de um texto livre — adivhar o bairro errado
-- é pior do que pedir para o usuário preencher. address fica intacto até o
-- primeiro save, que monta a string a partir das partes preenchidas.
--
-- O CEP é ancorado no FIM da string de propósito. Um telefone no meio do texto
-- ("... (11) 99999-9999") casaria com o padrão 5 dígitos + 3, e o número do
-- telefone viraria o CEP da imobiliária. O fim é onde o CEP fica.
UPDATE public.organizations
   SET address_cep = matched_digits
  FROM (
    SELECT id, (regexp_matches(btrim(address), '([0-9]{5})-([0-9]{3})$'))[1] AS matched_digits
      FROM public.organizations
     WHERE address IS NOT NULL
       AND address_cep IS NULL
       AND btrim(address) ~ '[0-9]{5}-[0-9]{3}$'
  ) AS found
 WHERE organizations.id = found.id;

-- ============================================================
-- POLICY DE UPDATE
-- ============================================================

--organizations tem GRANT SELECT e GRANT UPDATE para authenticated (migration
-- 00007), e a policy de SELECT restringe à própria org. Faltava a de UPDATE:
-- sem ela o .update() da tela de Configurações é recusado pelo RLS.

DROP POLICY IF EXISTS "Admin can update own organization" ON public.organizations;

CREATE POLICY "Admin can update own organization"
  ON public.organizations FOR UPDATE TO authenticated
  USING (public.current_org_id() = id AND public.get_current_user_role() = 'admin')
  WITH CHECK (public.current_org_id() = id);

-- WITH CHECK é obrigatório: sem ele, um admin da org A que passes id = orgB no
-- corpo moveria a própria linha para outra imobiliária.
--
-- O USING compara com a própria linha (id da linha sendo atualizada) e o
-- WITH CHECK com o valor novo — é essa segunda cláusula que impede a fuga.
--
-- Só admin altera a ficha: corretor e financeiro mudam locações e pagamentos,
-- não os dados da imobiliária. A tela de Configurações já avisava sobre a
-- falta de permissão, mas salvava pela metade; agora o erro vem do banco.
