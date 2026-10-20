import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface PortalLayoutProps {
  children: React.ReactNode
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { signOut, organization, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await signOut()
    navigate('/portal/login', { replace: true })
  }

  const isActive = (path: string) => location.pathname === path || (path !== '/portal/dashboard' && location.pathname.startsWith(path))

  const navItems = [
    { href: '/portal/dashboard', label: 'Início' },
    { href: '/portal/properties', label: 'Meus Imóveis' },
    { href: '/portal/leases', label: 'Contratos & Locações' },
    { href: '/portal/payments', label: 'Boletos & Pagamentos' },
    ...(profile?.tipo_relacao !== 'locatario'
      ? [{ href: '/portal/repasses', label: 'Repasses' }]
      : []),
    { href: '/portal/documents', label: 'Documentos' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-2xs">
        <div className="container-domus">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-serif text-2xl font-medium text-primary">
                {organization?.name || 'Domus'}<span className="text-[#AD7B3B]">.</span>
              </span>
              <Badge variant="outline" className="hidden md:inline-flex text-[11px] font-normal border-border/60 text-muted-foreground">
                Portal do Cliente
              </Badge>
            </div>

            <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-xs sm:text-sm font-medium transition-all rounded-md px-2.5 sm:px-3',
                      active
                        ? 'bg-[#AD7B3B]/10 text-primary font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-primary hover:bg-muted/60'
                    )}
                    asChild
                  >
                    <Link to={item.href}>{item.label}</Link>
                  </Button>
                )
              })}
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs sm:text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50"
              >
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