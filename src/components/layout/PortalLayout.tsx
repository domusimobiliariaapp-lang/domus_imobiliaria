import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface PortalLayoutProps {
  children: React.ReactNode
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { signOut, organization, profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/portal/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container-domus">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-4 shrink-0">
              <span className="font-serif text-2xl font-medium text-primary">
                {organization?.name || 'Domus'}<span className="text-[#AD7B3B]">.</span>
              </span>
            </div>
            <nav className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/portal/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/portal/properties">Meus Imóveis</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/portal/leases">Minhas Locações</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/portal/payments">Pagamentos</Link>
              </Button>
              {profile?.tipo_relacao !== 'locatario' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/portal/repasses">Repasses</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/portal/documents">Documentos</Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="container-domus py-6">{children}</main>
    </div>
  )
}