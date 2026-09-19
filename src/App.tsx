import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PortalLayout } from '@/components/layout/PortalLayout'

function AdminRoutes() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!profile || !['admin', 'corretor', 'financeiro', 'juridico'].includes(profile.role)) {
    return <Navigate to="/login" replace />
  }

  return (
    <AdminLayout user={{ name: profile.full_name, role: profile.role }}>
      <Routes>
        <Route path="/admin/dashboard" element={<div>Dashboard Admin</div>} />
        <Route path="/admin/properties" element={<div>Imóveis</div>} />
        <Route path="/admin/leases" element={<div>Locações</div>} />
        <Route path="/admin/sales" element={<div>Vendas</div>} />
        <Route path="/admin/financial" element={<div>Financeiro</div>} />
        <Route path="/admin/documents" element={<div>Documentos</div>} />
        <Route path="/admin/users" element={<div>Usuários</div>} />
        <Route path="/admin/settings" element={<div>Configurações</div>} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  )
}

function PortalRoutes() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!profile || profile.role !== 'cliente') {
    return <Navigate to="/portal/login" replace />
  }

  return (
    <PortalLayout user={{ name: profile.full_name, role: profile.role }}>
      <Routes>
        <Route path="/portal/dashboard" element={<div>Dashboard Cliente</div>} />
        <Route path="/portal/properties" element={<div>Meus Imóveis</div>} />
        <Route path="/portal/leases" element={<div>Minhas Locações</div>} />
        <Route path="/portal/payments" element={<div>Pagamentos</div>} />
        <Route path="/portal/documents" element={<div>Documentos</div>} />
        <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
      </Routes>
    </PortalLayout>
  )
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login Admin</div>} />
      <Route path="/portal/login" element={<div>Login Portal</div>} />
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/portal/*" element={<PortalRoutes />} />
      <Route path="/*" element={<PublicRoutes />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App