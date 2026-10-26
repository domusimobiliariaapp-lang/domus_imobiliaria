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
    sm: 'w-8 h-8 rounded-lg p-1',
    md: 'w-10 h-10 rounded-xl p-1.5',
    lg: 'w-12 h-12 rounded-2xl p-2',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className={cn('flex items-center gap-3 select-none group', className)}>
      {/* Símbolo Arquitetônico Domus */}
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 bg-gradient-to-br from-[#1B3A47] via-[#10242C] to-[#0A171C] border border-[#AD7B3B]/40 shadow-md group-hover:border-[#AD7B3B]/70 group-hover:shadow-[0_0_20px_rgba(173,123,59,0.3)] transition-all duration-300',
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          {/* Telhado / Frontão clássico — Dourado claro de alto contraste */}
          <polygon
            points="256,72 68,226 68,272 256,118 444,272 444,226"
            fill="#FCE5B0"
          />

          {/* Pilar esquerdo — Dourado arquitetônico */}
          <rect
            x="140"
            y="248"
            width="60"
            height="192"
            rx="6"
            fill="#D4A359"
          />

          {/* Pilar direito — Dourado arquitetônico */}
          <rect
            x="312"
            y="248"
            width="60"
            height="192"
            rx="6"
            fill="#D4A359"
          />

          {/* Arco central (porta em arco clássica) */}
          <path
            d="M200 440 V318 Q200 240 256 240 Q312 240 312 318 V440 Z"
            fill="#E5B869"
          />

          {/* Abertura do arco (profundidade / sombra interior) */}
          <path
            d="M228 440 V326 Q228 272 256 272 Q284 272 284 326 V440 Z"
            fill="#0E2028"
          />

          {/* Ponto de luz no ápice da abóbada */}
          <circle
            cx="256"
            cy="286"
            r="16"
            fill="#FFF8E7"
          />
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
            Gestão Imobiliária &amp; Locações
          </p>
        )}
      </div>
    </div>
  )
}
