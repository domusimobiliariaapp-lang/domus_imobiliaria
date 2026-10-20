-- Migration: company_settings e configuracoes passam a ser por organização
--
-- company_settings hoje é uma tabela singleton: uma linha só, com id fixo
-- 00000000-0000-0000-0000-000000000001. Adicionar org_id é a menor mudança
-- possível e mantém public_contact_settings(), AdministrativeAdmin.tsx e as
-- policies já escritas apontando para o mesmo lugar. O singleton sai de cena
-- quando o NOT NULL do org_id for aplicado na migration 04.

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Uma linha de configuração por imobiliária.
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_settings_org
  ON company_settings(org_id);

-- O mesmo argumento vale para configuracoes, cuja chave era UNIQUE global:
-- 'telefone_contato' da Domus colidiria com o de qualquer outra imobiliária.
ALTER TABLE public.configuracoes DROP CONSTRAINT IF EXISTS configuracoes_chave_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracoes_org_chave
  ON configuracoes(org_id, chave);

-- A linha global existente precisa conhecer a org para não sumir do RLS.
-- O slug da Domus é 'domus'; se mudar aqui, mude no backfill também.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'domus') THEN
    INSERT INTO public.organizations (slug, name)
    VALUES ('domus', 'Domus Imobiliária');
  END IF;

  UPDATE public.company_settings
     SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
   WHERE org_id IS NULL;

  UPDATE public.configuracoes
     SET org_id = (SELECT id FROM public.organizations WHERE slug = 'domus')
   WHERE org_id IS NULL;
END $$;
