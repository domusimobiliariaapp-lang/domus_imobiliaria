import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, TrendingUp, Sparkles, Building } from 'lucide-react'

export function HeroAnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Canvas de Constelação Dinâmica (Nós e Conexões de Rede Imobiliária)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    // Criação dos nós luminosos
    const nodeCount = 55
    const nodes: Array<{
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      color: string
      alpha: number
    }> = []

    const colors = [
      'rgba(173, 123, 59, ', // Dourado Domus
      'rgba(23, 50, 61, ',   // Azul Petróleo Domus
      'rgba(217, 154, 70, ',  // Âmbar Brilhante
      'rgba(30, 101, 125, ',  // Turquesa Profundo
    ]

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.2 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.35,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Atualiza e desenha conexões entre nós próximos
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i]
        nodeA.x += nodeA.vx
        nodeA.y += nodeA.vy

        // Rebate nas bordas
        if (nodeA.x < 0 || nodeA.x > width) nodeA.vx *= -1
        if (nodeA.y < 0 || nodeA.y > height) nodeA.vy *= -1

        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j]
          const dx = nodeA.x - nodeB.x
          const dy = nodeA.y - nodeB.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.32
            ctx.beginPath()
            ctx.moveTo(nodeA.x, nodeA.y)
            ctx.lineTo(nodeB.x, nodeB.y)
            ctx.strokeStyle = `rgba(173, 123, 59, ${lineAlpha})`
            ctx.lineWidth = 0.9
            ctx.stroke()
          }
        }

        // Desenha o nó circular com glow
        ctx.beginPath()
        ctx.arc(nodeA.x, nodeA.y, nodeA.radius, 0, Math.PI * 2)
        ctx.fillStyle = `${nodeA.color}${nodeA.alpha})`
        ctx.shadowColor = 'rgba(173, 123, 59, 0.6)'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Gradientes de Malha Aurora Fluidos e Visíveis */}
      <motion.div
        animate={{
          x: [-60, 60, -60],
          y: [-40, 50, -40],
          scale: [1, 1.25, 1],
          rotate: [0, 45, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-10 left-1/4 -translate-x-1/2 w-[650px] h-[450px] rounded-[40%] bg-gradient-to-tr from-[#AD7B3B]/40 via-[#F3C068]/30 to-transparent blur-[85px]"
      />

      <motion.div
        animate={{
          x: [60, -60, 60],
          y: [40, -50, 40],
          scale: [1.2, 0.95, 1.2],
          rotate: [0, -40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-20 right-1/4 translate-x-1/2 w-[700px] h-[500px] rounded-[45%] bg-gradient-to-bl from-[#17323D]/40 via-[#1E657D]/30 to-transparent blur-[95px]"
      />

      <motion.div
        animate={{
          scale: [0.9, 1.2, 0.9],
          opacity: [0.4, 0.75, 0.4],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[480px] h-[300px] rounded-full bg-[#E5C378]/35 blur-[70px]"
      />

      {/* 2. Grade Arquitetônica Visível com Efeito Linha Laser / Varredura */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(173, 123, 59, 0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(173, 123, 59, 0.18) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 40%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 40%, black 30%, transparent 80%)',
        }}
      />

      {/* Linha de feixe laser que varre o grid suavemente */}
      <motion.div
        animate={{
          y: ['-10%', '110%'],
          opacity: [0, 0.7, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 2,
        }}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#AD7B3B]/60 to-transparent shadow-[0_0_15px_rgba(173,123,59,0.8)]"
      />

      {/* 3. Canvas Interativo de Rede de Imóveis Conectados */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-85 dark:opacity-70"
      />

      {/* 4. Badges Flutuantes Vivos com Atividades do Sistema (Desktop) */}
      <div className="hidden xl:block">
        {/* Card Flutuante Esquerdo: Boleto e Aluguel Recebido */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{
            opacity: 1,
            x: 0,
            y: [-10, 10, -10],
          }}
          transition={{
            y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: 0.6, delay: 0.3 },
            x: { duration: 0.6, delay: 0.3 },
          }}
          className="absolute top-28 left-8 p-3.5 rounded-2xl bg-white/80 dark:bg-[#17323D]/80 backdrop-blur-md border border-border/70 shadow-xl shadow-black/5 max-w-[240px] text-left space-y-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              <span>Aluguel Liquidado</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">agora</span>
          </div>
          <p className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Ed. Horizon • Apto 72</span>
            <span className="font-mono text-[#AD7B3B]">R$ 4.250</span>
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-0.5 border-t border-border/50">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Taxa retida: R$ 425 (10%)</span>
          </div>
        </motion.div>

        {/* Card Flutuante Direito: Repasse Automático via PIX */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{
            opacity: 1,
            x: 0,
            y: [12, -10, 12],
          }}
          transition={{
            y: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 },
            opacity: { duration: 0.6, delay: 0.5 },
            x: { duration: 0.6, delay: 0.5 },
          }}
          className="absolute top-36 right-8 p-3.5 rounded-2xl bg-white/80 dark:bg-[#17323D]/80 backdrop-blur-md border border-border/70 shadow-xl shadow-black/5 max-w-[240px] text-left space-y-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#AD7B3B] bg-[#AD7B3B]/10 px-2 py-0.5 rounded-full border border-[#AD7B3B]/20">
              <Sparkles className="w-3 h-3 text-[#AD7B3B]" />
              <span>Repasse ao Proprietário</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">PIX enviado</span>
          </div>
          <p className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Dr. Arnaldo Silveira</span>
            <span className="font-mono text-emerald-600 font-bold">R$ 3.825</span>
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-0.5 border-t border-border/50">
            <Building className="w-3 h-3 text-[#17323D] dark:text-[#EEECE5]" />
            <span>Comprovante enviado no WhatsApp</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
