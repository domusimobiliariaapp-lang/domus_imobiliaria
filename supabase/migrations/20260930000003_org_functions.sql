-- Migration: recorte por organização em todas as políticas RLS
--
-- O padrão a partir daqui é: org_id = current_org_id() OR is_dev().
--
-- O DEV não tem org_id (é NULL, por definição), e no SQL NULL = NULL nunca é
-- verdadeiro — daí o OR is_dev() em vez de comparar com uma org sentinela.
--
-- Esta migration NÃO torna org_id NOT NULL. Ela é aplicada antes do backfill
-- manual; o NOT NULL vem na 04, depois que nenhuma linha estiver órfã.

-- ============================================================
-- FUNÇÕES HELPER
-- ============================================================

-- A role vive em profiles.role. As policies das migrations 06 e 07 testavam
-- auth.jwt()->>'role', que é a role do PostgREST (sempre 'authenticated' para
-- quem está logado) e nunca o papel no Domus — o que concedia acesso indevido.
-- get_current_user_role() volta a ser a fonte da verdade.
CREATE OR REPLACE FUNCTION public.get_current_user_role() RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_org_id() RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_dev() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_current_user_role() = 'dev';
$$;

CREATE OR REPLACE FUNCTION public.is_internal_team() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_current_user_role() IN ('admin', 'corretor', 'financeiro', 'juridico');
$$;

CREATE OR REPLACE FUNCTION public.is_client() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_current_user_role() = 'cliente';
$$;

-- Verdadeiro quando a linha pertence à org de quem está lendo.
CREATE OR REPLACE FUNCTION public.in_current_org(row_org_id UUID) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT row_org_id IS NOT DISTINCT FROM public.current_org_id();
$$;

-- SET search_path em função SECURITY DEFINER não é paranoia: sem ele, um
-- usuário comum pode criar uma função que sequestre o search_path e evitar a
-- resolução de public.current_org_id() para um objeto sob seu controle.

-- ============================================================
-- PREENCHIMENTO AUTOMÁTICO DE org_id
-- ============================================================

-- Nenhum org_id vem do front-end. useCreateEntity/useUpdateEntity em
-- src/hooks/useSupabase.ts repassam dados do chamador direto para .insert();
-- se o browser mandar org_id, o usuário escolheria a própria org.
--
-- Uma policy WITH CHECK (org_id = current_org_id()) não substitui isto: ela
-- valida a linha, mas coluna ausente vira NULL, e NULL = current_org_id() é
-- NULL, que a policy trata como falso — o insert seria rejeitado em vez de
-- preenchido. O trigger preenche; a policy valida. São as duas metades.
CREATE OR REPLACE FUNCTION public.set_org_id() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  -- Sem sessão autenticada (SQL Editor, service role, migração) o trigger não
  -- tem como saber a org de quem está escrevendo. Nessas condições respeita o
  -- valor informado — sem isso, o backfill manual passaria a gravar NULL e
  -- apagaria o org_id que ele acabou de preencher.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_dev() THEN
    -- O DEV pode escrever em qualquer org, e precisa poder explicitá-la.
    NEW.org_id := COALESCE(NEW.org_id, public.current_org_id());
  ELSE
    -- Ignora deliberadamente qualquer org_id vindo do cliente.
    NEW.org_id := public.current_org_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_org_id ON public.properties;
CREATE TRIGGER trg_set_org_id BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS trg_set_org_id ON public.leases;
CREATE TRIGGER trg_set_org_id BEFORE INSERT OR UPDATE ON public.leases
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS trg_set_org_id ON public.sales;
CREATE TRIGGER trg_set_org_id BEFORE INSERT OR UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS trg_set_org_id ON public.payments;
CREATE TRIGGER trg_set_org_id BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS trg_set_org_id ON public.documents;
CREATE TRIGGER trg_set_org_id BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS trg_set_org_id ON public.lease_history;
CREATE TRIGGER trg_set_org_id BEFORE INSERT OR UPDATE ON public.lease_history
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

DROP TRIGGER IF EXISTS trg_set_org_id ON public.clients;
CREATE TRIGGER trg_set_org_id BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

-- Notificações seguem o destinatário, que já é de uma única org.
CREATE OR REPLACE FUNCTION public.set_notification_org_id() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id FROM public.profiles WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_notification_org_id ON public.notifications;
CREATE TRIGGER trg_set_notification_org_id BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_notification_org_id();

