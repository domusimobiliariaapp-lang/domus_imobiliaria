import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface PortalLayoutProps {
  children: React.ReactNode
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/portal/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container-domus">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-serif text-2xl font-medium text-primary">
                Domus<span className="text-[#AD7B3B]">.</span>
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="/portal/dashboard">Dashboard</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/portal/properties">Meus Imóveis</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/portal/leases">Minhas Locações</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/portal/payments">Pagamentos</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/portal/documents">Documentos</a>
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