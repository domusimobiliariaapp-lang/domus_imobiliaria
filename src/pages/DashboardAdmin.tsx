import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Home, FileText, DollarSign,
  Loader2, Calendar, Building2, CreditCard,
  Zap, TrendingUp
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { useDashboardStats } from '@/hooks/useSupabase'
import { useLeases } from '@/hooks/useSupabase'
import { usePayments } from '@/hooks/useSupabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { NumberTicker } from '@/components/ui/NumberTicker'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

const StatCard = ({
  title,
  numericValue,
  prefix = '',
  suffix = '',
  decimals = 0,
  fallbackValue,
  icon: Icon,
  trend,
  variant = 'default',
  highlight = false,
}: {
  title: string
  numericValue?: number
  prefix?: string
  suffix?: string
  decimals?: number
  fallbackValue?: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; label: string }
  variant?: 'default' | 'warning'
  highlight?: boolean
}) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ duration: 0.2 }}
    className="h-full"
  >
    <Card className={`h-full relative overflow-hidden transition-all duration-300 ${
      highlight
        ? 'border-[#AD7B3B] bg-gradient-to-br from-card via-card to-[#AD7B3B]/5 shadow-md ring-1 ring-[#AD7B3B]/30'
        : 'hover:border-primary/40'
    }`}>
      {highlight && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#AD7B3B]/10 rounded-full blur-xl pointer-events-none" />
      )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          highlight
            ? 'bg-[#AD7B3B]/15 text-[#AD7B3B]'
            : variant === 'warning'
            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
            : 'bg-primary/10 text-primary'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-serif font-bold ${highlight ? 'text-[#AD7B3B]' : 'text-foreground'}`}>
          {typeof numericValue === 'number' ? (
            <NumberTicker
              value={numericValue}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
            />
          ) : (
            fallbackValue ?? '-'
          )}
        </div>
        {trend && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendingUp className="w-3 h-3" />
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  </motion.div>
)


const ChartCard = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-64">{children}</div>
    </CardContent>
  </Card>
)

const RevenueExpenseChart = ({ data }: { data: Array<{ month: string; receitas: number; despesas: number }> }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E0DED6" />
      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B6375" />
      <YAxis tick={{ fontSize: 12 }} stroke="#6B6375" tickFormatter={formatCurrency} />
      <Tooltip
        contentStyle={{ backgroundColor: '#FFF', border: '1px solid #D4D0C8', borderRadius: '6px' }}
      />
      <Legend />
      <Bar dataKey="receitas" fill="#17323D" name="Receitas" radius={[4, 4, 0, 0]} />
      <Bar dataKey="despesas" fill="#AD7B3B" name="Despesas" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
)

const PropertyStatusPie = ({ data }: { data: Array<{ name: string; value: number; fill: string }> }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={2}
        dataKey="value"
        nameKey="name"
        label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
        labelLine={false}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.fill} />
        ))}
      </Pie>
      <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #D4D0C8', borderRadius: '6px' }} />
    </PieChart>
  </ResponsiveContainer>
)

const UpcomingItem = ({
  title,
  subtitle,
  date,
  daysLeft,
  variant = 'default',
  icon: Icon
}: {
  title: string
  subtitle: string
  date: string
  daysLeft: number
  variant?: 'default' | 'warning' | 'danger'
  icon: React.ComponentType<{ className?: string }>
}) => (
  <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${variant === 'danger' ? 'bg-red-100 text-red-600' : variant === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{title}</p>
      <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
    </div>
    <div className="text-right">
      <p className="text-xs text-muted-foreground">{format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}</p>
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        variant === 'danger' ? 'bg-red-100 text-red-700' :
        variant === 'warning' ? 'bg-amber-100 text-amber-700' :
        'bg-green-100 text-green-700'
      }`}>
        {daysLeft < 0 ? `${Math.abs(daysLeft)} dias atrasado` : `${daysLeft} dias`}
      </span>
    </div>
  </div>
)

