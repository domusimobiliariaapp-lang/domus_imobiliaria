import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Home, FileText, DollarSign,
  Loader2, Calendar, Building2, CreditCard
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { useDashboardStats } from '@/hooks/useSupabase'
import { useLeases } from '@/hooks/useSupabase'
import { usePayments } from '@/hooks/useSupabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; label: string }
  variant?: 'default' | 'warning'
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={`h-4 w-4 ${variant === 'warning' ? 'text-amber-600' : 'text-primary'}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-serif font-medium">{value}</div>
      {trend && (
        <p className={`text-xs mt-1 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </CardContent>
  </Card>
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
      <div>
        <h1 className="text-3xl font-serif font-medium text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema imobiliário</p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Imóveis na Carteira"
          value={stats?.total_properties || 0}
          icon={Home}
        />
        <StatCard
          title="Imóveis Disponíveis"
          value={stats?.available_properties || 0}
          icon={Building2}
        />
        <StatCard
          title="Contratos Ativos"
          value={stats?.active_leases || 0}
          icon={FileText}
        />
        <StatCard
          title="Vendas Realizadas"
          value={stats?.total_sales || 0}
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatCard
          title="Receita Recebida (Mês)"
          value={formatCurrency(stats?.total_collected || 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Contratos a Vencer (60 dias)"
          value={upcomingContracts.filter(c => c.daysLeft <= 60 && c.daysLeft >= 0).length}
          icon={Calendar}
          variant="warning"
        />
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