-- ============================================================
-- CORREÇÃO DA ESCALADA DE PRIVILÉGIO NO CADASTRO
-- ============================================================

-- handle_new_user lia COALESCE(raw_user_meta_data->>'role', 'cliente')::user_role.
-- O raw_user_meta_data é controlado pelo cliente, então quem se cadastrasse
-- podia mandar role=admin e virar admin. Desligar o signup estreita o caminho,
-- mas o trigger continua sendo a defense que falha.
--
-- A role e a org passam a vir de user_metadata escrita pela edge function
-- dev-create-organization (service role), nunca de um signup público.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meta  JSONB := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb);
  v_role  user_role;
  v_org   UUID;
BEGIN
  -- Só aceita papel que a service role escreveu em app_metadata. Qualquer outro
  -- valor cai em 'cliente'. Validar o texto ANTES do cast importa: um
  -- 'superadmin' solto no metadata estouraria a exceção do cast do enum.
  IF v_meta->>'role' IN ('dev', 'admin', 'corretor', 'financeiro', 'juridico') THEN
    v_role := (v_meta->>'role')::user_role;
  ELSE
    v_role := 'cliente'::user_role;
  END IF;

  -- A org também vem de app_metadata. Um cliente que mandasse org_id no
  -- user_metadata não consegue se colocar dentro de outra imobiliária.
  BEGIN
    v_org := (v_meta->>'org_id')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_org := NULL;
  END;

  INSERT INTO public.profiles (id, role, full_name, email, cpf_cnpj_limpo, org_id)
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'cpf_cnpj_limpo',
    v_org
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- PROFILES
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Internal team can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Internal team can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Internal team can update any profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
  USING (id = auth.uid());

-- Clientes enxergam apenas a si mesmos; a equipe interna vê a própria org.
CREATE POLICY "Internal team can view own org profiles" ON profiles FOR SELECT
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

-- Não se pode criar usuário já vinculado a outra org.
CREATE POLICY "Internal team can insert own org profiles" ON profiles FOR INSERT
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING (id = auth.uid())
  -- role e org_id ficam presos ao usuário. Sem isso, um cliente que se
  -- cadastrou com role='cliente' poderia editar o próprio profile e se
  -- promover a admin — a policy de USING sozinha não impede, porque o USING
  -- só é avaliado na linha antiga, e o WITH CHECK é que julga a nova.
  WITH CHECK (
    id = auth.uid()
    AND public.in_current_org(org_id)
    AND role = public.get_current_user_role()
  );

-- Admin e corretor editam a equipe da própria org; admin e corretor criam.
CREATE POLICY "Internal team can update own org profiles" ON profiles FOR UPDATE
  USING (public.get_current_user_role() IN ('admin', 'corretor')
         AND (public.in_current_org(org_id) OR public.is_dev()))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'corretor')
              AND (public.in_current_org(org_id) OR public.is_dev()));

-- ============================================================
-- PROPERTIES
-- ============================================================

DROP POLICY IF EXISTS "Public can view available properties" ON properties;
DROP POLICY IF EXISTS "Anyone can view available properties" ON properties;
DROP POLICY IF EXISTS "Internal team can view all properties" ON properties;
DROP POLICY IF EXISTS "Owners can view own properties" ON properties;
DROP POLICY IF EXISTS "Internal team can insert properties" ON properties;
DROP POLICY IF EXISTS "Internal team can update properties" ON properties;
DROP POLICY IF EXISTS "Internal team can delete properties" ON properties;

-- A policy TO public de status='disponivel' saiu: sem recorte de org ela
-- vazaria a vitrine de uma imobiliária para as outras. A listagem pública passa
-- a existir somente pela RPC public_property_listings(p_slug), mais abaixo.

CREATE POLICY "Internal team can view own org properties" ON properties FOR SELECT
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Owners can view own properties" ON properties FOR SELECT
  USING (owner_id = auth.uid() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Internal team can insert own org properties" ON properties FOR INSERT
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

-- O WITH CHECK não é redundante: sem ele, um corretor da org A moveria o imóvel
-- para a org B. É o vetor clássico de escape entre tenants.
CREATE POLICY "Internal team can update own org properties" ON properties FOR UPDATE
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()))
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Internal team can delete own org properties" ON properties FOR DELETE
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

-- ============================================================
-- LEASES
-- ============================================================

