import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams, useLocation } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PortalLayout } from '@/components/layout/PortalLayout'

// Code-splitting via React.lazy() para isolar chunks (Admin, Dev, Portal e Vitrine Pública)
const LoginAdmin = lazy(() => import('@/pages/LoginAdmin').then(m => ({ default: m.LoginAdmin })))
const LoginPortal = lazy(() => import('@/pages/LoginPortal').then(m => ({ default: m.LoginPortal })))
const DashboardAdmin = lazy(() => import('@/pages/DashboardAdmin').then(m => ({ default: m.DashboardAdmin })))
const ClientsAdmin = lazy(() => import('@/pages/ClientsAdmin').then(m => ({ default: m.ClientsAdmin })))
const RenewalsAdmin = lazy(() => import('@/pages/RenewalsAdmin').then(m => ({ default: m.RenewalsAdmin })))
const PropertiesAdmin = lazy(() => import('@/pages/PropertiesAdmin').then(m => ({ default: m.PropertiesAdmin })))
const CrmAdmin = lazy(() => import('@/pages/CrmAdmin').then(m => ({ default: m.CrmAdmin })))
const InspectionsAdmin = lazy(() => import('@/pages/InspectionsAdmin').then(m => ({ default: m.InspectionsAdmin })))
const SalesAdmin = lazy(() => import('@/pages/SalesAdmin').then(m => ({ default: m.SalesAdmin })))
const ContractsAdmin = lazy(() => import('@/pages/ContractsAdmin').then(m => ({ default: m.ContractsAdmin })))
const FinancialAdmin = lazy(() => import('@/pages/FinancialAdmin').then(m => ({ default: m.FinancialAdmin })))
const LegalAdmin = lazy(() => import('@/pages/LegalAdmin').then(m => ({ default: m.LegalAdmin })))
const AdministrativeAdmin = lazy(() => import('@/pages/AdministrativeAdmin').then(m => ({ default: m.AdministrativeAdmin })))
const AdminSupport = lazy(() => import('@/pages/AdminSupport').then(m => ({ default: m.AdminSupport })))
const AdminTeam = lazy(() => import('@/pages/AdminTeam').then(m => ({ default: m.AdminTeam })))
const PortalDashboard = lazy(() => import('@/pages/portal/PortalDashboard').then(m => ({ default: m.PortalDashboard })))
const PortalProperties = lazy(() => import('@/pages/portal/PortalProperties').then(m => ({ default: m.PortalProperties })))
const PortalLeases = lazy(() => import('@/pages/portal/PortalLeases').then(m => ({ default: m.PortalLeases })))
const PortalPayments = lazy(() => import('@/pages/portal/PortalPayments').then(m => ({ default: m.PortalPayments })))
const PortalDocuments = lazy(() => import('@/pages/portal/PortalDocuments').then(m => ({ default: m.PortalDocuments })))
const PortalRepasses = lazy(() => import('@/pages/portal/PortalRepasses').then(m => ({ default: m.PortalRepasses })))
const PublicPropertyDetail = lazy(() => import('@/pages/PublicPropertyDetail').then(m => ({ default: m.PublicPropertyDetail })))
const PublicProperties = lazy(() => import('@/pages/PublicProperties').then(m => ({ default: m.PublicProperties })))
const DevOrganizations = lazy(() => import('@/pages/DevOrganizations').then(m => ({ default: m.DevOrganizations })))
const DevLayout = lazy(() => import('@/pages/DevLayout').then(m => ({ default: m.DevLayout })))
const DevUsers = lazy(() => import('@/pages/DevUsers').then(m => ({ default: m.DevUsers })))
const DevTickets = lazy(() => import('@/pages/DevTickets').then(m => ({ default: m.DevTickets })))
const DevErrors = lazy(() => import('@/pages/DevErrors').then(m => ({ default: m.DevErrors })))
const DevAudit = lazy(() => import('@/pages/DevAudit').then(m => ({ default: m.DevAudit })))
const ChangePassword = lazy(() => import('@/pages/ChangePassword').then(m => ({ default: m.ChangePassword })))

function PageLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AD7B3B]" />
    </div>
  )
}

