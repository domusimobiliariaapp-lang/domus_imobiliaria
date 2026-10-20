-- Migration: dev_org_names devolve a organização inteira
--
-- A 00006 criou a função devolvendo só id, name, slug e active. A aba
-- Imobiliárias precisa também de cnpj, phone, whatsapp, email, logo_url e
-- address para editar a ficha, e passou a ler por esta RPC em vez da tabela —
-- para não depender do GRANT como um segundo ponto de falha.
--
-- Não dá para resolver com CREATE OR REPLACE: o Postgres recusa alterar o tipo
-- de retorno de uma função existente ("cannot change return type of existing
-- function"). A assinatura é parte da identidade da função, então é preciso
-- DROP antes.

DROP FUNCTION IF EXISTS public.dev_org_names();

CREATE FUNCTION public.dev_org_names()
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  slug        TEXT,
  active      BOOLEAN,
  cnpj        TEXT,
  phone       TEXT,
  whatsapp    TEXT,
  email       TEXT,
  logo_url    TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.name, o.slug, o.active, o.cnpj, o.phone, o.whatsapp,
         o.email, o.logo_url, o.address, o.created_at, o.updated_at
    FROM public.organizations o
   WHERE public.is_dev()
   ORDER BY o.created_at DESC;
$$;

-- is_dev() fica DENTRO da função, e não em policy: SECURITY DEFINER atravessa a
-- RLS, então sem esse WHERE qualquer usuário autenticado leria a lista inteira.
REVOKE ALL ON FUNCTION public.dev_org_names() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dev_org_names() TO authenticated;
