ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

CREATE OR REPLACE FUNCTION public_contact_settings()
RETURNS TABLE(whatsapp TEXT, email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT contact_whatsapp, contact_email
  FROM company_settings
  WHERE id = '00000000-0000-0000-0000-000000000001';
$$;

REVOKE ALL ON FUNCTION public_contact_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public_contact_settings() TO anon, authenticated;
