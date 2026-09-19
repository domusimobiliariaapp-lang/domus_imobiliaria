import * as React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DomusSidebar } from '@/components/layout/DomusSidebar'
import { DomusHeader } from '@/components/layout/DomusHeader'

interface AdminLayoutProps {
  user?: {
    name: string
    role: string
    avatar?: string
  }
  children: React.ReactNode
}

export function AdminLayout({ user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <DomusSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
      />
      <div className="lg:pl-64">
        <DomusHeader
          title="Domus Admin"
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="container-domus py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}