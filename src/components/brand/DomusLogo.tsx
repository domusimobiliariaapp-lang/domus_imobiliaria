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
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          {/* Definição de gradientes metálicos em ouro líquido */}
          <defs>
            <linearGradient id="domusGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D78F" />
              <stop offset="45%" stopColor="#D4A359" />
              <stop offset="100%" stopColor="#966427" />
            </linearGradient>
            <linearGradient id="domusPillar" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF2D6" />
              <stop offset="50%" stopColor="#AD7B3B" />
              <stop offset="100%" stopColor="#5E3E14" />
            </linearGradient>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#AD7B3B" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Prisma do Telhado / Pórtico Arquitetônico */}
          <path
            d="M16 4.5L5 13.5V17L16 8L27 17V13.5L16 4.5Z"
            fill="url(#domusGold)"
            filter="url(#goldGlow)"
          />

          {/* Arco / Abóbada Central do "Domus" com perspectiva moderna */}
          <path
            d="M11 15V26.5H14.5V18.5C14.5 17.6716 15.1716 17 16 17C16.8284 17 17.5 17.6716 17.5 18.5V26.5H21V15C21 12.2386 18.7614 10 16 10C13.2386 10 11 12.2386 11 15Z"
            fill="url(#domusPillar)"
          />

          {/* Base estrutural com ponto de ancoragem */}
          <circle cx="16" cy="22.5" r="1.3" fill="#FFF2D6" />
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/25 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#AD7B3B] animate-pulse" />
              <span>SaaS</span>
            </span>
          )}
        </div>

        {showTagline && (
          <p className="text-[10px] tracking-wide text-muted-foreground font-medium mt-1">
            Gestão Imobiliária & Locações
          </p>
        )}
      </div>
    </div>
  )
}
