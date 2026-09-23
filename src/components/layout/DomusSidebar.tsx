import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Link, useLocation } from 'react-router-dom'

interface NavGroup {
  label: string
  items: { href: string; label: string }[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Visão Geral',
    items: [{ href: '/admin/dashboard', label: 'Dashboard' }],
  },
  {
    label: 'Operação',
    items: [
      { href: '/admin/properties', label: 'Imóveis' },
      { href: '/admin/leases', label: 'Locações' },
      { href: '/admin/sales', label: 'Vendas' },
      { href: '/admin/clients', label: 'Clientes' },
      { href: '/admin/contracts', label: 'Contratos' },
      { href: '/admin/renewals', label: 'Renovações' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/admin/financial', label: 'Financeiro' },
      { href: '/admin/legal', label: 'Jurídico' },
      { href: '/admin/administrative', label: 'Administrativo' },
    ],
  },
]

interface DomusSidebarProps {
  isOpen: boolean
  onClose: () => void
  user: { name: string; role: string }
  onLogout: () => void
}

export function DomusSidebar({ isOpen, onClose, user, onLogout }: DomusSidebarProps) {
  const location = useLocation()
  const initials = user.name
    .split(' ')
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      {/* Overlay for mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-[#17323D] text-white transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Menu principal"
      >
        <div className="flex flex-col h-full">
          {/* Brand header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
            <span className="font-serif text-2xl font-medium tracking-tight text-white">
              Domus<span className="text-[#AD7B3B]">.</span>
            </span>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
              onClick={onClose}
              aria-label="Fechar menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6" aria-label="Navegação principal">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                  {group.label}
                </h3>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
                  return (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-3 text-left text-sm font-medium',
                        isActive
                          ? 'text-white bg-white/10 border-l-2 border-[#AD7B3B]'
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      )}
                      onClick={onClose}
                      asChild
                    >
                      <Link to={item.href}>{item.label.trim()}</Link>
                    </Button>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Footer - User info + logout */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#AD7B3B] flex items-center justify-center text-white font-medium text-sm">
                {initials || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name || 'Usuário'}</p>
                <p className="text-xs text-white/60 capitalize">{user.role || 'Equipe'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-white/80 hover:text-white hover:bg-white/5 text-sm"
              onClick={onLogout}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}