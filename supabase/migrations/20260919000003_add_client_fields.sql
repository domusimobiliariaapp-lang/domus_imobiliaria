-- Add client identification fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cpf_cnpj_limpo TEXT,
  ADD COLUMN IF NOT EXISTS telefone_e164 TEXT;

-- Add indexes for client lookup
CREATE INDEX IF NOT EXISTS idx_profiles_cpf_cnpj ON profiles(cpf_cnpj_limpo);
CREATE INDEX IF NOT EXISTS idx_profiles_telefone ON profiles(telefone_e164);
CREATE INDEX IF NOT EXISTS idx_profiles_role_cpf ON profiles(role, cpf_cnpj_limpo);

-- Create configuracoes table for system settings
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default config with contact phone
INSERT INTO configuracoes (chave, valor)
VALUES ('telefone_contato', '"(11) 99999-9999"')
ON CONFLICT (chave) DO NOTHING;

-- Enable RLS on configuracoes
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Internal team can view all configs
CREATE POLICY "Internal team can view configs"
  ON configuracoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'corretor', 'financeiro', 'juridico')
    )
  );

-- Internal team can update configs
CREATE POLICY "Internal team can update configs"
  ON configuracoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'corretor', 'financeiro', 'juridico')
    )
  );