-- Migration: Habilitar acesso público aos imóveis disponíveis
-- Permite que usuários não autenticados visualizem imóveis com status 'disponivel'

-- ============================================================
-- PROPERTIES POLICIES
-- ============================================================

-- Remover políticas antigas para recriar
DROP POLICY IF EXISTS "Anyone can view available properties" ON properties;
DROP POLICY IF EXISTS "Public can view available properties" ON properties;
DROP POLICY IF EXISTS "Internal team can view all properties" ON properties;
DROP POLICY IF EXISTS "Owners can view own properties" ON properties;
DROP POLICY IF EXISTS "Internal team can insert properties" ON properties;
DROP POLICY IF EXISTS "Internal team can update properties" ON properties;
DROP POLICY IF EXISTS "Internal team can delete properties" ON properties;

-- Novo: Público pode ver apenas imóveis disponíveis
CREATE POLICY "Public can view available properties"
  ON properties FOR SELECT
  TO public
  USING (status = 'disponivel');

-- Equipe interna vê todos os imóveis
CREATE POLICY "Internal team can view all properties"
  ON properties FOR SELECT
  USING (is_internal_team());

-- Proprietários podem ver seus imóveis
CREATE POLICY "Owners can view own properties"
  ON properties FOR SELECT
  USING (owner_id = auth.uid());

-- Equipe interna pode inserir imóveis
CREATE POLICY "Internal team can insert properties"
  ON properties FOR INSERT
  WITH CHECK (is_internal_team());

-- Equipe interna pode atualizar imóveis
CREATE POLICY "Internal team can update properties"
  ON properties FOR UPDATE
  USING (is_internal_team());

-- Equipe interna pode deletar imóveis
CREATE POLICY "Internal team can delete properties"
  ON properties FOR DELETE
  USING (is_internal_team());
