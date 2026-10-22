import { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Bed, Bath, Car, Maximize, MapPin, Sparkles, Heart } from 'lucide-react'

export function ParallaxPropertyCard() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isLiked, setIsLiked] = useState(false)

  // Coordenadas normalizadas do mouse (-0.5 a 0.5)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Molas suaves para amortecer a inclinação física
  const springConfig = { damping: 20, stiffness: 260 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)

  // Rotações 3D calculadas a partir da posição do mouse
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [14, -14])
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-14, 14])

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

  return (
    <div className="w-full max-w-md mx-auto py-6 [perspective:1200px]">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative rounded-3xl bg-white border border-[#D4D0C8] p-5 shadow-xl text-[#17323D] overflow-hidden cursor-pointer group select-none transition-shadow duration-300 hover:shadow-2xl hover:shadow-[#17323D]/10"
      >
        {/* Luz de reflexo dinâmico (Dynamic Glare Ouro) que segue o mouse */}
        <motion.div
          style={{
            background: `radial-gradient(circle 280px at ${glareX} ${glareY}, rgba(173, 123, 59, 0.16), transparent 70%)`,
          }}
          className="absolute inset-0 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* Camada 1: Imagem do Imóvel com Profundidade 3D */}
        <div
          style={{ transform: 'translateZ(30px)' }}
          className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 shadow-sm bg-[#EEECE5]"
        >
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
            alt="Mansão Contemporânea"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Badges Flutuantes em Relevo Máximo (translateZ 50px) */}
          <div
            style={{ transform: 'translateZ(50px)' }}
            className="absolute top-3 left-3 flex items-center gap-2"
          >
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#AD7B3B] text-white shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-white" />
              EXCLUSIVO
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#17323D]/90 text-white backdrop-blur-md border border-white/20">
              Venda
            </span>
          </div>

          <button
            type="button"
            style={{ transform: 'translateZ(50px)' }}
            onClick={(e) => {
              e.stopPropagation()
              setIsLiked(!isLiked)
            }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
              isLiked
                ? 'bg-rose-500 text-white'
                : 'bg-white/80 text-[#17323D] hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
          </button>

          <div
            style={{ transform: 'translateZ(40px)' }}
            className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-[#17323D] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D4D0C8] shadow-xs"
          >
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#AD7B3B]" />
              Jardins · São Paulo, SP
            </span>
            <span className="font-mono text-[11px] text-[#6B6375]">Cód. DMS-842</span>
          </div>
        </div>

        {/* Camada 2: Título e Preço com translateZ 40px */}
        <div style={{ transform: 'translateZ(40px)' }} className="space-y-2 mb-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold font-serif tracking-tight text-[#17323D] group-hover:text-[#AD7B3B] transition-colors">
              Mansão Sunset Lumina
            </h3>
            <span className="text-2xl font-extrabold font-serif text-[#AD7B3B]">
              R$ 4.850.000
            </span>
          </div>
          <p className="text-xs text-[#6B6375] line-clamp-1">
            Arquitetura contemporânea com piscina de borda infinita e automação integral.
          </p>
        </div>

        {/* Camada 3: Atributos com translateZ 30px */}
        <div
          style={{ transform: 'translateZ(30px)' }}
          className="grid grid-cols-4 gap-2 py-3 border-y border-[#E0DED6] text-xs text-[#6B6375] text-center mb-4"
        >
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[#6B6375]">
              <Bed className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-[#17323D]">4 Suítes</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[#6B6375]">
              <Bath className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-[#17323D]">6 Banh.</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[#6B6375]">
              <Car className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-[#17323D]">4 Vagas</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[#6B6375]">
              <Maximize className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-[#17323D]">520 m²</div>
          </div>
        </div>

        {/* Camada 4: Botão de Ação com translateZ 50px */}
        <div style={{ transform: 'translateZ(50px)' }}>
          <button
            type="button"
            className="w-full py-3 rounded-xl bg-[#17323D] hover:bg-[#254F5E] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#17323D]/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ver Detalhes do Imóvel</span>
            <Sparkles className="w-3.5 h-3.5 text-[#AD7B3B]" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
