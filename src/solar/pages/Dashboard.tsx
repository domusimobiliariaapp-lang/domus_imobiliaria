import { useState, useEffect } from 'react';
import { FolderKanban, FileText, Wrench, Loader2, ChevronRight, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { AppLayout } from '@/solar/components/layout/AppLayout';
import { SmartAlerts } from '@/solar/components/dashboard/SmartAlerts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/solar/services/solarSupabaseClient';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DashboardSummary {
  projects: {
    total: number;
    inProgress: number;
    delayed: number;
  };
  quotes: {
    total: number;
    pending: number;
    approved: number;
  };
  serviceOrders: {
    total: number;
    pending: number;
    overdue: number;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch projects summary
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status, estimated_end_date');

      const projectsInProgress = projects?.filter(p => p.status !== 'POS_VENDA') || [];
      const projectsDelayed = projectsInProgress.filter(p => 
        p.estimated_end_date && p.estimated_end_date < today
      );

      // Fetch quotes summary
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, status');

      const pendingQuotes = quotes?.filter(q => q.status === 'SENT' || q.status === 'DRAFT') || [];
      const approvedQuotes = quotes?.filter(q => q.status === 'APPROVED') || [];

      // Fetch service orders summary
      const { data: serviceOrders } = await supabase
        .from('service_orders')
        .select('id, status, deadline_date');

      const pendingOS = serviceOrders?.filter(os => os.status !== 'CONCLUIDO' && os.status !== 'CANCELADO') || [];
      const overdueOS = pendingOS.filter(os => 
        os.deadline_date && os.deadline_date < today
      );

      setSummary({
        projects: {
          total: projects?.length || 0,
          inProgress: projectsInProgress.length,
          delayed: projectsDelayed.length,
        },
        quotes: {
          total: quotes?.length || 0,
          pending: pendingQuotes.length,
          approved: approvedQuotes.length,
        },
        serviceOrders: {
          total: serviceOrders?.length || 0,
          pending: pendingOS.length,
          overdue: overdueOS.length,
        },
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header com Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Olá, {user?.name?.split(' ')[0] || 'Gestor'} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/solar/calculator"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-semibold text-xs transition-all shadow-sm"
          >
            <FolderKanban className="h-4 w-4" />
            <span>Dimensionar Usina</span>
          </Link>
          <Link
            to="/solar/quotes"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <FileText className="h-4 w-4 stroke-[2.5]" />
            <span>+ Novo Orçamento</span>
          </Link>
        </div>
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Projetos */}
        <Link to="/solar/projects" className="group">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 hover:shadow-xl hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <FolderKanban className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Projetos & Usinas</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Em andamento
                </span>
                <span className="font-semibold text-white">{summary?.projects.inProgress || 0}</span>
              </div>
              {(summary?.projects.delayed || 0) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Atrasados
                  </span>
                  <span className="font-semibold text-rose-400">{summary?.projects.delayed}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Total de Usinas
                </span>
                <span className="font-semibold text-white">{summary?.projects.total || 0}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Orçamentos */}
        <Link to="/solar/quotes" className="group">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 hover:shadow-xl hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <FileText className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Orçamentos</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Pendentes
                </span>
                <span className="font-semibold text-white">{summary?.quotes.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Aprovados
                </span>
                <span className="font-semibold text-emerald-400">{summary?.quotes.approved || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Total Gerado
                </span>
                <span className="font-semibold text-white">{summary?.quotes.total || 0}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Ordens de Serviço */}
        <Link to="/solar/service-orders" className="group">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 hover:shadow-xl hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Wrench className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Ordens de Serviço</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Pendentes
                </span>
                <span className="font-semibold text-white">{summary?.serviceOrders.pending || 0}</span>
              </div>
              {(summary?.serviceOrders.overdue || 0) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Vencidas
                  </span>
                  <span className="font-semibold text-rose-400">{summary?.serviceOrders.overdue}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5" />
                  Total de OS
                </span>
                <span className="font-semibold text-white">{summary?.serviceOrders.total || 0}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Alerts */}
      <SmartAlerts />
    </AppLayout>
  );
}
