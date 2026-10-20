import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  error: {
    container: 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-100',
    icon: 'text-red-700 dark:text-red-300',
  },
  warning: {
    container: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100',
    icon: 'text-amber-700 dark:text-amber-300',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100',
    icon: 'text-emerald-700 dark:text-emerald-300',
  },
  info: {
    container: 'bg-[#EEECE5] border-[#17323D]/30 text-[#17323D] dark:bg-[#17323D]/20 dark:border-[#17323D]/50 dark:text-[#EEECE5]',
    icon: 'text-[#AD7B3B] dark:text-[#AD7B3B]',
  },
} as const

const ICONS = {
  error: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
}

interface AlertProps {
  variant?: keyof typeof VARIANTS
  title?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Caixa de mensagem embutida no fluxo da página.
 *
 * Fundo e texto são escuros explícitos em cada variante, em vez de depender de
 * token semântico: as mensagens do painel traziam texto branco sobre fundo
 * claro, o que as tornava ilegíveis justamente no momento em que o usuário
 * mais precisa ler.
 */
export function Alert({ variant = 'error', title, children, className }: AlertProps) {
  const { container, icon } = VARIANTS[variant]
  const Icon = ICONS[variant]

  return (
    <div
      className={cn('flex gap-3 p-3 rounded-md border text-sm', container, className)}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'break-words')}>{children}</div>}
      </div>
    </div>
  )
}