export function DashboardAdmin() {
  const { data: stats, loading: statsLoading, error: statsError } = useDashboardStats()
  const { data: leases, loading: leasesLoading } = useLeases()
  const { data: payments, loading: paymentsLoading } = usePayments()

  const loading = statsLoading || leasesLoading || paymentsLoading

  // Prepare chart data - last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return format(d, 'MMM/yyyy', { locale: ptBR })
  })

  const chartData = last6Months.map((month, i) => {
    const monthStart = new Date()
    monthStart.setMonth(monthStart.getMonth() - (5 - i))
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)

    const monthPayments = payments?.filter(p => {
      const d = new Date(p.paid_date || p.due_date)
      return d >= monthStart && d < monthEnd
    }) || []

    const receitas = monthPayments
      .filter(p => p.status === 'pago')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const despesas = 0 // TODO: buscar despesas quando implementado

    return { month, receitas, despesas }
  })

  // Property status distribution
  const statusData = [
    { name: 'Disponíveis', value: stats?.available_properties || 0, fill: '#17323D' },
    { name: 'Alugados', value: stats?.rented_properties || 0, fill: '#2D4A51' },
    { name: 'Vendidos', value: stats?.sold_properties || 0, fill: '#AD7B3B' },
    { name: 'Reservados', value: 0, fill: '#E0DED6' },
  ].filter(d => d.value > 0)

  // Upcoming contract expirations (5 closest)
  const upcomingContracts = leases
    ?.filter(l => l.status === 'ativo' && l.end_date)
    .map(l => {
      const end = new Date(l.end_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const diffTime = end.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return { ...l, daysLeft: diffDays }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5) || []

  // Upcoming payments (5 closest unpaid)
  const upcomingPayments = payments
    ?.filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .map(p => {
      const due = new Date(p.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const diffTime = due.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return { ...p, daysLeft: diffDays }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5) || []

  if (statsError) {
    return (
      <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
        Erro ao carregar estatísticas: {statsError.message}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema imobiliário</p>
        </div>
      </div>

      {/* Checklist de Primeiros Passos (Onboarding Interativo) */}
      <OnboardingChecklist
        totalProperties={stats?.total_properties || 0}
        totalLeases={stats?.active_leases || 0}
      />

      {/* Stats Row com NumberTicker vivo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Imóveis na Carteira"
          numericValue={stats?.total_properties || 0}
          suffix=" imóveis"
          icon={Home}
        />
        <StatCard
          title="Imóveis Disponíveis"
          numericValue={stats?.available_properties || 0}
          suffix=" livres"
          icon={Building2}
        />
        <StatCard
          title="Contratos Ativos"
          numericValue={stats?.active_leases || 0}
          suffix=" contratos"
          icon={FileText}
        />
        <StatCard
          title="Vendas Realizadas"
          numericValue={stats?.total_sales || 0}
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatCard
          title="Receita Recebida no Mês"
          numericValue={Number(stats?.total_collected || 0)}
          prefix="R$ "
          decimals={2}
          highlight={true}
          icon={DollarSign}
          trend={{ value: 12.4, label: 'vs mês anterior' }}
        />
        <StatCard
          title="Contratos a Vencer (60 dias)"
          numericValue={upcomingContracts.filter(c => c.daysLeft <= 60 && c.daysLeft >= 0).length}
          suffix=" contratos"
          icon={Calendar}
          variant="warning"
        />
      </div>

      {/* PAINEL OPERACIONAL DE GARGALOS E AÇÕES RÁPIDAS (TOCANDO NA DOR DA ROTINA) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#17323D] via-[#1A3845] to-[#17323D] text-white shadow-lg border border-[#2D4A51] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#AD7B3B]/20 text-[#AD7B3B] border border-[#AD7B3B]/30">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-base font-serif font-bold text-white">
              Painel de Resolução Rápida de Gargalos
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
              Automações Ativas
            </span>
          </div>
          <p className="text-xs text-white/70 max-w-2xl">
            {upcomingPayments.length > 0
              ? `Você tem ${upcomingPayments.length} pagamentos pendentes e ${upcomingContracts.length} contratos próximos da data de renovação.`
              : 'Nenhuma pendência crítica no momento. Régua de cobrança automática e conciliação monitorando a carteira.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/financial"
            className="px-3.5 py-2 rounded-xl bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Gerar Lote de Repasse</span>
          </Link>
          <Link
            to="/admin/leases"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/15 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ver Contratos</span>
          </Link>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Receitas vs Despesas (Últimos 6 meses)">
          <RevenueExpenseChart data={chartData} />
        </ChartCard>
        <ChartCard title="Distribuição de Imóveis por Status">
          <PropertyStatusPie data={statusData} />
        </ChartCard>
      </div>

      {/* Bottom Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximos Vencimentos de Contratos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {upcomingContracts.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  Nenhum contrato ativo com data de término
                </div>
              ) : (
                upcomingContracts.map((contract) => (
                  <UpcomingItem
                    key={contract.id}
                    title={`Contrato ${contract.id.slice(0, 8)}`}
                    subtitle={`Imóvel: ${contract.property_id?.slice(0, 8)} | Locatário: ${contract.tenant_id?.slice(0, 8)}`}
                    date={contract.end_date!}
                    daysLeft={contract.daysLeft}
                    variant={contract.daysLeft < 0 ? 'danger' : contract.daysLeft <= 30 ? 'warning' : 'default'}
                    icon={FileText}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Pendências Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {upcomingPayments.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  Nenhuma pendência financeira
                </div>
              ) : (
                upcomingPayments.map((payment) => (
                  <UpcomingItem
                    key={payment.id}
                    title={`Pagamento ${payment.id.slice(0, 8)}`}
                    subtitle={`Contrato: ${payment.lease_id?.slice(0, 8)} | Valor: ${formatCurrency(Number(payment.amount))}`}
                    date={payment.due_date}
                    daysLeft={payment.daysLeft}
                    variant={payment.daysLeft < 0 ? 'danger' : payment.daysLeft <= 7 ? 'warning' : 'default'}
                    icon={DollarSign}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}