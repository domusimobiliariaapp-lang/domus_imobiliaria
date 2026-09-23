-- Migration 06: Create clients table and restructure profiles

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL DEFAULT 'cliente',
  full_name TEXT NOT NULL,
  cpf_cnpj TEXT,
  cpf_cnpj_limpo TEXT,
  telefone TEXT,
  telefone_e164 TEXT,
  email TEXT,
  tipo_relacao TEXT CHECK (tipo_relacao IN ('locatario', 'locador', 'comprador', 'vendedor', 'fiador')),
  categoria TEXT CHECK (categoria IN ('pf', 'pj')),
  endereco TEXT,
  status TEXT CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create lease_history table
CREATE TABLE IF NOT EXISTS lease_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('created', 'updated', 'renewed', 'cancelled', 'closed')),
  detail TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add reported_paid columns to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reported_paid_by_client BOOLEAN DEFAULT FALSE,
                     ADD COLUMN IF NOT EXISTS reported_paid_at TIMESTAMPTZ;

-- 4. Add client_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- 5. Migrate existing client data from profiles to clients
DO $$
DECLARE
  client_record RECORD;
BEGIN
  FOR client_record IN
    SELECT id, role, full_name, cpf_cnpj_limpo, phone as telefone, telefone_e164,
           email, tipo_relacao, categoria, endereco, status, observacoes, created_at, updated_at
    FROM profiles
    WHERE role = 'cliente'
  LOOP
    INSERT INTO clients (role, full_name, cpf_cnpj_limpo, telefone, telefone_e164,
                         email, tipo_relacao, categoria, endereco, status, observacoes, created_at, updated_at)
    VALUES (client_record.role, client_record.full_name, client_record.cpf_cnpj_limpo,
            client_record.telefone, client_record.telefone_e164,
            client_record.email, client_record.tipo_relacao, client_record.categoria,
            client_record.endereco, client_record.status, client_record.observacoes,
            client_record.created_at, client_record.updated_at)
    ON CONFLICT DO NOTHING;

    -- Update profiles with client_id
    UPDATE profiles
    SET client_id = (SELECT id FROM clients c WHERE c.cpf_cnpj_limpo = profiles.cpf_cnpj_limpo LIMIT 1)
    WHERE role = 'cliente' AND client_id IS NULL;
  END LOOP;
END $$;

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf_cnpj_limpo) WHERE cpf_cnpj_limpo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_lease_history_lease ON lease_history(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_reported ON payments(reported_paid_by_client, status);

-- 7. Enable RLS on new tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_history ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies for clients
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins can update clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

CREATE POLICY "Admins can view all clients" ON clients FOR SELECT TO authenticated USING (
  auth.jwt()->>'role' IN ('admin', 'corretor', 'financeiro', 'juridico')
);
CREATE POLICY "Admins can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (
  auth.jwt()->>'role' IN ('admin', 'corretor')
);
CREATE POLICY "Admins can update clients" ON clients FOR UPDATE TO authenticated USING (
  auth.jwt()->>'role' IN ('admin', 'corretor')
);
CREATE POLICY "Admins can delete clients" ON clients FOR DELETE TO authenticated USING (
  auth.jwt()->>'role' = 'admin'
);

-- 9. RLS policies for lease_history
DROP POLICY IF EXISTS "Team can view history" ON lease_history;
DROP POLICY IF EXISTS "Team can insert history" ON lease_history;

CREATE POLICY "Team can view history" ON lease_history FOR SELECT TO authenticated USING (
  auth.jwt()->>'role' IN ('admin', 'corretor', 'financeiro', 'juridico')
);
CREATE POLICY "Team can insert history" ON lease_history FOR INSERT TO authenticated WITH CHECK (
  auth.jwt()->>'role' IN ('admin', 'corretor', 'financeiro', 'juridico')
);
