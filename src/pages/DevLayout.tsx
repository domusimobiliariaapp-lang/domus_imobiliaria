import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Building2, Users, LifeBuoy, AlertTriangle, ScrollText, LogOut, DollarSign, Sparkles, CreditCard, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/dev', label: 'Imobiliárias', icon: Building2, end: true },
  { to: '/dev/leads', label: 'Leads (Site)', icon: Sparkles, end: false },
  { to: '/dev/planos', label: 'Planos & Preços', icon: DollarSign, end: false },
  { to: '/dev/asaas', label: 'Asaas & Cobrança', icon: CreditCard, end: false },
  { to: '/dev/contato', label: 'Contato & WhatsApp', icon: MessageCircle, end: false },
  { to: '/dev/usuarios', label: 'Contas', icon: Users, end: false },
  { to: '/dev/chamados', label: 'Chamados', icon: LifeBuoy, end: false },
  { to: '/dev/erros', label: 'Erros', icon: AlertTriangle, end: false },
  { to: '/dev/auditoria', label: 'Auditoria', icon: ScrollText, end: false },
]

/** Casca do painel do DEV. Não é multi-tenant: a DEV não pertence a org nenhuma. */
export function DevLayout() {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#EEECE5] dark:bg-background">
      <header className="bg-[#17323D] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl tracking-tight">
              Domus<span className="text-[#AD7B3B]">.</span>
            </h1>
            <p className="text-xs opacity-70">Painel do desenvolvedor</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80 hidden sm:block">
              {profile?.full_name || profile?.email}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>

        <nav className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto" aria-label="Seções do painel">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 cursor-pointer transition-colors active:scale-[0.98]',
                    isActive
                      ? 'border-[#AD7B3B] text-white'
                      : 'border-transparent text-white/60 hover:text-white hover:bg-white/5',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </NavLink>
            )
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
