import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileSignature,
  Users2,
  Receipt,
  Globe2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Search,
  ExternalLink
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'

interface LiveScreenShowcaseProps {
  onOpenTrial: () => void
}

const revenueData = [
  { mes: 'Nov', faturamento: 124000, repasse: 111600 },
  { mes: 'Dez', faturamento: 131500, repasse: 118350 },
  { mes: 'Jan', faturamento: 138000, repasse: 124200 },
  { mes: 'Fev', faturamento: 142200, repasse: 127980 },
  { mes: 'Mar', faturamento: 145800, repasse: 131220 },
  { mes: 'Abr', faturamento: 148520, repasse: 133668 },
]

export function LiveScreenShowcase({ onOpenTrial }: LiveScreenShowcaseProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts' | 'crm' | 'financial' | 'portal' | 'subdomain'>('dashboard')

  const tabs = [
    { id: 'dashboard', label: 'Dashboard de Locações', icon: LayoutDashboard },
    { id: 'contracts', label: 'Contratos & Vencimentos', icon: FileSignature },
    { id: 'crm', label: 'Funil de Atendimento', icon: Users2 },
    { id: 'financial', label: 'Cobrança & Repasses', icon: Receipt },
    { id: 'portal', label: 'Área do Inquilino/Dono', icon: UserCheck },
    { id: 'subdomain', label: 'Vitrine no seu Link', icon: Globe2 },
  ] as const

  return (
    <div className="w-full">
      {/* Seletor de Telas com animação do layoutId */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 gap-2 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-[#EEECE5]'
                  : 'text-muted-foreground hover:text-foreground bg-card/60 hover:bg-card border border-border'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-showcase-tab"
                  className="absolute inset-0 bg-[#17323D] rounded-xl shadow-md border border-[#AD7B3B]/40"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-[#AD7B3B]' : 'text-muted-foreground'}`} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Moldura de Janela de Navegador */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mt-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Barra superior de navegador */}
        <div className="bg-[#EEECE5]/90 dark:bg-[#12232B] px-4 py-3 border-b border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#E06C75]/80" />
              <div className="w-3 h-3 rounded-full bg-[#E5C07B]/80" />
              <div className="w-3 h-3 rounded-full bg-[#98C379]/80" />
            </div>
            <span className="hidden sm:inline-block text-muted-foreground font-mono text-[11px] ml-2">
              Domus Imobiliária • Painel Operacional
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-background/80 border border-border text-[11px] font-mono text-muted-foreground max-w-[280px] sm:max-w-md truncate">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">https://</span>
            <span className="text-foreground font-medium">
              {activeTab === 'subdomain'
                ? 'aurora.domus.com.br/imoveis'
                : activeTab === 'portal'
                ? 'aurora.domus.com.br/portal'
                : 'app.domus.com.br/admin/' + (activeTab === 'dashboard' ? 'dashboard' : activeTab === 'contracts' ? 'contracts' : activeTab === 'crm' ? 'crm' : 'financial')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ao vivo
            </span>
          </div>
        </div>

        {/* Conteúdo com AnimatePresence para transição suave entre abas */}
        <div className="p-4 sm:p-6 bg-background/40 min-h-[470px]">
          <AnimatePresence mode="wait">
            {/* TELA 1: DASHBOARD DE LOCAÇÕES */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                      Carteira de Locação em Abril/2026
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Contratos vigentes, faturamento do mês e repasses previstos para os proprietários.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-medium">
                      Repasses de Abril Fechados
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Aluguel Bruto Recebido</span>
                      <DollarSign className="w-4 h-4 text-[#AD7B3B]" />
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5] mt-2">
                      R$ 148.520
                    </div>
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" /> +8,4% no trimestre
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Contratos Ativos</span>
                      <Building2 className="w-4 h-4 text-[#17323D] dark:text-[#AD7B3B]" />
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5] mt-2">
                      142 imóveis
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      2 imóveis vagos para anúncio
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Taxa de Administração</span>
                      <Receipt className="w-4 h-4 text-[#AD7B3B]" />
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#AD7B3B] mt-2">
                      R$ 14.852
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Receita líquida da imobiliária
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Inadimplência</span>
                      <AlertCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-600 mt-2">
                      1,4%
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      2 boletos vencidos em cobrança
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 p-4 rounded-xl bg-card border border-border shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-foreground">
                        Volume de Aluguéis vs Repasses (últimos 6 meses)
                      </h4>
                      <span className="text-[11px] text-muted-foreground">Em milhares (R$)</span>
                    </div>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                            contentStyle={{ backgroundColor: '#17323D', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                          />
                          <Bar dataKey="faturamento" fill="#17323D" name="Aluguel Recebido" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="repasse" fill="#AD7B3B" name="Repasse aos Proprietários" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3">
                        Reajustes de Aniversário (Próximos 30 dias)
                      </h4>
                      <div className="space-y-2.5">
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                          <div className="flex justify-between font-medium">
                            <span>Apto 402 - Ed. Jardins</span>
                            <span className="text-[#AD7B3B]">Dia 10/05</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Locatário: Roberto Guimarães</p>
                          <p className="text-[11px] text-emerald-600 mt-1 font-mono">IPCA acumulado: +4,18%</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                          <div className="flex justify-between font-medium">
                            <span>Casa 18 - Cond. Pinheiros</span>
                            <span className="text-[#AD7B3B]">Dia 22/05</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Locatária: Mariana Esteves</p>
                          <p className="text-[11px] text-emerald-600 mt-1 font-mono">IGP-M acumulado: +3,75%</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onOpenTrial}
                      className="w-full mt-3 py-2 text-xs font-medium rounded-lg bg-[#17323D] hover:bg-[#17323D]/90 text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Aplicar reajuste com 1 clique</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TELA 2: CONTRATOS & VENCIMENTOS */}
            {activeTab === 'contracts' && (
              <motion.div
                key="contracts"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                      Contratos de Locação em Andamento
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Controle de caução, seguro fiança, fiador e datas de renovação.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg border border-input bg-card text-xs flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Buscar por endereço ou nome...</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 text-muted-foreground font-medium border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Imóvel</th>
                        <th className="py-3 px-4">Locatário</th>
                        <th className="py-3 px-4">Proprietário</th>
                        <th className="py-3 px-4">Aluguel</th>
                        <th className="py-3 px-4">Garantia</th>
                        <th className="py-3 px-4">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium text-foreground">
                          Apto 1102 - Ed. Metropolitan
                          <span className="block text-[10px] text-muted-foreground font-normal">Rua Oscar Freire, 1200</span>
                        </td>
                        <td className="py-3 px-4">Lucas Silveira Castro</td>
                        <td className="py-3 px-4">Beatriz Albuquerque</td>
                        <td className="py-3 px-4 font-mono font-semibold text-[#17323D] dark:text-[#AD7B3B]">
                          R$ 4.800,00
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium text-[11px]">
                            Seguro Fiança Porto
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Em dia
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium text-foreground">
                          Conjunto Comercial 804
                          <span className="block text-[10px] text-muted-foreground font-normal">Av. Brigadeiro Faria Lima, 3477</span>
                        </td>
                        <td className="py-3 px-4">TechNova Soluções Ltda</td>
                        <td className="py-3 px-4">Fundo Alpha Imobiliário</td>
                        <td className="py-3 px-4 font-mono font-semibold text-[#17323D] dark:text-[#AD7B3B]">
                          R$ 9.200,00
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium text-[11px]">
                            Título de Capitalização
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Em dia
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium text-foreground">
                          Casa 04 - Residencial Villa Lobos
                          <span className="block text-[10px] text-muted-foreground font-normal">Alameda das Hortênsias, 45</span>
                        </td>
                        <td className="py-3 px-4">Fernanda M. Vasconcelos</td>
                        <td className="py-3 px-4">Paulo Sampaio</td>
                        <td className="py-3 px-4 font-mono font-semibold text-[#17323D] dark:text-[#AD7B3B]">
                          R$ 6.500,00
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-medium text-[11px]">
                            Caução (3 meses)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[#AD7B3B] font-medium">
                            <Calendar className="w-3.5 h-3.5" /> Renovando
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-card border border-border flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#AD7B3B] shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-xs text-foreground">Geração de Minutas em PDF</h5>
                      <p className="text-[11px] text-muted-foreground">Contrato padronizado com os dados do imóvel, locatário e fiador preenchidos.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-card border border-border flex items-start gap-2.5">
                    <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-xs text-foreground">Aviso de Renovação 60 dias Antes</h5>
                      <p className="text-[11px] text-muted-foreground">O sistema alerta para negociar reajuste ou desocupação sem surpresas.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-card border border-border flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#17323D] dark:text-[#AD7B3B] shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-xs text-foreground">Laudos com Fotos de Entrada</h5>
                      <p className="text-[11px] text-muted-foreground">Fotos registradas de cada cômodo para evitar discussão na entrega das chaves.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TELA 3: CRM DE ATENDIMENTO */}
            {activeTab === 'crm' && (
              <motion.div
                key="crm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                      Atendimentos e Negociações da Semana
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Controle de pessoas interessadas que deixaram contato pelo site ou WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-card border border-border p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground pb-2 border-b border-border">
                      <span>Chegou pelo Site</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-[10px]">3</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-border/80 shadow-xs space-y-1">
                      <div className="flex justify-between items-start text-xs font-medium">
                        <span>Gabriel Medina</span>
                        <span className="text-[10px] text-emerald-600 font-mono">Há 20 min</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Quer alugar: 2 quartos em Moema</p>
                      <p className="text-[11px] font-semibold text-[#17323D] dark:text-[#AD7B3B]">Até R$ 4.500/mês</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-border/80 shadow-xs space-y-1">
                      <div className="flex justify-between items-start text-xs font-medium">
                        <span>Carolina Souza</span>
                        <span className="text-[10px] text-muted-foreground font-mono">Ontem</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Quer comprar: Apto Jardins</p>
                      <p className="text-[11px] font-semibold text-[#17323D] dark:text-[#AD7B3B]">R$ 1.850.000</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-card border border-border p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground pb-2 border-b border-border">
                      <span>Visita Marcada</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">2</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-border/80 shadow-xs space-y-1">
                      <div className="flex justify-between items-start text-xs font-medium">
                        <span>Marcos Vinicius</span>
                        <span className="text-[10px] text-blue-600 font-medium">Hoje 16h</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Casa em Condomínio Fechado</p>
                      <p className="text-[11px] text-muted-foreground">Corretor: Renato Dias</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-card border border-border p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground pb-2 border-b border-border">
                      <span>Ficha em Análise</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">1</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-border/80 shadow-xs space-y-1">
                      <div className="flex justify-between items-start text-xs font-medium">
                        <span>Juliana Nogueira</span>
                        <span className="text-[10px] text-amber-600 font-medium">Serasa</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Apto Vila Mariana</p>
                      <p className="text-[11px] font-semibold text-[#17323D] dark:text-[#AD7B3B]">R$ 3.400/mês</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-card border border-border p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground pb-2 border-b border-border">
                      <span>Contrato Pronto</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">2</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-emerald-300 dark:border-emerald-800 shadow-xs space-y-1">
                      <div className="flex justify-between items-start text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <span>Rafael Guimarães</span>
                        <span className="text-[10px] font-mono">Assinado</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Studio Pinheiros • R$ 2.900/mês</p>
                      <p className="text-[10px] text-emerald-600">Chaves liberadas</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TELA 4: COBRANÇA & REPASSES */}
            {activeTab === 'financial' && (
              <motion.div
                key="financial"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                      Conciliação de Cobranças e Repasses
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      O boleto compensa, a comissão da imobiliária fica retida e o valor líquido vai para a conta do dono.
                    </p>
                  </div>
                  <button
                    onClick={onOpenTrial}
                    className="px-3.5 py-2 rounded-lg bg-[#17323D] hover:bg-[#17323D]/90 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Gerar lote de repasse PIX</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <span className="text-xs text-muted-foreground">Total Pago pelos Inquilinos</span>
                    <div className="text-xl font-serif font-bold text-foreground mt-1">R$ 148.520,00</div>
                    <span className="text-[11px] text-emerald-600">Boletos e PIX identificados</span>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border">
                    <span className="text-xs text-muted-foreground">Taxa de Administração (Sua Receita)</span>
                    <div className="text-xl font-serif font-bold text-[#AD7B3B] mt-1">R$ 14.852,00</div>
                    <span className="text-[11px] text-muted-foreground">10% retidos na fonte</span>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border">
                    <span className="text-xs text-muted-foreground">Repassado aos Donos dos Imóveis</span>
                    <div className="text-xl font-serif font-bold text-emerald-600 mt-1">R$ 133.668,00</div>
                    <span className="text-[11px] text-muted-foreground">Comprovante gerado com extrato</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 text-muted-foreground font-medium border-b border-border">
                      <tr>
                        <th className="py-2.5 px-4">Proprietário</th>
                        <th className="py-2.5 px-4">Imóvel</th>
                        <th className="py-2.5 px-4">Bruto</th>
                        <th className="py-2.5 px-4">Taxa Adm</th>
                        <th className="py-2.5 px-4">Líquido Transferido</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/30">
                        <td className="py-2.5 px-4 font-medium text-foreground">Beatriz Albuquerque</td>
                        <td className="py-2.5 px-4 text-muted-foreground">Apto 1102 - Jardins</td>
                        <td className="py-2.5 px-4">R$ 4.800,00</td>
                        <td className="py-2.5 px-4 text-[#AD7B3B] font-medium">- R$ 480,00 (10%)</td>
                        <td className="py-2.5 px-4 font-bold text-emerald-600">R$ 4.320,00</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                            Enviado via PIX
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-muted/30">
                        <td className="py-2.5 px-4 font-medium text-foreground">Fundo Alpha Imobiliário</td>
                        <td className="py-2.5 px-4 text-muted-foreground">Conjunto 804 - Faria Lima</td>
                        <td className="py-2.5 px-4">R$ 9.200,00</td>
                        <td className="py-2.5 px-4 text-[#AD7B3B] font-medium">- R$ 736,00 (8%)</td>
                        <td className="py-2.5 px-4 font-bold text-emerald-600">R$ 8.464,00</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                            Enviado via TED
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TELA 5: ÁREA DO INQUILINO/DONO */}
            {activeTab === 'portal' && (
              <motion.div
                key="portal"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                      Portal Sem Senha para o Cliente Final
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Inquilinos e proprietários recebem um código de 6 dígitos no WhatsApp e acessam tudo pelo celular.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#17323D] text-[#EEECE5] flex items-center justify-center font-serif font-bold">
                        RM
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Roberto Mendes</h4>
                        <span className="text-xs text-muted-foreground">Inquilino • Apto 304</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Boleto de Maio/2026:</span>
                        <span className="font-bold text-[#17323D] dark:text-[#AD7B3B]">R$ 3.250,00</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span>Vencimento:</span>
                        <span className="font-medium">10/05/2026</span>
                      </div>
                      <button className="w-full py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Copiar Código PIX</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#AD7B3B] text-white flex items-center justify-center font-serif font-bold">
                        BA
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Beatriz Albuquerque</h4>
                        <span className="text-xs text-muted-foreground">Proprietária • 3 Imóveis</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Último Repasse Feito:</span>
                        <span className="font-bold text-emerald-600">R$ 11.840,00</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Extrato mensal e DIMOB prontos.</p>
                      <button className="w-full py-1.5 rounded-lg bg-[#17323D] hover:bg-[#17323D]/90 text-white font-medium text-xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Informe para Declaração IRPF</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border flex flex-col justify-between">
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Por que isso ajuda sua equipe:
                      </h5>
                      <ul className="text-xs space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>O inquilino não precisa mandar mensagem pedindo segunda via.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>O proprietário confere o extrato sem ligar no financeiro.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Informes de IRPF disponíveis todo início de ano.</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={onOpenTrial}
                      className="w-full py-2 text-xs font-medium rounded-lg bg-[#17323D] text-white flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                    >
                      <span>Testar área do cliente</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TELA 6: VITRINE NO SEU LINK */}
            {activeTab === 'subdomain' && (
              <motion.div
                key="subdomain"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-xl font-serif text-[#17323D] dark:text-[#EEECE5]">
                      Sua Vitrine Pública de Imóveis
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Os imóveis que você cadastrar aparecem prontos para compartilhamento no WhatsApp com o seu endereço próprio.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-mono font-medium">
                      aurora.domus.com.br
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#17323D] text-[#EEECE5] flex items-center justify-center font-serif font-bold text-sm">
                        IA
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Imobiliária Aurora</h4>
                        <p className="text-[11px] text-muted-foreground">Aluguel e Vendas em São Paulo</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-[#AD7B3B]/10 text-[#AD7B3B] font-medium text-xs">
                      28 imóveis no ar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border bg-background overflow-hidden shadow-xs">
                      <div className="h-32 bg-slate-200 dark:bg-slate-800 relative flex items-center justify-center text-muted-foreground">
                        <Building2 className="w-8 h-8 opacity-40" />
                        <span className="absolute bottom-2 left-2 text-[11px] font-medium text-foreground bg-card/80 px-2 py-0.5 rounded">Jardins, SP</span>
                        <span className="absolute top-2 right-2 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-medium">Aluguel</span>
                      </div>
                      <div className="p-3 space-y-1">
                        <h5 className="font-semibold text-xs text-foreground truncate">Apto 3 Quartos Oscar Freire</h5>
                        <p className="text-[11px] text-muted-foreground">140 m² • 2 vagas</p>
                        <div className="text-sm font-bold text-[#17323D] dark:text-[#AD7B3B] pt-1">
                          R$ 6.800 <span className="text-[10px] font-normal text-muted-foreground">/ mês</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-background overflow-hidden shadow-xs">
                      <div className="h-32 bg-slate-200 dark:bg-slate-800 relative flex items-center justify-center text-muted-foreground">
                        <Building2 className="w-8 h-8 opacity-40" />
                        <span className="absolute bottom-2 left-2 text-[11px] font-medium text-foreground bg-card/80 px-2 py-0.5 rounded">Vila Mariana, SP</span>
                        <span className="absolute top-2 right-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-medium">Venda</span>
                      </div>
                      <div className="p-3 space-y-1">
                        <h5 className="font-semibold text-xs text-foreground truncate">Edifício Modern Pinheiros</h5>
                        <p className="text-[11px] text-muted-foreground">88 m² • 2 suítes</p>
                        <div className="text-sm font-bold text-[#17323D] dark:text-[#AD7B3B] pt-1">
                          R$ 1.150.000
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-background overflow-hidden shadow-xs">
                      <div className="h-32 bg-slate-200 dark:bg-slate-800 relative flex items-center justify-center text-muted-foreground">
                        <Building2 className="w-8 h-8 opacity-40" />
                        <span className="absolute bottom-2 left-2 text-[11px] font-medium text-foreground bg-card/80 px-2 py-0.5 rounded">Pinheiros, SP</span>
                        <span className="absolute top-2 right-2 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-medium">Aluguel</span>
                      </div>
                      <div className="p-3 space-y-1">
                        <h5 className="font-semibold text-xs text-foreground truncate">Sala Comercial Pronta</h5>
                        <p className="text-[11px] text-muted-foreground">55 m² • 1 vaga</p>
                        <div className="text-sm font-bold text-[#17323D] dark:text-[#AD7B3B] pt-1">
                          R$ 3.800 <span className="text-[10px] font-normal text-muted-foreground">/ mês</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#EEECE5]/60 dark:bg-[#17323D]/40 border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-[#AD7B3B]" />
                      <span className="text-muted-foreground">
                        O interessado clica no imóvel e abre direto o WhatsApp do corretor responsável.
                      </span>
                    </div>
                    <button
                      onClick={onOpenTrial}
                      className="font-medium text-[#17323D] dark:text-[#AD7B3B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Reservar nome da minha imobiliária</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
