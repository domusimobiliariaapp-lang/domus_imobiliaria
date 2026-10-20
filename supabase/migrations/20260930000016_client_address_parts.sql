-- Migration: endereço do cliente em partes separadas
--
-- profiles.endereco é um TEXT único, escrito à mão. Isso traz dois problemas:
-- não dá para buscar por cidade ou bairro, e o cadastro do cliente não
-- autocompleta nada — cada um digita "São Paulo - SP" de um jeito.
--
-- O CEP resolve os dois: é o único campo do endereço que se descobre sozinho, e
-- é o que viabiliza a busca por cidade ou bairro depois.
--
-- endereco continua existindo e continua sendo preenchido, montado a partir das
-- partes. É o que a tela de clientes já mostra, e o que outros lugares podem
-- estar lendo sem saber das colunas novas.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS endereco_cep          TEXT,
  ADD COLUMN IF NOT EXISTS endereco_street       TEXT,
  ADD COLUMN IF NOT EXISTS endereco_number       TEXT,
  ADD COLUMN IF NOT EXISTS endereco_complement   TEXT,
  ADD COLUMN IF NOT EXISTS endereco_neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS endereco_city         TEXT,
  ADD COLUMN IF NOT EXISTS endereco_state        TEXT;

COMMENT ON COLUMN public.profiles.endereco IS
  'Endereço montado a partir das colunas endereco_*, para exibição. Não editar à mão.';
COMMENT ON COLUMN public.profiles.endereco_cep IS
  'CEP do cliente, só dígitos. É por ele que o endereço se autocompleta.';

-- Buscar cliente por cidade ou bairro é comum ("quem mora no centro", "quem é
-- do bairro X"), e sem índice seria uma varredura da tabela a cada busca.
CREATE INDEX IF NOT EXISTS idx_profiles_endereco_city
  ON public.profiles(org_id, endereco_city);
CREATE INDEX IF NOT EXISTS idx_profiles_endereco_neighborhood
  ON public.profiles(org_id, endereco_neighborhood);

-- ============================================================
-- BACKFILL
-- ============================================================
--
-- Só o CEP sai com segurança de um texto livre: tem formato fixo e fica no fim.
-- Rua, número e bairro não têm como ser inferidos sem errar, e errar o bairro é
-- pior do que pedir para o usuário preencher.
--
-- O endereco antigo fica intacto até o primeiro save, que monta a string a
-- partir das partes preenchidas.

UPDATE public.profiles
   SET endereco_cep = btrim(substring(endereco from '([0-9]{5})-([0-9]{3})$'))
 WHERE endereco IS NOT NULL
   AND endereco_cep IS NULL
   AND btrim(endereco) ~ '[0-9]{5}-[0-9]{3}$';