function RequireAuth({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const { profile, loading, requiresPasswordChange } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoading />
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  // A troca de senha vem ANTES do teste de papel, e não depois. Quem entra com
  // a senha provisória não deve ver uma linha sequer da área interna — nem
  // "só por um segundo" antes de a troca ser exigida. Como o gate está aqui, e
  // não dentro de cada tela, nenhuma rota nova pode esquecer dele.
  // IMPORTANTE: evitar loop se já estivermos na tela de primeiro acesso.
  if (requiresPasswordChange && profile.role !== 'dev' && location.pathname !== '/admin/primeiro-acesso') {
    return <Navigate to="/admin/primeiro-acesso" replace />
  }

  if (!allowedRoles.includes(profile.role)) {
    // Cada papel tem um destino só. O DEV não pertence a /admin nem a /portal;
    // mandá-lo para /login criaria um ciclo de redirecionamento, porque o
    // RequireAuth de lá o devolveria para /dev.
    if (profile.role === 'cliente') return <Navigate to="/portal/dashboard" replace />
    if (profile.role === 'dev') return <Navigate to="/dev" replace />
    return <Navigate to="/login" replace />
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

function DevRoutes() {
  return (
    <RequireAuth allowedRoles={['dev']}>
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

/**
 * Links /imovel/:id existiam antes do multi-tenant, quando só havia a Domus.
 * Redireciona para o slug correspondente em vez de quebrar silenciosamente.
 */
function LegacyPropertyRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/domus/imovel/${id}`} replace />
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Public login routes */}
        <Route path="/login" element={<LoginAdmin />} />
        <Route path="/portal/login" element={<LoginPortal />} />
        {/* O portal identifica o cliente por CPF/telefone, o que não é único entre
            imobiliárias. O slug diz de quem é a carteira que está entrando. */}
        <Route path="/:slug/portal/login" element={<LoginPortal />} />

        {/* Área da conta DEV. Fica fora de /login de propósito: essa tela manda o
            usuário para /admin ou /portal conforme o papel, e o DEV não é dos dois. */}
        <Route path="/dev" element={<DevRoutes />}>
          <Route element={<DevLayout />}>
            <Route index element={<DevOrganizations />} />
            <Route path="usuarios" element={<DevUsers />} />
            <Route path="chamados" element={<DevTickets />} />
            <Route path="erros" element={<DevErrors />} />
            <Route path="auditoria" element={<DevAudit />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoutes />}>
          {/* Troca de senha obrigatória no 1º acesso (fora do AdminLayout) */}
          <Route path="primeiro-acesso" element={<ChangePassword />} />
          <Route
            element={
              <AdminLayout>
                <Outlet />
              </AdminLayout>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardAdmin />} />
            <Route path="properties" element={<PropertiesAdmin />} />
            <Route path="crm" element={<CrmAdmin />} />
            <Route path="clients" element={<ClientsAdmin />} />
            <Route path="sales" element={<SalesAdmin />} />
            <Route path="contracts" element={<ContractsAdmin />} />
            <Route path="inspections" element={<InspectionsAdmin />} />
            <Route path="renewals" element={<RenewalsAdmin />} />
            <Route path="financial" element={<FinancialAdmin />} />
            <Route path="legal" element={<LegalAdmin />} />
            <Route path="administrative" element={<AdministrativeAdmin />} />
            {/* Locações e Contratos são a mesma tabela (leases). Unificar evita duas telas divergentes. */}
            <Route path="leases" element={<Navigate to="/admin/contracts" replace />} />
            <Route path="chamados" element={<AdminSupport />} />
            <Route path="equipe" element={<AdminTeam />} />
          </Route>
        </Route>

        {/* Portal routes */}
        <Route path="/portal" element={<PortalRoutes />}>
          <Route
            element={
              <PortalLayout>
                <Outlet />
              </PortalLayout>
            }
          >
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="properties" element={<PortalProperties />} />
            <Route path="leases" element={<PortalLeases />} />
            <Route path="payments" element={<PortalPayments />} />
            <Route path="documents" element={<PortalDocuments />} />
            <Route path="repasses" element={<PortalRepasses />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Vitrine pública, por prefixo de caminho: /:slug/imoveis e /:slug/imovel/:id.
            Cada imobiliária tem o seu próprio slug, então uma vitrine nunca mostra
            os imóveis de outra. */}
        <Route path="/:slug/imoveis" element={<PublicProperties />} />
        <Route path="/:slug/imovel/:id" element={<PublicPropertyDetail />} />

        {/* Links antigos, sem o slug, ainda divulgadas pela Domus. */}
        <Route path="/imoveis" element={<Navigate to="/domus/imoveis" replace />} />
        <Route path="/imovel/:id" element={<LegacyPropertyRedirect />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