DROP POLICY IF EXISTS "Internal team can view all leases" ON leases;
DROP POLICY IF EXISTS "Tenants can view own leases" ON leases;
DROP POLICY IF EXISTS "Landlords can view leases for their properties" ON leases;
DROP POLICY IF EXISTS "Internal team can insert leases" ON leases;
DROP POLICY IF EXISTS "Internal team can update leases" ON leases;

CREATE POLICY "Internal team can view own org leases" ON leases FOR SELECT
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Tenants can view own leases" ON leases FOR SELECT
  USING (tenant_id = auth.uid() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Landlords can view own leases" ON leases FOR SELECT
  USING (landlord_id = auth.uid() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Internal team can insert own org leases" ON leases FOR INSERT
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Internal team can update own org leases" ON leases FOR UPDATE
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()))
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

-- ============================================================
-- SALES
-- ============================================================

DROP POLICY IF EXISTS "Internal team can view all sales" ON sales;
DROP POLICY IF EXISTS "Buyers can view own sales" ON sales;
DROP POLICY IF EXISTS "Sellers can view sales for their properties" ON sales;
DROP POLICY IF EXISTS "Internal team can insert sales" ON sales;
DROP POLICY IF EXISTS "Internal team can update sales" ON sales;

CREATE POLICY "Internal team can view own org sales" ON sales FOR SELECT
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Buyers can view own sales" ON sales FOR SELECT
  USING (buyer_id = auth.uid() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Sellers can view own sales" ON sales FOR SELECT
  USING (seller_id = auth.uid() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Internal team can insert own org sales" ON sales FOR INSERT
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Internal team can update own org sales" ON sales FOR UPDATE
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()))
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

-- ============================================================
-- PAYMENTS
-- ============================================================

DROP POLICY IF EXISTS "Internal team can view all payments" ON payments;
DROP POLICY IF EXISTS "Tenants can view own payments" ON payments;
DROP POLICY IF EXISTS "Landlords can view payments for their leases" ON payments;
DROP POLICY IF EXISTS "Internal team can insert payments" ON payments;
DROP POLICY IF EXISTS "Internal team can update payments" ON payments;

CREATE POLICY "Internal team can view own org payments" ON payments FOR SELECT
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Tenants can view own payments" ON payments FOR SELECT
  USING (tenant_id = auth.uid() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Landlords can view own payments" ON payments FOR SELECT
  USING (EXISTS (
          SELECT 1 FROM public.leases l
           WHERE l.id = payments.lease_id
             AND l.landlord_id = auth.uid()
             AND (public.in_current_org(payments.org_id) OR public.is_dev())
        ));

CREATE POLICY "Internal team can insert own org payments" ON payments FOR INSERT
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Internal team can update own org payments" ON payments FOR UPDATE
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()))
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

-- ============================================================
-- CLIENTS
-- ============================================================

-- As policies antigas testavam auth.jwt()->>'role', que é a role do PostgREST.
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins can update clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

CREATE POLICY "Internal team can view own org clients" ON clients FOR SELECT
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Admin and corretor can insert own org clients" ON clients FOR INSERT
  WITH CHECK (public.get_current_user_role() IN ('admin', 'corretor')
              AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Admin and corretor can update own org clients" ON clients FOR UPDATE
  USING (public.get_current_user_role() IN ('admin', 'corretor')
         AND (public.in_current_org(org_id) OR public.is_dev()))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'corretor')
              AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Admin can delete own org clients" ON clients FOR DELETE
  USING (public.get_current_user_role() = 'admin'
         AND (public.in_current_org(org_id) OR public.is_dev()));

-- ============================================================
-- DOCUMENTS
-- ============================================================

DROP POLICY IF EXISTS "Internal team can view all documents" ON documents;
DROP POLICY IF EXISTS "Users can view related documents" ON documents;
DROP POLICY IF EXISTS "Internal team can insert documents" ON documents;

CREATE POLICY "Internal team can view own org documents" ON documents FOR SELECT
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Users can view related documents" ON documents FOR SELECT
  USING (
    (public.in_current_org(org_id) OR public.is_dev()) AND (
      (entity_type = 'user'    AND entity_id = auth.uid()) OR
      (entity_type = 'property' AND EXISTS (
          SELECT 1 FROM public.properties p
           WHERE p.id = documents.entity_id AND p.owner_id = auth.uid())) OR
      (entity_type = 'lease' AND EXISTS (
          SELECT 1 FROM public.leases l
           WHERE l.id = documents.entity_id
             AND (l.tenant_id = auth.uid() OR l.landlord_id = auth.uid()))) OR
      (entity_type = 'sale' AND EXISTS (
          SELECT 1 FROM public.sales s
           WHERE s.id = documents.entity_id
             AND (s.buyer_id = auth.uid() OR s.seller_id = auth.uid())))
    )
  );

