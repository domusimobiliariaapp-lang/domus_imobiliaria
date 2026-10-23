import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderKanban,
  Settings,
  LogOut,
  Sun,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Building2,
  Package,
  DollarSign,
  ShoppingCart,
  Calendar,
  Briefcase,
  ClipboardList,
  Filter,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanLimits } from '@/hooks/usePlanLimits';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/solar/dashboard', icon: LayoutDashboard },
  { title: 'Calculadora Solar', href: '/solar/calculator', icon: Calculator },
  { title: 'Funil / CRM', href: '/solar/funnel', icon: Filter },
  { title: 'Orçamentos', href: '/solar/quotes', icon: FileText },
  { title: 'Projetos / Usinas', href: '/solar/projects', icon: FolderKanban },
  { title: 'Vendas & Contratos', href: '/solar/sales', icon: ShoppingCart },
  { title: 'Ordens de Serviço', href: '/solar/service-orders', icon: ClipboardList },
  { title: 'Clientes', href: '/solar/clients', icon: Users },
  { title: 'Agenda de Instalações', href: '/solar/agenda', icon: Calendar },
  { title: 'Estoque & Materiais', href: '/solar/inventory', icon: Package },
  { title: 'Fornecedores', href: '/solar/suppliers', icon: Building2 },
  { title: 'Financeiro Solar', href: '/solar/financial', icon: DollarSign },
  { title: 'Equipe Técnica', href: '/solar/employees', icon: Users },
  { title: 'Minha Área', href: '/solar/my-area', icon: Briefcase },
  { title: 'Configurações', href: '/solar/settings', icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, hasRole, organization } = useAuth();
  const { planName, trialDaysRemaining, status } = usePlanLimits();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || hasRole(item.roles as any)
  );

  return (
    <aside
      className={cn(
        'gradient-impulse flex flex-col h-screen transition-all duration-300 relative sticky top-0 shrink-0 bg-[#0e131f] text-slate-100 border-r border-slate-800 shadow-xl z-30',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        {collapsed ? (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Sun className="h-6 w-6" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 shadow-md shadow-amber-500/10">
              <Sun className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide text-white block">
                {organization?.name || 'DOMUS SOLAR'}
              </span>
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                Gestão Fotovoltaica
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/solar/dashboard' && location.pathname.startsWith(item.href));
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 group text-sm',
                isActive
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'h-4.5 w-4.5 flex-shrink-0 transition-transform group-hover:scale-110',
                  isActive ? 'text-slate-950' : 'text-amber-400'
                )}
              />
              {!collapsed && (
                <span className="truncate">{item.title}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Box de Tipo de Sistema & Licença / Renovação */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-2 rounded-xl bg-slate-800/80 border border-slate-700/70 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Sistema Fotovoltaico
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {status === 'active' ? 'Ativo' : 'Licença'}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-200 truncate">
            {planName || 'Domus Solar Pro'}
          </p>
          {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
            <p className="text-[10px] text-amber-300/90 mt-0.5">
              {trialDaysRemaining} dias restantes de uso
            </p>
          )}
          <button
            onClick={() => navigate('/admin/upgrade')}
            className="w-full mt-2 py-1.5 px-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-[11px] font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Renovar / Meu Plano</span>
          </button>
        </div>
      )}

      {/* User Section */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        {!collapsed && user && (
          <div className="mb-2 px-2">
            <p className="text-xs font-medium text-slate-200 truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
              {user.role}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="h-4 w-4 text-rose-400" />
          {!collapsed && <span>Sair do Sistema</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-amber-500 text-slate-950 p-1 rounded-full shadow-lg hover:scale-110 transition-transform z-40"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
