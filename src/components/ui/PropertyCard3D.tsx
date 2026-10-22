import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Bed, Bath, Car, Maximize, MapPin, Share2, Edit2, Trash2, Home } from 'lucide-react'
import type { Property } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'

interface PropertyCard3DProps {
  property: Property
  onEdit?: (property: Property) => void
  onDelete?: (property: Property) => void
  onShare?: (property: Property) => void
  isPublic?: boolean
  slug?: string
}

export function PropertyCard3D({
  property,
  onEdit,
  onDelete,
  onShare,
  isPublic = false,
  slug,
}: PropertyCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Coordenadas normalizadas do mouse (-0.5 a 0.5)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Molas suaves para amortecer a inclinação física
  const springConfig = { damping: 22, stiffness: 240 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)

  // Rotações 3D calculadas a partir da posição do mouse
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [10, -10])
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-10, 10])

  // Posição da luz de reflexo dinâmico (glare)
  const glareX = useTransform(smoothMouseX, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(smoothMouseY, [-0.5, 0.5], ['0%', '100%'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  const publicUrl = slug ? `/${slug}/imovel/${property.id}` : `/imovel/${property.id}`
  const coverImage = property.images && property.images.length > 0 ? property.images[0] : null

  return (
    <div className="w-full [perspective:1200px]">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative rounded-3xl bg-white dark:bg-[#12232B] border border-[#D4D0C8] dark:border-[#2D4A51] p-4 sm:p-5 shadow-lg text-[#17323D] dark:text-[#EEECE5] overflow-hidden group select-none transition-shadow duration-300 hover:shadow-2xl hover:shadow-[#17323D]/12"
      >
        {/* Luz de reflexo dinâmico (Dynamic Glare Ouro) */}
        <motion.div
          style={{
            background: `radial-gradient(circle 280px at ${glareX} ${glareY}, rgba(173, 123, 59, 0.16), transparent 70%)`,
          }}
          className="absolute inset-0 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* Imagem do Imóvel com Profundidade 3D */}
        <div
          style={{ transform: 'translateZ(30px)' }}
          className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 shadow-xs bg-[#EEECE5] dark:bg-[#0E1E24]"
        >
          {coverImage ? (
            <img
              src={coverImage}
              alt={property.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
              <Home className="h-10 w-10 mb-1" />
              <span className="text-xs">Foto sob consulta</span>
            </div>
          )}

          {/* Badges Flutuantes em Relevo Máximo */}
          <div
            style={{ transform: 'translateZ(45px)' }}
            className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap"
          >
            <StatusBadge type="property" value={property.status} />
            {property.rent_price > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#17323D]/90 text-white backdrop-blur-md border border-white/20">
                Locação
              </span>
            )}
            {property.sale_price > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-700/90 text-white backdrop-blur-md border border-white/20">
                Venda
              </span>
            )}
          </div>

          {/* Localização e Código em Barra Translúcida */}
          <div
            style={{ transform: 'translateZ(35px)' }}
            className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-[#17323D] bg-white/90 dark:bg-[#12232B]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D4D0C8] dark:border-[#2D4A51] shadow-xs"
          >
            <span className="flex items-center gap-1 font-medium truncate max-w-[70%]">
              <MapPin className="w-3.5 h-3.5 text-[#AD7B3B] shrink-0" />
              <span className="truncate">{property.neighborhood || property.city || 'Imóvel residencial'}</span>
            </span>
            <span className="font-mono text-[10px] text-muted-foreground shrink-0">
              {property.reference_code || `DMS-${property.id.slice(0, 4).toUpperCase()}`}
            </span>
          </div>
        </div>

        {/* Título e Preço */}
        <div style={{ transform: 'translateZ(35px)' }} className="space-y-1.5 mb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold font-serif tracking-tight text-foreground line-clamp-1 group-hover:text-[#AD7B3B] transition-colors">
              {property.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            {property.rent_price > 0 && (
              <span className="text-xl font-bold font-serif text-[#AD7B3B]">
                {formatCurrency(property.rent_price)}
                <span className="text-xs font-sans font-normal text-muted-foreground">/mês</span>
              </span>
            )}
            {property.sale_price > 0 && (
              <span className="text-xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
                {formatCurrency(property.sale_price)}
              </span>
            )}
          </div>
        </div>

        {/* Atributos: Quartos, Banheiros, Vagas, Área */}
        <div
          style={{ transform: 'translateZ(25px)' }}
          className="grid grid-cols-4 gap-1.5 py-2.5 border-y border-[#E0DED6] dark:border-[#2D4A51] text-xs text-muted-foreground text-center mb-3"
        >
          <div className="space-y-0.5">
            <div className="flex items-center justify-center">
              <Bed className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="font-semibold text-foreground text-[11px]">{property.bedrooms || 0} Qts</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center">
              <Bath className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="font-semibold text-foreground text-[11px]">{property.bathrooms || 0} Banh</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center">
              <Car className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="font-semibold text-foreground text-[11px]">{property.parking || 0} Vagas</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center">
              <Maximize className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="font-semibold text-foreground text-[11px]">{property.area_m2 || property.area_util || '—'} m²</div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div style={{ transform: 'translateZ(30px)' }} className="flex items-center justify-between pt-1">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary dark:text-[#AD7B3B] hover:underline flex items-center gap-1"
          >
            Ver página pública →
          </a>

          {!isPublic && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#17323D]/10 text-[#17323D] dark:text-[#EEECE5]"
                  onClick={() => onEdit(property)}
                  title="Editar imóvel"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onShare && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#AD7B3B]/10 text-[#AD7B3B]"
                  onClick={() => onShare(property)}
                  title="Copiar link"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-red-500/10 text-red-600"
                  onClick={() => onDelete(property)}
                  title="Excluir imóvel"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
