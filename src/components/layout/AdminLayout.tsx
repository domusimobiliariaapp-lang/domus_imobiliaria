import * as React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LifeBuoy, Building2, Landmark, HardHat, Sun, LayoutGrid } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { DomusSidebar } from '@/components/layout/DomusSidebar'
import { TrialBanner } from '@/components/layout/TrialBanner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [darkMode, setDarkMode] = React.useState(false)
  const { signOut, user, profile, organization } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const userName = profile?.full_name || 'Usuário'
  const userRole = profile?.role || 'equipe'

  // Módulos específicos atribuídos diretamente a este login têm precedência sobre os da organização
  let localOverride: string[] | null = null
  try {
    if (user?.id) {
      const cached = localStorage.getItem(`domus_override_user_modules_${user.id}`)
      if (cached !== null) localOverride = JSON.parse(cached)
    }
  } catch {}

  const userModules = localOverride ?? (
    (profile?.enabled_modules && profile.enabled_modules.length > 0)
      ? profile.enabled_modules
      : (user?.app_metadata?.modules as string[] | undefined)
  )

  const effectiveModules = (userModules && userModules.length > 0)
    ? userModules
    : organization?.enabled_modules

  return (
    <div className="min-h-screen bg-background">
      <DomusSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={{ name: userName, role: userRole }}
        orgName={organization?.name}
        enabledModules={effectiveModules}
        onLogout={handleLogout}
      />
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container-domus">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menu"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                </Button>

                {/* Seletor Unificado de Sistemas Independentes */}
                <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
                  <div className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-muted-foreground uppercase border-r border-border/60 mr-0.5">
                    <LayoutGrid className="h-3 w-3 text-[#C5A880]" />
                    <span className="hidden lg:inline">Sistemas</span>
                  </div>

                  <Link
                    to="/admin/dashboard"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      !location.pathname.startsWith('/admin/solar') && !location.pathname.startsWith('/admin/obras')
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Módulo Imobiliária & Locações"
                  >
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span>Imobiliária</span>
                  </Link>

                  <Link
                    to="/financeiro/app"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all"
                    title="Módulo Independente Domus Finanças ERP"
                  >
                    <Landmark className="h-3.5 w-3.5 text-[#C5A880]" />
                    <span>Finanças ERP</span>
                  </Link>

                  <Link
                    to="/admin/obras/projetos"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      location.pathname.startsWith('/admin/obras')
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Módulo Independente Engenharia & Obras"
                  >
                    <HardHat className="h-3.5 w-3.5 text-amber-600" />
                    <span>Obras</span>
                  </Link>

                  <Link
                    to="/admin/solar/orcamentos"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      location.pathname.startsWith('/admin/solar')
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Módulo Independente Energia Solar"
                  >
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Solar</span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="Abrir chamado com o suporte"
                  title="Abrir chamado com o suporte"
                >
                  <Link to="/admin/chamados">
                    <LifeBuoy className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
                >
                  {darkMode ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </Button>
                <Separator orientation="vertical" className="h-6 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{userName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <TrialBanner />

        <main className="container-domus py-6">{children}</main>
      </div>
    </div>
  )
}