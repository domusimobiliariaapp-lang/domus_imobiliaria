-- Migration: Configurar políticas de storage para domus-files
-- INSTRUÇÕES: Execute o SQL abaixo no SQL Editor do Supabase Dashboard

-- Passo 1: Criar bucket (já feito via dashboard)
-- Passo 2: Criar políticas RLS

-- Habilitar RLS na tabela de objetos (se necessário)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Criar políticas
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'domus-files');

CREATE POLICY "Allow authenticated reads"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'domus-files');

CREATE POLICY "Allow authenticated updates"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'domus-files')
  WITH CHECK (bucket_id = 'domus-files');

CREATE POLICY "Allow authenticated deletes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'domus-files');

CREATE POLICY "Allow public reads"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'domus-files');
