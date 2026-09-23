-- Migration 07: Add company_settings table

CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Domus Imobiliária',
  cnpj TEXT,
  address TEXT,
  phone TEXT,
  admin_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  default_reajuste_index TEXT NOT NULL DEFAULT 'IGPM',
  renewal_alert_days INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one row exists
INSERT INTO company_settings (id, company_name, admin_fee_percent, default_reajuste_index, renewal_alert_days)
VALUES ('00000000-0000-0000-0000-000000000001', 'Domus Imobiliária', 5.00, 'IGPM', 60)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Only internal team can read/write
DROP POLICY IF EXISTS "Team can view settings" ON company_settings;
DROP POLICY IF EXISTS "Team can update settings" ON company_settings;

CREATE POLICY "Team can view settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' IN ('admin', 'corretor', 'financeiro', 'juridico'));

CREATE POLICY "Team can update settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' IN ('admin', 'corretor'));

CREATE POLICY "Team can insert settings"
  ON company_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'corretor'));
