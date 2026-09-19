import * as React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DomusHeader } from '@/components/layout/DomusHeader'
import { Button } from '@/components/ui/button'

interface PortalLayoutProps {
  user?: {
    name: string
    role: string
    avatar?: string
  }
}

export function PortalLayout({ user }: PortalLayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <DomusHeader
        title="Portal do Cliente"
        user={user}
        onMenuClick={() => {}}
        actions={
          <nav className="flex gap-2 hidden md:flex">
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
          </nav>
        }
      />
      <main className="container-domus py-6">
        <Outlet />
      </main>
    </div>
  )
}