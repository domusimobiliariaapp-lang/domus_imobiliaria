import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusType = 'property' | 'lease' | 'payment' | 'document' | 'renewal'

interface StatusBadgeProps {
  type: StatusType
  value: string
  className?: string
}

const STATUS_CONFIG: Record<StatusType, Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'amber' | 'blue' | 'green' | 'red' | 'yellow' | 'gray' }>> = {
  property: {
    disponivel: { label: 'Disponível', variant: 'green' },
    alugado: { label: 'Alugado', variant: 'blue' },
    vendido: { label: 'Vendido', variant: 'amber' },
    reservado: { label: 'Reservado', variant: 'yellow' },
    indisponivel: { label: 'Indisponível', variant: 'red' },
    manutencao: { label: 'Manutenção', variant: 'red' },
  },
  lease: {
    ativo: { label: 'Ativo', variant: 'green' },
    em_negociacao: { label: 'Em Negociação', variant: 'amber' },
    renovado: { label: 'Renovado', variant: 'blue' },
    vencido: { label: 'Vencido', variant: 'red' },
    encerrado: { label: 'Encerrado', variant: 'gray' },
    pendente: { label: 'Pendente', variant: 'yellow' },
    cancelado: { label: 'Cancelado', variant: 'red' },
  },
  payment: {
    pago: { label: 'Pago', variant: 'green' },
    pendente: { label: 'Pendente', variant: 'yellow' },
    atrasado: { label: 'Atrasado', variant: 'red' },
  },
  document: {
    em_andamento: { label: 'Em Andamento', variant: 'yellow' },
    concluido: { label: 'Concluído', variant: 'green' },
    suspenso: { label: 'Suspenso', variant: 'gray' },
  },
  renewal: {
    urgente: { label: 'Urgente', variant: 'red' },
    atencao: { label: 'Atenção', variant: 'amber' },
    normal: { label: 'Normal', variant: 'green' },
  },
}

const VARIANT_CLASSES = {
  default: 'bg-gray-100 text-gray-800',
  secondary: 'bg-gray-100 text-gray-800',
  destructive: 'bg-red-100 text-red-800',
  outline: 'border border-gray-300 text-gray-700',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  gray: 'bg-gray-100 text-gray-600',
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[type]?.[value]
  if (!config) {
    return <Badge variant="outline" className={className}>{value}</Badge>
  }
  return (
    <Badge
      variant="outline"
      className={cn(VARIANT_CLASSES[config.variant], 'capitalize', className)}
    >
      {config.label}
    </Badge>
  )
}