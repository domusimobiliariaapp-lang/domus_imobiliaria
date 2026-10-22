import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Check } from 'lucide-react'

interface AnimatedDeleteButtonProps {
  label?: string
  deletedLabel?: string
  onDelete?: () => void
  disabled?: boolean
  className?: string
}

export function AnimatedDeleteButton({
  label = 'Excluir',
  deletedLabel = 'Excluído!',
  onDelete,
  disabled = false,
  className = '',
}: AnimatedDeleteButtonProps) {
  const [status, setStatus] = useState<'idle' | 'animating' | 'deleted'>('idle')
  const [activeShake, setActiveShake] = useState(false)
  const letters = label.split('')
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Som sintetizado suave e satisfatório usando Web Audio API nativo
  const playDropSound = (frequency: number) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audioCtxRef.current = new AudioCtx()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {
      // Navegadores sem suporte ou áudio bloqueado continuam normalmente
    }
  }

  const handleDeleteClick = async () => {
    if (status !== 'idle' || disabled) return
    setStatus('animating')

    // Dispara a sequência de som e impacto por letra
    letters.forEach((_, idx) => {
      setTimeout(() => {
        playDropSound(320 + idx * 40)
        setActiveShake(true)
        setTimeout(() => setActiveShake(false), 220)
      }, 250 + idx * 110)
    })

    // Aguarda o término da animação de todas as letras
    const totalTime = 300 + letters.length * 110 + 350
    setTimeout(() => {
      setStatus('deleted')
      if (onDelete) onDelete()
    }, totalTime)
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    setStatus('idle')
  }

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={disabled || status === 'animating'}
        className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl px-6 py-3 font-medium transition-all duration-300 select-none ${
          status === 'deleted'
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
            : 'bg-gradient-to-r from-red-500 via-rose-600 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:brightness-105 active:scale-95'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        <AnimatePresence mode="wait">
          {status === 'deleted' ? (
            <motion.div
              key="deleted"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span className="font-semibold tracking-wide">{deletedLabel}</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Lixeira SVG Animada */}
              <div
                className={`relative w-6 h-6 transition-transform ${
                  activeShake ? 'animate-trash-shake' : ''
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  {/* Tampa da lixeira que abre quando animando */}
                  <motion.g
                    animate={
                      status === 'animating'
                        ? { rotate: [-25, -35, -20, 0], y: [-3, -4, -1, 0], originX: 0.2, originY: 0.3 }
                        : { rotate: 0, y: 0 }
                    }
                    transition={{ duration: 0.8, times: [0, 0.4, 0.8, 1] }}
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </motion.g>

                  {/* Corpo da lixeira */}
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M10 11v6" strokeOpacity="0.8" />
                  <path d="M14 11v6" strokeOpacity="0.8" />
                </svg>
              </div>

              {/* Letras que voam uma a uma */}
              <div className="relative flex items-center font-semibold tracking-wide">
                {letters.map((char, index) => {
                  const delay = 0.08 + index * 0.09
                  // Trajetória em parábola para cair dentro da lixeira
                  // O ícone da lixeira fica à esquerda (distância negativa em X)
                  const targetX = -(34 + index * 10)
                  return (
                    <motion.span
                      key={index}
                      className="inline-block"
                      animate={
                        status === 'animating'
                          ? {
                              x: [0, targetX * 0.5, targetX],
                              y: [0, -28, 6],
                              rotate: [0, -35, -120],
                              scale: [1, 1.2, 0.2],
                              opacity: [1, 1, 0],
                            }
                          : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
                      }
                      transition={{
                        duration: 0.45,
                        delay: status === 'animating' ? delay : 0,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      {char}
                    </motion.span>
                  )
                })}
              </div>
            </div>
          )}
        </AnimatePresence>
      </button>

      {/* Botão de reset rápido para o usuário brincar e testar novamente */}
      {status === 'deleted' && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={handleReset}
          className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all cursor-pointer"
          title="Restaurar para testar novamente"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  )
}
