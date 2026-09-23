-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is internal team
CREATE OR REPLACE FUNCTION is_internal_team() RETURNS boolean AS $$
  SELECT get_current_user_role() IN ('admin', 'corretor', 'financeiro', 'juridico');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is client
CREATE OR REPLACE FUNCTION is_client() RETURNS boolean AS $$
  SELECT get_current_user_role() = 'cliente';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Users can see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Internal team can see all profiles
CREATE POLICY "Internal team can view all profiles"
  ON profiles FOR SELECT
  USING (is_internal_team());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Internal team can insert profiles (for client creation)
CREATE POLICY "Internal team can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_internal_team());

-- Internal team can update any profile
CREATE POLICY "Internal team can update any profile"
  ON profiles FOR UPDATE
  USING (is_internal_team());

-- ============================================================
-- PROPERTIES POLICIES
-- ============================================================

-- Everyone can view available properties (for public listings)
CREATE POLICY "Anyone can view available properties"
  ON properties FOR SELECT
  USING (status = 'disponivel');

-- Internal team can view all properties
CREATE POLICY "Internal team can view all properties"
  ON properties FOR SELECT
  USING (is_internal_team());

-- Property owners can view their properties
CREATE POLICY "Owners can view own properties"
  ON properties FOR SELECT
  USING (owner_id = auth.uid());

-- Internal team can insert properties
CREATE POLICY "Internal team can insert properties"
  ON properties FOR INSERT
  WITH CHECK (is_internal_team());

-- Internal team can update properties
CREATE POLICY "Internal team can update properties"
  ON properties FOR UPDATE
  USING (is_internal_team());

-- Internal team can delete properties
CREATE POLICY "Internal team can delete properties"
  ON properties FOR DELETE
  USING (is_internal_team());

-- ============================================================
-- LEASES POLICIES
-- ============================================================

-- Internal team can view all leases
CREATE POLICY "Internal team can view all leases"
  ON leases FOR SELECT
  USING (is_internal_team());

-- Tenants can view their own leases
CREATE POLICY "Tenants can view own leases"
  ON leases FOR SELECT
  USING (tenant_id = auth.uid());

-- Landlords can view leases for their properties
CREATE POLICY "Landlords can view leases for their properties"
  ON leases FOR SELECT
  USING (landlord_id = auth.uid());

-- Internal team can insert leases
CREATE POLICY "Internal team can insert leases"
  ON leases FOR INSERT
  WITH CHECK (is_internal_team());

-- Internal team can update leases
CREATE POLICY "Internal team can update leases"
  ON leases FOR UPDATE
  USING (is_internal_team());

-- ============================================================
-- SALES POLICIES
-- ============================================================

-- Internal team can view all sales
CREATE POLICY "Internal team can view all sales"
  ON sales FOR SELECT
  USING (is_internal_team());

-- Buyers can view their own sales
CREATE POLICY "Buyers can view own sales"
  ON sales FOR SELECT
  USING (buyer_id = auth.uid());

-- Sellers can view sales for their properties
CREATE POLICY "Sellers can view sales for their properties"
  ON sales FOR SELECT
  USING (seller_id = auth.uid());

-- Internal team can insert sales
CREATE POLICY "Internal team can insert sales"
  ON sales FOR INSERT
  WITH CHECK (is_internal_team());

-- Internal team can update sales
CREATE POLICY "Internal team can update sales"
  ON sales FOR UPDATE
  USING (is_internal_team());

-- ============================================================
-- PAYMENTS POLICIES
-- ============================================================

-- Internal team can view all payments
CREATE POLICY "Internal team can view all payments"
  ON payments FOR SELECT
  USING (is_internal_team());

-- Tenants can view their own payments
CREATE POLICY "Tenants can view own payments"
  ON payments FOR SELECT
  USING (tenant_id = auth.uid());

-- Landlords can view payments for their leases
CREATE POLICY "Landlords can view payments for their leases"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leases l
      WHERE l.id = payments.lease_id
      AND l.landlord_id = auth.uid()
    )
  );

-- Internal team can insert payments
CREATE POLICY "Internal team can insert payments"
  ON payments FOR INSERT
  WITH CHECK (is_internal_team());

-- Internal team can update payments
CREATE POLICY "Internal team can update payments"
  ON payments FOR UPDATE
  USING (is_internal_team());

-- ============================================================
-- DOCUMENTS POLICIES
-- ============================================================

-- Internal team can view all documents
CREATE POLICY "Internal team can view all documents"
  ON documents FOR SELECT
  USING (is_internal_team());

-- Users can view documents related to their entities
CREATE POLICY "Users can view related documents"
  ON documents FOR SELECT
  USING (
    (entity_type = 'user' AND entity_id = auth.uid()) OR
    (entity_type = 'property' AND EXISTS (
      SELECT 1 FROM properties p WHERE p.id = documents.entity_id AND p.owner_id = auth.uid()
    )) OR
    (entity_type = 'lease' AND EXISTS (
      SELECT 1 FROM leases l WHERE l.id = documents.entity_id AND (l.tenant_id = auth.uid() OR l.landlord_id = auth.uid())
    )) OR
    (entity_type = 'sale' AND EXISTS (
      SELECT 1 FROM sales s WHERE s.id = documents.entity_id AND (s.buyer_id = auth.uid() OR s.seller_id = auth.uid())
    ))
  );

-- Internal team can insert documents
CREATE POLICY "Internal team can insert documents"
  ON documents FOR INSERT
  WITH CHECK (is_internal_team());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- System can insert notifications (via edge functions or service role)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);