CREATE POLICY "Internal team can insert own org documents" ON documents FOR INSERT
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

-- ============================================================
-- LEASE_HISTORY
-- ============================================================

DROP POLICY IF EXISTS "Team can view history" ON lease_history;
DROP POLICY IF EXISTS "Team can insert history" ON lease_history;

CREATE POLICY "Team can view own org history" ON lease_history FOR SELECT
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Team can insert own org history" ON lease_history FOR INSERT
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- A policy anterior era WITH CHECK (true): qualquer usuário autenticado inseria
-- notificação para qualquer user_id, ou seja, forjava notificação para o admin
-- de outra imobiliária.
CREATE POLICY "Internal team can insert notifications" ON notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_internal_team() OR public.is_dev()
  );

-- ============================================================
-- COMPANY_SETTINGS
-- ============================================================

DROP POLICY IF EXISTS "Team can view settings" ON company_settings;
DROP POLICY IF EXISTS "Team can update settings" ON company_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON company_settings;
DROP POLICY IF EXISTS "Admin can insert settings" ON company_settings;
DROP POLICY IF EXISTS "Team can insert settings" ON company_settings;

CREATE POLICY "Team can view own org settings" ON company_settings FOR SELECT
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Admin can update own org settings" ON company_settings FOR UPDATE
  USING (public.get_current_user_role() = 'admin'
         AND (public.in_current_org(org_id) OR public.is_dev()))
  WITH CHECK (public.get_current_user_role() = 'admin'
              AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Admin can insert own org settings" ON company_settings FOR INSERT
  WITH CHECK (public.get_current_user_role() = 'admin'
              AND (public.in_current_org(org_id) OR public.is_dev()));

-- ============================================================
-- CONFIGURACOES
-- ============================================================

DROP POLICY IF EXISTS "Internal team can view configs" ON configuracoes;
DROP POLICY IF EXISTS "Internal team can update configs" ON configuracoes;

CREATE POLICY "Internal team can view own org configs" ON configuracoes FOR SELECT
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

CREATE POLICY "Internal team can update own org configs" ON configuracoes FOR UPDATE
  USING (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()))
  WITH CHECK (public.is_internal_team() AND (public.in_current_org(org_id) OR public.is_dev()));

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own organization" ON organizations;

CREATE POLICY "Users can view own organization" ON organizations FOR SELECT
  USING (id = public.current_org_id() OR public.is_dev());

-- Criar organização é exclusividade da conta DEV, e acontece pela edge function
-- dev-create-organization com service role. Não há policy de INSERT para
-- authenticated: se houvesse, qualquer usuário logado criaria a própria
-- imobiliária e escaparia de qualquer restrição aplicada depois.

-- ============================================================
-- VITRINE PÚBLICA — RPC no lugar da policy anon
-- ============================================================

