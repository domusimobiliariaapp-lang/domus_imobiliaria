import * as React from 'react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Link, useLocation } from 'react-router-dom'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { 
  Sparkles, 
  ArrowUpRight, 
  Building2, 
  SunMedium, 
  HardHat, 
  SlidersHorizontal, 
  LayoutDashboard,
  ChevronDown
} from 'lucide-react'

export type SystemModuleKey = 'imobiliaria' | 'solar' | 'engenharia' | 'odonto'

interface NavItem {
  href: string
  label: string
  onlyAdmin?: boolean
  badge?: string
}

interface NavGroup {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  requiredModule?: SystemModuleKey
  collapsible?: boolean
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    collapsible: false,
    items: [{ href: '/admin/dashboard', label: 'Dashboard Executivo' }],
  },
  {
    id: 'imobiliaria',
    label: 'Imobiliária',
    icon: Building2,
    requiredModule: 'imobiliaria',
    collapsible: true,
    items: [
      { href: '/admin/properties', label: 'Imóveis' },
      { href: '/admin/crm', label: 'CRM & Radar' },
      { href: '/admin/contracts', label: 'Locações' },
      { href: '/admin/sales', label: 'Vendas' },
      { href: '/admin/clients', label: 'Clientes' },
      { href: '/admin/inspections', label: 'Vistorias' },
      { href: '/admin/renewals', label: 'Renovações' },
    ],
  },
  {
    id: 'solar',
    label: 'Energia Solar',
    icon: SunMedium,
    requiredModule: 'solar',
    collapsible: true,
    items: [
      { href: '/admin/solar/orcamentos', label: 'Orçamentos & Simulação' },
      { href: '/admin/solar/projetos', label: 'Projetos & Usinas' },
      { href: '/admin/solar/kits', label: 'Kits & Inversores' },
      { href: '/admin/solar/os', label: 'Ordens de Serviço' },
      { href: '/admin/solar/fornecedores', label: 'Fornecedores' },
    ],
  },
  {
    id: 'engenharia',
    label: 'Engenharia & Obras',
    icon: HardHat,
    requiredModule: 'engenharia',
    collapsible: true,
    items: [
      { href: '/admin/obras/projetos', label: 'Obras & Contratos' },
      { href: '/admin/obras/diario', label: 'Diário de Obra (RDO)' },
      { href: '/admin/obras/medicoes', label: 'Medições' },
      { href: '/admin/obras/cronograma', label: 'Cronograma Físico' },
      { href: '/admin/obras/compras', label: 'Compras & Insumos' },
    ],
  },
  {
    id: 'gestao',
    label: 'Gestão Corporativa',
    icon: SlidersHorizontal,
    collapsible: true,
    items: [
      { href: '/admin/financial', label: 'Financeiro' },
      { href: '/admin/legal', label: 'Jurídico' },
      { href: '/admin/administrative', label: 'Administrativo' },
      { href: '/admin/chamados', label: 'Chamados' },
      { href: '/admin/upgrade', label: 'Plano & Módulos', onlyAdmin: true },
      { href: '/admin/equipe', label: 'Equipe & Acessos', onlyAdmin: true },
    ],
  },
]

interface DomusSidebarProps {
  isOpen: boolean
  onClose: () => void
  user: { name: string; role: string }
  onLogout: () => void
  /** Imobiliária / Empresa do usuário. Sem ela, mostra a marca padrão do Domus. */
  orgName?: string
  /** Módulos ativos contratados pela empresa */
  enabledModules?: string[]
}

