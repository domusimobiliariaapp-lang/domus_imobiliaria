import { cn } from '@/lib/utils'

interface DomusLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showBadge?: boolean
  showTagline?: boolean
  className?: string
}

export function DomusLogo({
  size = 'md',
  showBadge = true,
  showTagline = true,
  className,
}: DomusLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className={cn('flex items-center gap-3 select-none group', className)}>
      {/* Símbolo Arquitetônico Monograma Domus em SVG */}
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 bg-gradient-to-br from-[#17323D] via-[#10242C] to-[#0A171C] border border-[#AD7B3B]/30 shadow-md group-hover:border-[#AD7B3B]/60 group-hover:shadow-[0_0_20px_rgba(173,123,59,0.25)] transition-all duration-300',
          iconSizes[size]
        )}
      >
        {/* Glow interno suave */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-[#AD7B3B]/20 via-transparent to-white/10 pointer-events-none" />

        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5 relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCE5B0" />
              <stop offset="50%" stopColor="#D4A359" />
              <stop offset="100%" stopColor="#966427" />
            </linearGradient>
            <linearGradient id="logoPillar" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCE5B0" />
              <stop offset="100%" stopColor="#AD7B3B" />
            </linearGradient>
          </defs>

          {/* Telhado / Frontão — traço grosso visível */}
          <polyline
            points="20,6 4,19 4,23 20,10 36,23 36,19"
            fill="url(#logoGold)"
            stroke="none"
          />

          {/* Pilar esquerdo */}
          <rect x="8" y="21" width="7" height="13" rx="1.5" fill="url(#logoPillar)" />

          {/* Pilar direito */}
          <rect x="25" y="21" width="7" height="13" rx="1.5" fill="url(#logoPillar)" />

          {/* Arco central preenchido */}
          <path
            d="M15 34 V26 Q15 19 20 19 Q25 19 25 26 V34 Z"
            fill="url(#logoPillar)"
          />
          {/* Abertura do arco (buraco) */}
          <path
            d="M17.5 34 V27 Q17.5 22 20 22 Q22.5 22 22.5 27 V34 Z"
            fill="#0A171C"
          />

          {/* Ponto de luz no vértice do arco */}
          <circle cx="20" cy="22.5" r="2" fill="#FCE5B0" opacity="0.9" />
        </svg>
      </div>

      {/* Tipografia da Marca + Badge de Categoria */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-2 leading-none">
          <span
            className={cn(
              'font-serif font-bold tracking-tight text-[#17323D] dark:text-[#EEECE5] transition-colors',
              textSizes[size]
            )}
          >
            Domus
            <span className="text-[#AD7B3B] font-sans inline-block transition-transform duration-300 group-hover:scale-125">
              .
            </span>
          </span>

          {showBadge && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/25 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#AD7B3B] animate-pulse" />
              <span>SaaS</span>
            </span>
          )}
        </div>

        {showTagline && (
          <p className="hidden sm:block text-[10px] tracking-wide text-muted-foreground font-medium mt-1">
            Gestão Imobiliária & Locações
          </p>
        )}
      </div>
    </div>
  )
}