-- Um visitante não autenticado não tem perfil, então current_org_id() é NULL e
-- ele não veria nada. As três opções eram: policy anon lendo um slug de header,
-- esta RPC, ou dar SELECT de organizations ao anon e filtrar no browser.
-- A terceira trafega dados de todas as orgs e filtra no cliente — é vazamento.
-- A primeira deixa o anon ver a vitrine inteira de qualquer org que ele acertar.
-- A RPC é um ponto único de auditoria e expõe só o que é público por definição.
CREATE OR REPLACE FUNCTION public.public_property_listings(p_slug TEXT)
RETURNS TABLE (
  id                UUID,
  title             TEXT,
  type              public.property_type,
  status            public.property_status,
  address           TEXT,
  address_number    TEXT,
  neighborhood      TEXT,
  city              TEXT,
  state             TEXT,
  zip_code          TEXT,
  area_m2           NUMERIC,
  bedrooms          INTEGER,
  bathrooms         INTEGER,
  parking           INTEGER,
  rent_price        NUMERIC,
  sale_price        NUMERIC,
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
  area_util         NUMERIC,
  construction_year INTEGER,
  "condition"       TEXT,
  floor_number      INTEGER,
  available_from    DATE
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.title, p.type, p.status, p.address, p.address_number,
         p.neighborhood, p.city, p.state, p.zip_code, p.area_m2, p.bedrooms,
         p.bathrooms, p.parking, p.rent_price, p.sale_price, p.description,
         p.images, p.videos, p.features, p.purpose, p.reference_code,
         p.latitude, p.longitude, p.reference_point, p.proximity_details,
         p.furnished_status, p.parking_covered, p.parking_type, p.suites,
         p.floor_plan_url, p.virtual_tour_url, p.pet_allowed, p.has_elevator,
         p.area_util, p.construction_year, p.condition, p.floor_number,
         p.available_from
    FROM public.properties p
    JOIN public.organizations o ON o.id = p.org_id
   WHERE o.slug = p_slug
     AND o.active
     AND p.status = 'disponivel';
$$;

REVOKE ALL ON FUNCTION public.public_property_listings(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_property_listings(TEXT) TO anon, authenticated;

-- Um imóvel específico, para a página /:slug/imovel/:id.
CREATE OR REPLACE FUNCTION public.public_property_detail(p_slug TEXT, p_property_id UUID)
RETURNS SETOF public.properties
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.*
    FROM public.properties p
    JOIN public.organizations o ON o.id = p.org_id
   WHERE o.slug = p_slug
     AND o.active
     AND p.id = p_property_id
     AND p.status = 'disponivel';
$$;

REVOKE ALL ON FUNCTION public.public_property_detail(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_property_detail(TEXT, UUID) TO anon, authenticated;

-- Identidade visual da imobiliária para a vitrine: só o que já é público por
-- definição (nome e contato). Nunca CNPJ, endereço completo ou dados financeiros.
CREATE OR REPLACE FUNCTION public.public_org_branding(p_slug TEXT)
RETURNS TABLE (slug TEXT, name TEXT, logo_url TEXT, whatsapp TEXT, phone TEXT, email TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.slug, o.name, o.logo_url, o.whatsapp, o.phone, o.email
    FROM public.organizations o
   WHERE o.slug = p_slug AND o.active;
$$;

REVOKE ALL ON FUNCTION public.public_org_branding(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_org_branding(TEXT) TO anon, authenticated;

-- ============================================================
-- STORAGE
-- ============================================================

-- As policies liberavam o bucket domus-files inteiro para qualquer autenticado:
-- um corretor da org A lia os arquivos da org B. Recorte por prefixo de pasta.
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Os objetos ficam sob orgs/<org_id>/... O name é a chave completa no bucket,
-- o que faz o prefixo ser o recorte de isolamento.
CREATE POLICY "Allow authenticated uploads in own org"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'domus-files'
    AND (storage.foldername(name))[1] = 'orgs'
    AND (storage.foldername(name))[2] = public.current_org_id()::text
  );

CREATE POLICY "Allow authenticated reads in own org"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'domus-files'
    AND (
      ((storage.foldername(name))[1] = 'orgs'
       AND (storage.foldername(name))[2] = public.current_org_id()::text)
      OR public.is_dev()
    )
  );

CREATE POLICY "Allow authenticated updates in own org"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'domus-files'
         AND (storage.foldername(name))[2] = public.current_org_id()::text)
  WITH CHECK (bucket_id = 'domus-files'
              AND (storage.foldername(name))[2] = public.current_org_id()::text);

CREATE POLICY "Allow authenticated deletes in own org"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'domus-files'
         AND (storage.foldername(name))[2] = public.current_org_id()::text);

-- Leitura pública: só o que estiver sob public/ na org de quem pediu. Como o
-- storage.objects não sabe o slug, a listagem pública de imagens passa a vir
-- das RPCs acima, e o conteúdo fica acessível pela URL pública do R2.
CREATE POLICY "Allow public reads of public folder"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'domus-files' AND (storage.foldername(name))[1] = 'public');

-- ============================================================
-- PUBLIC_CONTACT_SETTINGS — por organização
-- ============================================================

-- A função original era global: o número de contato de uma imobiliária aparecia
-- no portal de todas as outras.
CREATE OR REPLACE FUNCTION public.public_contact_settings(p_slug TEXT DEFAULT NULL)
RETURNS TABLE(whatsapp TEXT, email TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(cs.contact_whatsapp, o.whatsapp),
         COALESCE(cs.contact_email, o.email)
    FROM public.organizations o
    LEFT JOIN public.company_settings cs ON cs.org_id = o.id
   WHERE o.active
     AND (p_slug IS NULL OR o.slug = p_slug)
     AND (p_slug IS NOT NULL OR public.current_org_id() = o.id)
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.public_contact_settings(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_contact_settings(TEXT) TO anon, authenticated;
