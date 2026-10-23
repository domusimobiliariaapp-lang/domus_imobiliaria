import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/solar/services/solarSupabaseClient';
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CashFlowData {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
  acumulado: number;
}

export function CashFlowChart() {
  const [data, setData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'3' | '6' | '12'>('6');

  useEffect(() => {
    loadCashFlow();
  }, [period]);

  const loadCashFlow = async () => {
    try {
      const months = parseInt(period);
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(addMonths(new Date(), months - 1));

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('type, status, amount, due_date')
        .gte('due_date', startDate.toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Generate months
      const monthsInterval = eachMonthOfInterval({ start: startDate, end: endDate });
      
      let accumulated = 0;
      const cashFlowData: CashFlowData[] = monthsInterval.map((monthDate) => {
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'MMM/yy', { locale: ptBR });

        const monthTransactions = transactions?.filter((t) => {
          const d = t.due_date || (t as any).date || '';
          return typeof d === 'string' && d.startsWith(monthKey);
        }) || [];

        const receitas = monthTransactions
          .filter((t) => t.type === 'RECEITA')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const despesas = monthTransactions
          .filter((t) => t.type === 'DESPESA')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const saldo = receitas - despesas;
        accumulated += saldo;

        return {
          month: monthLabel,
          receitas,
          despesas,
          saldo,
          acumulado: accumulated,
        };
      });

      setData(cashFlowData);
    } catch (error) {
      console.error('Error loading cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return data.reduce(
      (acc, item) => ({
        receitas: acc.receitas + item.receitas,
        despesas: acc.despesas + item.despesas,
        saldo: acc.saldo + item.saldo,
      }),
      { receitas: 0, despesas: 0, saldo: 0 }
    );
  }, [data]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}:</span>
            <span className="font-medium">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="col-span-full bg-slate-900/60 border-slate-800 shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30">
            <Calendar className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-white">Fluxo de Caixa Projetado</CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Previsão analítica de entradas, saídas e saldo acumulado de usinas
            </p>
          </div>
        </div>
        <Select value={period} onValueChange={(v: '3' | '6' | '12') => setPeriod(v)}>
          <SelectTrigger className="w-32 bg-slate-900 border-slate-800 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            <SelectItem value="3">3 meses</SelectItem>
            <SelectItem value="6">6 meses</SelectItem>
            <SelectItem value="12">12 meses</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 shadow-md">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receitas Previstas</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">{formatCurrency(totals.receitas)}</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 shadow-md">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingDown className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Despesas Previstas</span>
            </div>
            <p className="text-xl font-bold text-rose-400">{formatCurrency(totals.despesas)}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 shadow-md">
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Projetado</span>
            </div>
            <p className={`text-xl font-bold ${totals.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(totals.saldo)}
            </p>
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="h-[320px] flex items-center justify-center">
            <p className="text-slate-400">Carregando projeção financeira...</p>
          </div>
        ) : (
          <div className="h-[320px] w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  stroke="#334155"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  stroke="#334155"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="receitas"
                  name="Receitas"
                  stroke="#10B981"
                  fill="url(#colorReceitas)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  name="Despesas"
                  stroke="#EF4444"
                  fill="url(#colorDespesas)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  name="Saldo Acumulado"
                  stroke="#F59E0B"
                  fill="url(#colorAcumulado)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
