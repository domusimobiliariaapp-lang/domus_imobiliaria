import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Home, Search, Heart, Bell, ShoppingBag, User,
  FileText, Mail, Calendar, Music, LayoutGrid, Settings,
  Command, Sparkles
} from 'lucide-react'


export function FloatingNavigationTabs() {
  // Tab Bar 1: Expanding glowing pill
  const [activeTab1, setActiveTab1] = useState<string>('likes')

  // Tab Bar 2: Neumorphic Dock
  const [activeDock, setActiveDock] = useState<string>('home')

  // Tab Bar 3: Dynamic Island Pill
  const [islandExpanded, setIslandExpanded] = useState<boolean>(false)

  const navItems1 = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'likes', label: 'Favoritos', icon: Heart },
    { id: 'notifications', label: 'Avisos', icon: Bell },
    { id: 'bag', label: 'Carteira', icon: ShoppingBag },
    { id: 'profile', label: 'Perfil', icon: User },
  ]

  const dockItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'docs', label: 'Contratos', icon: FileText },
    { id: 'mail', label: 'Mensagens', icon: Mail },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'media', label: 'Mídias', icon: Music },
    { id: 'grid', label: 'Módulos', icon: LayoutGrid },
    { id: 'settings', label: 'Ajustes', icon: Settings },
    { id: 'user', label: 'Usuários', icon: User },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto py-8 space-y-12">
      {/* ================================================================
          1. NAVIGATION TABS V4: EXPANDING GLOWING PILL (Exato como no Print)
          ================================================================ */}
      <div className="space-y-3 text-center">
        <span className="text-xs font-semibold text-[#AD7B3B] uppercase tracking-wider">
          Variação 1 · Expanding Glow Tab Bar
        </span>
        <h4 className="text-sm text-[#6B6375]">
          Clique nos ícones para ver a transição elástica que expande o botão e revela o nome da aba com brilho no tom Domus
        </h4>

        <div className="pt-4 flex justify-center">
          <div className="p-2 rounded-full bg-white border border-[#D4D0C8] shadow-md flex items-center gap-1.5 transition-all">
            {navItems1.map((item) => {
              const Icon = item.icon
              const isActive = activeTab1 === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab1(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2.5 rounded-full text-xs font-semibold transition-all select-none cursor-pointer ${
                    isActive
                      ? 'text-white'
                      : 'text-[#6B6375] hover:text-[#17323D]'
                  }`}
                >
                  {/* Pílula com cor e glow animado via layoutId no tom Ouro Domus (#AD7B3B) */}
                  {isActive && (
                    <motion.div
                      layoutId="activeGlowPill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-[#8C6027] via-[#AD7B3B] to-[#C89551] shadow-md shadow-[#AD7B3B]/30 -z-0"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    />
                  )}

                  <Icon className="w-4 h-4 relative z-10 shrink-0" />

                  {/* Texto expande suavemente apenas na aba ativa */}
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25 }}
                      className="relative z-10 whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ================================================================
          2. NEUMORPHIC FLOATING DOCK (Barra Central do Print)
          ================================================================ */}
      <div className="space-y-3 text-center pt-4">
        <span className="text-xs font-semibold text-[#17323D] uppercase tracking-wider">
          Variação 2 · Neumorphic Soft UI Dock
        </span>
        <h4 className="text-sm text-[#6B6375]">
          Barra flutuante em relevo macio linho com relevo côncavo/convexo individual por botão
        </h4>

        <div className="pt-4 flex justify-center">
          <div className="p-3.5 rounded-full neumorph-card flex items-center gap-3 border border-white/80">
            {dockItems.map((item) => {
              const Icon = item.icon
              const isActive = activeDock === item.id

              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setActiveDock(item.id)}
                  title={item.label}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'neumorph-inset text-[#AD7B3B] font-bold'
                      : 'neumorph-btn text-[#6B6375] hover:text-[#17323D]'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ================================================================
          3. DYNAMIC ISLAND COMMAND PILL (Barra Inferior do Print)
          ================================================================ */}
      <div className="space-y-3 text-center pt-4">
        <span className="text-xs font-semibold text-[#17323D] uppercase tracking-wider">
          Variação 3 · Dynamic Island / Command Pill
        </span>
        <h4 className="text-sm text-[#6B6375]">
          Pílula interativa compacta em Petróleo que se expande para revelar comandos rápidos do sistema
        </h4>

        <div className="pt-4 flex justify-center">
          <motion.div
            layout
            onClick={() => setIslandExpanded(!islandExpanded)}
            className="rounded-full bg-[#17323D] text-white border border-[#AD7B3B]/40 shadow-2xl shadow-[#17323D]/50 cursor-pointer hover:border-[#AD7B3B] transition-colors select-none"

            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {!islandExpanded ? (
              <div className="px-5 py-2.5 flex items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Command className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-white">Domus</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-300">Dashboard</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-amber-300 border border-white/10 uppercase">
                  TAP
                </span>
              </div>
            ) : (
              <div className="p-4 space-y-3 min-w-[280px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">Comandos Rápidos</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Clique para fechar</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="p-2 rounded-lg hover:bg-white/10 flex items-center justify-between text-slate-200 transition-colors">
                    <span>Novo Imóvel na Carteira</span>
                    <span className="text-[10px] text-slate-400 font-mono">⌘ + I</span>
                  </div>
                  <div className="p-2 rounded-lg hover:bg-white/10 flex items-center justify-between text-slate-200 transition-colors">
                    <span>Emitir Boleto de Aluguel</span>
                    <span className="text-[10px] text-slate-400 font-mono">⌘ + B</span>
                  </div>
                  <div className="p-2 rounded-lg hover:bg-white/10 flex items-center justify-between text-slate-200 transition-colors">
                    <span>Nova Vistoria Digital</span>
                    <span className="text-[10px] text-slate-400 font-mono">⌘ + V</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
