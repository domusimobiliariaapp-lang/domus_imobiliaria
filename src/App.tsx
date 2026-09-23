import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/ui/toast'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { LoginAdmin } from '@/pages/LoginAdmin'
import { LoginPortal } from '@/pages/LoginPortal'
import { DashboardAdmin } from '@/pages/DashboardAdmin'
import { ClientsAdmin } from '@/pages/ClientsAdmin'
import { RenewalsAdmin } from '@/pages/RenewalsAdmin'
import { PropertiesAdmin } from '@/pages/PropertiesAdmin'
import { SalesAdmin } from '@/pages/SalesAdmin'
import { ContractsAdmin } from '@/pages/ContractsAdmin'
import { FinancialAdmin } from '@/pages/FinancialAdmin'
import { LegalAdmin } from '@/pages/LegalAdmin'
import { AdministrativeAdmin } from '@/pages/AdministrativeAdmin'
import { LeasesAdmin } from '@/pages/LeasesAdmin'
import { PortalDashboard } from '@/pages/portal/PortalDashboard'
import { PortalProperties } from '@/pages/portal/PortalProperties'
import { PortalLeases } from '@/pages/portal/PortalLeases'
import { PortalPayments } from '@/pages/portal/PortalPayments'
import { PublicProperties } from '@/pages/PublicProperties'
import { PublicPropertyDetail } from '@/pages/PublicPropertyDetail'

function RequireAuth({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={profile.role === 'cliente' ? '/portal/dashboard' : '/login'} replace />
  }

  return <>{children}</>
}

function AdminRoutes() {
  return (
    <RequireAuth allowedRoles={['admin', 'corretor', 'financeiro', 'juridico']}>
      <Outlet />
    </RequireAuth>
  )
}

function PortalRoutes() {
  return (
    <RequireAuth allowedRoles={['cliente']}>
      <Outlet />
    </RequireAuth>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public login routes */}
      <Route path="/login" element={<LoginAdmin />} />
      <Route path="/portal/login" element={<LoginPortal />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoutes />}>
        <Route element={<AdminLayout>
            <Outlet />
          </AdminLayout>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardAdmin />} />
          <Route path="properties" element={<PropertiesAdmin />} />
          <Route path="clients" element={<ClientsAdmin />} />
          <Route path="sales" element={<SalesAdmin />} />
          <Route path="contracts" element={<ContractsAdmin />} />
          <Route path="renewals" element={<RenewalsAdmin />} />
          <Route path="financial" element={<FinancialAdmin />} />
          <Route path="legal" element={<LegalAdmin />} />
          <Route path="administrative" element={<AdministrativeAdmin />} />
          <Route path="leases" element={<LeasesAdmin />} />
        </Route>
      </Route>

      {/* Portal routes */}
      <Route path="/portal" element={<PortalRoutes />}>
        <Route element={
          <PortalLayout>
            <Outlet />
          </PortalLayout>
        }>
          <Route index element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="dashboard" element={<PortalDashboard />} />
          <Route path="properties" element={<PortalProperties />} />
          <Route path="leases" element={<PortalLeases />} />
          <Route path="payments" element={<PortalPayments />} />
          <Route path="documents" element={<div className="text-3xl font-serif font-medium">Documentos</div>} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/imoveis" replace />} />

      {/* Public routes */}
      <Route path="/imoveis" element={<PublicProperties />} />
      <Route path="/imovel/:id" element={<PublicPropertyDetail />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App