export function DomusSidebar({ 
  isOpen, 
  onClose, 
  user, 
  onLogout, 
  orgName,
  enabledModules = ['imobiliaria']
}: DomusSidebarProps) {
  const location = useLocation()
  const planLimits = usePlanLimits()

  // Determina quais módulos da organização estão ativos
  const activeModules = React.useMemo(() => {
    if (!enabledModules || enabledModules.length === 0) return ['imobiliaria']
    return enabledModules
  }, [enabledModules])

  // Guarda estado aberto/fechado de cada submenu
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {
      overview: true,
      imobiliaria: true,
      solar: true,
      engenharia: true,
      gestao: false,
    }
    return initialState
  })

  // Auto-expande o grupo correspondente à rota atual
  useEffect(() => {
    navGroups.forEach((group) => {
      const isRouteInGroup = group.items.some(
        (item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
      )
      if (isRouteInGroup) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }))
      }
    })
  }, [location.pathname])

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const initials = user.name
    .split(' ')
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const percentUsed = planLimits.maxProperties
    ? Math.min(100, Math.round((planLimits.currentPropertiesCount / planLimits.maxProperties) * 100))
    : 0

  // Filtra apenas grupos que a organização possui contratado
  const visibleGroups = navGroups.filter((group) => {
    if (!group.requiredModule) return true
    return activeModules.includes(group.requiredModule)
  })

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
            <span className="font-serif text-2xl font-medium tracking-tight text-white truncate">
              {orgName || 'Domus'}
              {orgName && <span className="text-[#AD7B3B]">.</span>}
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

          {/* Navigation com Submenus Suspensos */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-3" aria-label="Navegação principal">
            {visibleGroups.map((group) => {
              const visibleItems = group.items.filter((i) => !i.onlyAdmin || user.role === 'admin')
              if (visibleItems.length === 0) return null

              const isGroupOpen = openGroups[group.id] ?? false
              const GroupIcon = group.icon
              const hasActiveChild = visibleItems.some(
                (item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              )

              // Item único não-colapsável (ex: Dashboard)
              if (!group.collapsible) {
                return (
                  <div key={group.id} className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = location.pathname === item.href
                      return (
                        <Button
                          key={item.href}
                          variant="ghost"
                          className={cn(
                            'w-full justify-start gap-3 text-left text-sm font-medium rounded-lg px-3 py-2 transition-all',
                            isActive
                              ? 'text-white bg-white/15 border-l-2 border-[#AD7B3B] font-semibold'
                              : 'text-white/80 hover:text-white hover:bg-white/5'
                          )}
                          onClick={onClose}
                          asChild
                        >
                          <Link to={item.href}>
                            <GroupIcon className={cn('h-4 w-4', isActive ? 'text-[#AD7B3B]' : 'text-white/60')} />
                            <span>{item.label}</span>
                          </Link>
                        </Button>
                      )
                    })}
                  </div>
                )
              }

              // Módulo Colapsável com Submenu Suspenso
              return (
                <div key={group.id} className="space-y-1">
                  {/* Cabeçalho do Grupo com Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors',
                      hasActiveChild
                        ? 'text-white bg-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <GroupIcon className={cn('h-3.5 w-3.5', hasActiveChild ? 'text-[#AD7B3B]' : 'text-white/50')} />
                      <span className="truncate">{group.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-white/50 transition-transform duration-200',
                        isGroupOpen ? 'rotate-180 text-white/80' : 'rotate-0'
                      )}
                    />
                  </button>

                  {/* Submenu Suspenso */}
                  {isGroupOpen && (
                    <div className="ml-3 pl-2.5 border-l border-white/10 space-y-0.5 pt-1">
                      {visibleItems.map((item) => {
                        const isActive =
                          location.pathname === item.href || location.pathname.startsWith(item.href + '/')
                        return (
                          <Button
                            key={item.href}
                            variant="ghost"
                            className={cn(
                              'w-full justify-start text-left text-xs font-medium h-8 px-2.5 rounded-md transition-all',
                              isActive
                                ? 'text-white bg-white/15 font-semibold text-[#AD7B3B]'
                                : 'text-white/70 hover:text-white hover:bg-white/5'
                            )}
                            onClick={onClose}
                            asChild
                          >
                            <Link to={item.href}>
                              <span className="truncate">{item.label}</span>
                            </Link>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Card de Plano & Cota de Imóveis */}
          {!planLimits.loading && (
            <div className="mx-3 mb-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-white/90 truncate flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#AD7B3B]" />
                  <span>Plano {planLimits.planName}</span>
                </span>
                {planLimits.status === 'trial' ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#AD7B3B]/30 text-[#AD7B3B] font-medium border border-[#AD7B3B]/40">
                    {planLimits.trialDaysRemaining !== null ? `${planLimits.trialDaysRemaining}d teste` : 'Teste'}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-medium">Ativo</span>
                )}
              </div>

              <div className="space-y-1 mt-2">
                <div className="flex items-center justify-between text-[11px] text-white/60">
                  <span>Carteira</span>
                  <span className="font-mono text-white/80">
                    {planLimits.currentPropertiesCount} / {planLimits.maxProperties ?? '∞'} imóveis
                  </span>
                </div>
                {planLimits.maxProperties !== null && (
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-500 rounded-full',
                        percentUsed >= 90
                          ? 'bg-red-500'
                          : percentUsed >= 75
                          ? 'bg-amber-400'
                          : 'bg-[#AD7B3B]'
                      )}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                )}
              </div>

              {user.role === 'admin' && (
                <Link
                  to="/admin/upgrade"
                  onClick={onClose}
                  className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#AD7B3B] hover:text-[#AD7B3B]/80 font-medium transition-colors"
                >
                  <span>Gerenciar plano</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}

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