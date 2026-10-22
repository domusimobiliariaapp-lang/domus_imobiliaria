import { motion } from 'framer-motion'
import { 
  Building2, 
  Sun, 
  HardHat, 
  Stethoscope, 
  Scale, 
  Wallet, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export interface SolutionItem {
  id: string
  title: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description: string
  features: string[]
  color: string
  bgLight: string
  borderColor: string
}

const solutions: SolutionItem[] = [
  {
    id: 'imobiliaria',
    title: 'Imobiliárias & Corretores',
    category: 'Mercado Imobiliário',
    icon: Building2,
    badge: 'Consolidado',
    description: 'Gestão completa de locações, contratos, repasse a proprietários, vistorias fotográficas e CRM.',
    features: [
      'Contratos de locação com régua automática',
      'Fechamento e extrato de repasse financeiro',
      'Vistoria fotográfica com laudo digital em PDF',
      'Radar inteligente que cruza clientes e imóveis',
      'Vitrine pública no seu próprio subdomínio',
    ],
    color: 'text-[#AD7B3B]',
    bgLight: 'bg-[#AD7B3B]/10',
    borderColor: 'border-[#AD7B3B]/30',
  },
  {
    id: 'solar',
    title: 'Energia Solar Fotovoltaica',
    category: 'Integradores & Usinas',
    icon: Sun,
    badge: 'Em Alta',
    description: 'Dimensionamento solar preciso, propostas comerciais com payback e esteira de homologação.',
    features: [
      'Simulador com irradiação solar oficial do Brasil',
      'Cálculo de quantidade de módulos (550W) e inversor',
      'Payback estimado e retorno financeiro em 25 anos',
      'Funil Kanban de homologação e vistoria',
      'Ordens de serviço para instaladores em campo',
    ],
    color: 'text-amber-500',
    bgLight: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 'engenharia',
    title: 'Engenharia Civil & Obras',
    category: 'Construtoras & Empreiteiras',
    icon: HardHat,
    badge: 'Novo',
    description: 'Controle de canteiro, Diário de Obra (RDO), boletins de medição e cronograma físico-financeiro.',
    features: [
      'Diário de Obra (RDO) com fotos e clima',
      'Registro diário de efetivo de operários',
      'Boletins de medição e faturamento por etapa',
      'Acompanhamento de avanço físico em tempo real',
      'Controle de cotações e compras de materiais',
    ],
    color: 'text-orange-500',
    bgLight: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  {
    id: 'clinicas',
    title: 'Clínicas & Consultórios',
    category: 'Saúde & Odontologia',
    icon: Stethoscope,
    badge: 'Disponível',
    description: 'Prontuários eletrônicos, agendamento de consultas sem conflitos e anamnese digital segura.',
    features: [
      'Prontuário clínico digital auditável',
      'Agenda inteligente com confirmação WhatsApp',
      'Orçamentos e planos de tratamento',
      'Fechamento de comissões por profissional',
      'Termos de consentimento e LGPD médica',
    ],
    color: 'text-emerald-500',
    bgLight: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'juridico',
    title: 'Escritórios de Advocacia',
    category: 'Serviços Jurídicos',
    icon: Scale,
    badge: 'Módulo Expansível',
    description: 'Controle de prazos processuais, honorários advocatícios e pastas de clientes organizadas.',
    features: [
      'Gestão de processos por tribunal e cliente',
      'Controle de prazos fatais com alertas',
      'Contratos de honorários e faturamento',
      'Repositório seguro de peças e procurações',
      'Portal do cliente para consulta de andamento',
    ],
    color: 'text-blue-500',
    bgLight: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'financeiro',
    title: 'Gestão Financeira & ERP',
    category: 'PMEs & Holdings',
    icon: Wallet,
    badge: 'Central Unificada',
    description: 'Fluxo de caixa em tempo real, DRE gerencial, conciliação e emissão de cobranças automáticas.',
    features: [
      'Contas a pagar e receber multi-empresa',
      'DRE Gerencial e Fluxo de Caixa projetado',
      'Cobrança automática com PIX, Boleto e Cartão',
      'Divisão por centros de custo e filiais',
      'Relatórios executivos para tomada de decisão',
    ],
    color: 'text-purple-500',
    bgLight: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
]

interface SolutionsCatalogProps {
  onSelectSolution: (solutionName: string) => void
}

export function SolutionsCatalog({ onSelectSolution }: SolutionsCatalogProps) {
  return (
    <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#D4D0C8] dark:border-[#2D4A51]">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#AD7B3B]/10 border border-[#AD7B3B]/30 text-[#AD7B3B] text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Ecossistema Multi-SaaS</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Sistemas especializados para o seu setor.
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Escolha o módulo ideal para a sua profissão ou unifique múltiplos negócios com o mesmo login, 
            mesmo banco de dados e uma fatura centralizada.
          </p>
        </div>

        {/* Grid de Soluções */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
              >
                <Card className="h-full flex flex-col justify-between hover:shadow-xl transition-all duration-300 border bg-card hover:border-[#AD7B3B]/50">
                  <CardContent className="p-6 space-y-5">
                    {/* Topo do Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className={`p-3 rounded-2xl ${item.bgLight} ${item.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {item.badge && (
                        <Badge variant="outline" className={`text-xs ${item.borderColor} ${item.color}`}>
                          {item.badge}
                        </Badge>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="space-y-1.5">
                      <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        {item.category}
                      </span>
                      <h3 className="text-xl font-bold text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Lista de Recursos */}
                    <div className="space-y-2 pt-2 border-t">
                      {item.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-foreground/85">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${item.color}`} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  {/* Rodapé / Ação */}
                  <div className="p-6 pt-0">
                    <Button
                      onClick={() => onSelectSolution(item.title)}
                      className="w-full bg-[#17323D] hover:bg-[#17323D]/90 text-white gap-2 text-xs font-semibold shadow-sm"
                    >
                      <span>Experimentar {item.title.split('&')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Banner de Combo Integrado */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#17323D] to-[#2D4A51] text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#AD7B3B] bg-white/10 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Módulos</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">
              Tem mais de um negócio ou quer uma solução integrada?
            </h3>
            <p className="text-white/80 text-sm max-w-xl">
              Ative múltiplos módulos na mesma empresa (ex: Construtora + Imobiliária + Energia Solar) 
              com condições de contratação sob medida e desconto no pacote.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => onSelectSolution('Combo Integrado Multi-SaaS')}
            className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white font-semibold text-sm px-7 whitespace-nowrap shadow-md cursor-pointer"
          >
            Montar Meu Combo
          </Button>
        </div>
      </div>
    </section>
  )
}
