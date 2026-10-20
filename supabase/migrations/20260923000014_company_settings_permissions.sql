-- A role da imobiliária fica em profiles.role; auth.jwt()->>'role' é a role do PostgREST.
-- O navegador usa a role authenticated e precisa de privilégios na tabela além da RLS.
GRANT SELECT, UPDATE, INSERT ON TABLE public.company_settings TO authenticated;
REVOKE ALL ON TABLE public.company_settings FROM anon;

DROP POLICY IF EXISTS "Team can view settings" ON public.company_settings;
DROP POLICY IF EXISTS "Team can update settings" ON public.company_settings;
DROP POLICY IF EXISTS "Team can insert settings" ON public.company_settings;

CREATE POLICY "Team can view settings"
  ON public.company_settings FOR SELECT TO authenticated
  USING (public.is_internal_team());

CREATE POLICY "Admin can update settings"
  ON public.company_settings FOR UPDATE TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admin can insert settings"
  ON public.company_settings FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() = 'admin');
