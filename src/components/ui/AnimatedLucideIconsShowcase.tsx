import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, Home, Key, CreditCard, Heart, Trash2, Zap, Shield,
  Sparkles, RotateCcw
} from 'lucide-react'


export function AnimatedLucideIconsShowcase() {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const [triggerAll, setTriggerAll] = useState(false)

  const handleAnimateAll = () => {
    setTriggerAll(true)
    setTimeout(() => setTriggerAll(false), 1200)
  }

  const iconsList = [
    {
      id: 'bell',
      name: 'Sino de Notificações',
      desc: 'Balança como um sino real com amortecimento',
      render: (isHovered: boolean) => (
        <motion.div
          animate={
            isHovered || triggerAll
              ? {
                  rotate: [0, -22, 22, -14, 14, -6, 6, 0],
                  originX: '50%',
                  originY: '15%',
                }
              : { rotate: 0 }
          }
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <Bell className="w-8 h-8 text-amber-400" />
        </motion.div>
      ),
    },
    {
      id: 'heart',
      name: 'Favoritos / Likes',
      desc: 'Batimento cardíaco duplo realista',
      render: (isHovered: boolean) => (
        <motion.div
          animate={
            isHovered || triggerAll
              ? {
                  scale: [1, 1.35, 0.95, 1.25, 1],
                }
              : { scale: 1 }
          }
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Heart className={`w-8 h-8 text-rose-500 ${isHovered || triggerAll ? 'fill-rose-500' : ''}`} />
        </motion.div>
      ),
    },
    {
      id: 'key',
      name: 'Chave de Contratos',
      desc: 'Gira 45° destravando o cadeado da locação',
      render: (isHovered: boolean) => (
        <motion.div
          animate={
            isHovered || triggerAll
              ? {
                  rotate: [0, -35, 15, 0],
                  x: [0, 4, -2, 0],
                }
              : { rotate: 0, x: 0 }
          }
          transition={{ duration: 0.6 }}
        >
          <Key className="w-8 h-8 text-amber-500" />
        </motion.div>
      ),
    },
    {
      id: 'home',
      name: 'Imóvel / Carteira',
      desc: 'Pulinho elástico com expansão da base',
      render: (isHovered: boolean) => (
        <motion.div
          animate={
            isHovered || triggerAll
              ? {
                  y: [0, -8, 2, -3, 0],
                  scaleY: [1, 1.1, 0.92, 1.04, 1],
                }
              : { y: 0, scaleY: 1 }
          }
          transition={{ duration: 0.65 }}
        >
          <Home className="w-8 h-8 text-blue-400" />
        </motion.div>
      ),
    },
    {
      id: 'credit-card',
      name: 'Cartão de Pagamentos',
      desc: 'Inclinação e onda de brilho de aproximação',
      render: (isHovered: boolean) => (
        <motion.div
          animate={
            isHovered || triggerAll
              ? {
                  rotateY: [0, 35, -20, 0],
                  rotateZ: [0, -5, 5, 0],
                  scale: [1, 1.15, 1],
                }
              : { rotateY: 0, scale: 1 }
          }
          transition={{ duration: 0.7 }}
        >
          <CreditCard className="w-8 h-8 text-purple-400" />
        </motion.div>
      ),
    },
    {
      id: 'trash',
      name: 'Lixeira de Exclusão',
      desc: 'Abre a tampa para descarte imediato',
      render: (isHovered: boolean) => (
        <div className="relative">
          <motion.div
            animate={
              isHovered || triggerAll
                ? { rotate: [-10, -30, 0], y: [-1, -4, 0] }
                : { rotate: 0, y: 0 }
            }
            transition={{ duration: 0.4 }}
            className="origin-left"
          >
            <Trash2 className="w-8 h-8 text-red-400" />
          </motion.div>
        </div>
      ),
    },
    {
      id: 'zap',
      name: 'Energia Solar & Kits',
      desc: 'Faísca com pulso eletrizante',
      render: (isHovered: boolean) => (
        <motion.div
          animate={
            isHovered || triggerAll
              ? {
                  scale: [1, 1.3, 0.9, 1.2, 1],
                  filter: ['drop-shadow(0 0 0px #eab308)', 'drop-shadow(0 0 10px #eab308)', 'drop-shadow(0 0 0px #eab308)'],
                }
              : { scale: 1 }
          }
          transition={{ duration: 0.5 }}
        >
          <Zap className={`w-8 h-8 text-amber-300 ${isHovered || triggerAll ? 'fill-amber-300' : ''}`} />
        </motion.div>
      ),
    },
    {
      id: 'shield',
      name: 'Segurança & Jurídico',
      desc: 'Expansão de campo de força defensivo',
      render: (isHovered: boolean) => (
        <motion.div
          animate={
            isHovered || triggerAll
              ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0],
                }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.5 }}
        >
          <Shield className="w-8 h-8 text-emerald-400" />
        </motion.div>
      ),
    },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto py-6 space-y-8">
      {/* Barra de controle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#D4D0C8] shadow-sm">
        <div>
          <h4 className="text-sm font-bold font-serif text-[#17323D] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#AD7B3B]" />
            Ícones Lucide com Micro-reações Táteis
          </h4>
          <p className="text-xs text-[#6B6375]">
            Passe o mouse por cima de cada ícone para ver sua reação física individual no padrão Domus.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAnimateAll}
          className="px-4 py-2 rounded-xl bg-[#17323D] hover:bg-[#254F5E] text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-[#AD7B3B]" />
          <span>Animar Todos Juntos</span>
        </button>
      </div>

      {/* Grid de Ícones */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {iconsList.map((item) => {
          const isHovered = hoveredIcon === item.id

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              onMouseEnter={() => setHoveredIcon(item.id)}
              onMouseLeave={() => setHoveredIcon(null)}
              className="p-5 rounded-2xl bg-white hover:bg-[#F7F5F0]/60 border border-[#D4D0C8] hover:border-[#AD7B3B]/40 shadow-sm flex flex-col items-center text-center justify-between space-y-3 cursor-pointer select-none transition-all group"
            >
              {/* O Ícone Animado */}
              <div className="w-16 h-16 rounded-2xl bg-[#F7F5F0] border border-[#E0DED6] flex items-center justify-center group-hover:border-[#AD7B3B]/30 transition-colors shadow-2xs">
                {item.render(isHovered)}
              </div>

              <div>
                <h5 className="text-xs font-bold font-serif text-[#17323D] group-hover:text-[#AD7B3B] transition-colors">
                  {item.name}
                </h5>
                <p className="text-[10px] text-[#6B6375] mt-0.5 leading-tight">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
