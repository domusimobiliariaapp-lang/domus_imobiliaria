import type { LucideIcon } from 'lucide-react'
import {
  Bath, Bike, BriefcaseBusiness, Building2, Dumbbell, Flame, Flower2,
  Lightbulb, PartyPopper, PawPrint, ShieldCheck,
  Sparkles, Sun, Sunrise, TreePine, Trophy, WashingMachine, Waves, Zap,
} from 'lucide-react'

export const PROPERTY_FEATURES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'piscina', label: 'Piscina', icon: Waves },
  { value: 'portaria_24h', label: 'Portaria 24h', icon: ShieldCheck },
  { value: 'elevador', label: 'Elevador', icon: Building2 },
  { value: 'churrasqueira', label: 'Churrasqueira', icon: Flame },
  { value: 'academia', label: 'Academia', icon: Dumbbell },
  { value: 'salao_festas', label: 'Salão de festas', icon: PartyPopper },
  { value: 'varanda', label: 'Varanda / sacada', icon: Sun },
  { value: 'closet', label: 'Closet', icon: Sparkles },
  { value: 'escritorio', label: 'Escritório', icon: BriefcaseBusiness },
  { value: 'area_servico', label: 'Área de serviço', icon: WashingMachine },
  { value: 'lavabo', label: 'Lavabo', icon: Bath },
  { value: 'quintal', label: 'Quintal', icon: TreePine },
  { value: 'playground', label: 'Playground', icon: Flower2 },
  { value: 'quadra', label: 'Quadra esportiva', icon: Trophy },
  { value: 'espaco_pet', label: 'Espaço pet', icon: PawPrint },
  { value: 'coworking', label: 'Coworking', icon: Lightbulb },
  { value: 'bicicletario', label: 'Bicicletário', icon: Bike },
  { value: 'gerador', label: 'Gerador', icon: Zap },
  { value: 'sol_manha', label: 'Sol da manhã', icon: Sunrise },
]

export function getPropertyFeature(value: string) {
  return PROPERTY_FEATURES.find(feature => feature.value === value) ?? {
    value,
    label: value.replace(/_/g, ' ').replace(/^./, first => first.toUpperCase()),
    icon: Sparkles,
  }
}
