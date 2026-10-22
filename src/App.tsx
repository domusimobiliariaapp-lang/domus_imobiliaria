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
const AdminUpgrade = lazy(() => import('@/pages/AdminUpgrade').then(m => ({ default: m.AdminUpgrade })))
import { PlanFeatureGate } from '@/components/auth/PlanFeatureGate'
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
const DevPlans = lazy(() => import('@/pages/DevPlans').then(m => ({ default: m.DevPlans })))
const DevLeads = lazy(() => import('@/pages/DevLeads').then(m => ({ default: m.DevLeads })))
const DevAsaas = lazy(() => import('@/pages/DevAsaas').then(m => ({ default: m.DevAsaas })))
const DevContact = lazy(() => import('@/pages/DevContact').then(m => ({ default: m.DevContact })))
const ChangePassword = lazy(() => import('@/pages/ChangePassword').then(m => ({ default: m.ChangePassword })))
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const PublicPortalXml = lazy(() => import('@/pages/PublicPortalXml').then(m => ({ default: m.PublicPortalXml })))
const SolarQuotesAdmin = lazy(() => import('@/pages/solar/SolarQuotesAdmin').then(m => ({ default: m.SolarQuotesAdmin })))
const SolarProjectsAdmin = lazy(() => import('@/pages/solar/SolarProjectsAdmin').then(m => ({ default: m.SolarProjectsAdmin })))
const ObrasProjetosAdmin = lazy(() => import('@/pages/obras/ObrasProjetosAdmin').then(m => ({ default: m.ObrasProjetosAdmin })))
const ObrasDiarioAdmin = lazy(() => import('@/pages/obras/ObrasDiarioAdmin').then(m => ({ default: m.ObrasDiarioAdmin })))
import { getSubdomainInfo } from '@/lib/subdomain'

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
    // Redireciona para o login correto: cliente vai para o login do portal; equipe interna para /login
    const isPortalRoute = location.pathname.startsWith('/portal')
    return <Navigate to={isPortalRoute ? '/portal/login' : '/login'} replace />
  }

  // A troca de senha obrigatória só se aplica à equipe interna (admin, corretor, financeiro, juridico).
  // O DEV fica fora do admin e clientes acessam via código OTP sem senha — mandá-los para /admin/primeiro-acesso
  // geraria um loop infinito porque AdminRoutes recusa clientes e os devolve ao portal.
  if (
    requiresPasswordChange &&
    profile.role !== 'dev' &&
    profile.role !== 'cliente' &&
    location.pathname !== '/admin/primeiro-acesso'
  ) {
    return <Navigate to="/admin/primeiro-acesso" replace />
  }

  if (!allowedRoles.includes(profile.role)) {
    // Cada papel tem seu ambiente de destino sem loops circulares
    if (profile.role === 'cliente') {
      if (location.pathname !== '/portal/dashboard') {
        return <Navigate to="/portal/dashboard" replace />
      }
      return <Navigate to="/portal/login" replace />
    }
    if (profile.role === 'dev') {
      if (location.pathname !== '/dev') {
        return <Navigate to="/dev" replace />
      }
      return <Navigate to="/login" replace />
    }
    // Equipe interna tentando acessar área de cliente ou outra não permitida:
    if (!location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/dashboard" replace />
    }
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

/**
 * Roteador inteligente da raiz (/):
 * - Se acessado via subdomínio de imobiliária (ex: aurora.domus.com.br ou aurora.localhost:5173),
 *   redireciona para a vitrine pública daquela imobiliária (/aurora/imoveis).
 * - Se acessado no domínio principal (ex: domus.com.br ou localhost:5173), exibe a Landing Page.
 */
function RootRoute() {
  const subdomain = getSubdomainInfo()
  if (subdomain.isSubdomain && subdomain.slug) {
    return <Navigate to={`/${subdomain.slug}/imoveis`} replace />
  }
  return <LandingPage />
}

/**
 * Roteador de login do portal:
 * Se acessado via subdomínio da imobiliária, redireciona para o login do portal com o slug correspondente.
 */
function PortalLoginRoute() {
  const subdomain = getSubdomainInfo()
  if (subdomain.isSubdomain && subdomain.slug) {
    return <Navigate to={`/${subdomain.slug}/portal/login`} replace />
  }
  return <LoginPortal />
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Rota raiz inteligente: Landing Page no domínio principal ou Vitrine no subdomínio */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />

        {/* Public login routes */}
        <Route path="/login" element={<LoginAdmin />} />
        <Route path="/portal/login" element={<PortalLoginRoute />} />
        {/* O portal identifica o cliente por CPF/telefone, o que não é único entre
            imobiliárias. O slug diz de quem é a carteira que está entrando. */}
        <Route path="/:slug/portal/login" element={<LoginPortal />} />

        {/* Área da conta DEV. Fica fora de /login de propósito: essa tela manda o
            usuário para /admin ou /portal conforme o papel, e o DEV não é dos dois. */}
        <Route path="/dev" element={<DevRoutes />}>
          <Route element={<DevLayout />}>
            <Route index element={<DevOrganizations />} />
            <Route path="leads" element={<DevLeads />} />
            <Route path="planos" element={<DevPlans />} />
            <Route path="asaas" element={<DevAsaas />} />
            <Route path="contato" element={<DevContact />} />
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
            <Route
              path="crm"
              element={
                <PlanFeatureGate
                  feature="crm"
                  title="CRM Imobiliário & Radar"
                  description="Acompanhe leads, qualifique clientes e cruze o perfil de busca com os imóveis da carteira em um funil inteligente."
                  benefits={[
                    'Funil Kanban com etapas de atendimento customizáveis',
                    'Radar que cruza clientes com imóveis disponíveis instantaneamente',
                    'Histórico de visitas, propostas e negociações em andamento',
                  ]}
                >
                  <CrmAdmin />
                </PlanFeatureGate>
              }
            />
            <Route path="clients" element={<ClientsAdmin />} />
            <Route path="sales" element={<SalesAdmin />} />
            <Route path="contracts" element={<ContractsAdmin />} />
            <Route
              path="inspections"
              element={
                <PlanFeatureGate
                  feature="vistorias"
                  title="Vistorias Digitais Fotográficas"
                  description="Gere laudos fotográficos com data, hora, assinatura digital das partes e comparativo de entrega das chaves."
                  benefits={[
                    'Upload de fotos por cômodo com notas de estado de conservação',
                    'Laudo em PDF pronto para assinatura do inquilino e proprietário',
                    'Histórico auditável para evitar contestações na devolução do imóvel',
                  ]}
                >
                  <InspectionsAdmin />
                </PlanFeatureGate>
              }
            />
            <Route path="renewals" element={<RenewalsAdmin />} />
            <Route path="financial" element={<FinancialAdmin />} />
            <Route path="legal" element={<LegalAdmin />} />
            <Route path="administrative" element={<AdministrativeAdmin />} />
            <Route path="upgrade" element={<AdminUpgrade />} />
            {/* Locações e Contratos são a mesma tabela (leases). Unificar evita duas telas divergentes. */}
            <Route path="leases" element={<Navigate to="/admin/contracts" replace />} />
            <Route path="chamados" element={<AdminSupport />} />
            <Route path="equipe" element={<AdminTeam />} />

            {/* Módulo Energia Solar */}
            <Route path="solar/orcamentos" element={<SolarQuotesAdmin />} />
            <Route path="solar/projetos" element={<SolarProjectsAdmin />} />
            <Route path="solar/kits" element={<SolarQuotesAdmin />} />
            <Route path="solar/os" element={<SolarProjectsAdmin />} />
            <Route path="solar/fornecedores" element={<SolarQuotesAdmin />} />

            {/* Módulo Engenharia & Obras */}
            <Route path="obras/projetos" element={<ObrasProjetosAdmin />} />
            <Route path="obras/diario" element={<ObrasDiarioAdmin />} />
            <Route path="obras/medicoes" element={<ObrasProjetosAdmin />} />
            <Route path="obras/cronograma" element={<ObrasProjetosAdmin />} />
            <Route path="obras/compras" element={<ObrasProjetosAdmin />} />
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


        {/* Vitrine pública, por prefixo de caminho: /:slug/imoveis e /:slug/imovel/:id.
            Cada imobiliária tem o seu próprio slug, então uma vitrine nunca mostra
            os imóveis de outra. */}
        <Route path="/:slug/imoveis" element={<PublicProperties />} />
        <Route path="/:slug/imovel/:id" element={<PublicPropertyDetail />} />
        <Route path="/:slug/portais.xml" element={<PublicPortalXml />} />
        <Route path="/:slug/feed.xml" element={<PublicPortalXml />} />

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
