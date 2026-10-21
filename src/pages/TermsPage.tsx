import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ArrowLeft, CheckCircle2, Scale } from 'lucide-react'
import { DomusLogo } from '@/components/brand/DomusLogo'
import { Button } from '@/components/ui/button'

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#EEECE5] dark:bg-[#0E1E24] text-foreground font-sans selection:bg-[#AD7B3B]/20 selection:text-[#AD7B3B]">
      {/* Header Institucional */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#EEECE5]/90 dark:bg-[#0E1E24]/90 border-b border-[#D4D0C8] dark:border-[#2D4A51]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <DomusLogo size="md" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1.5 cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao início</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-card border border-border rounded-3xl p-6 sm:p-12 shadow-xl space-y-8"
        >
          {/* Título & Badge */}
          <div className="border-b border-border pb-6 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20">
              <Scale className="w-3.5 h-3.5" />
              <span>Contrato de Licenciamento & Adesão SaaS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5] tracking-tight">
              Termos de Uso e Contrato de Licença de Software
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Última atualização: Outubro de 2026 • Versão 2.4 • Válido para todas as imobiliárias contratantes
            </p>
          </div>

          {/* Resumo executivo dos termos */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#17323D]/5 dark:bg-[#EEECE5]/5 border border-[#17323D]/10 dark:border-[#EEECE5]/10 space-y-3">
            <h3 className="text-sm font-semibold text-[#17323D] dark:text-[#EEECE5] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#AD7B3B]" />
              <span>Princípios Fundamentais do Contrato Domus</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Seus dados são seus:</strong> isolamento em banco de dados exclusivo via RLS.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Sem fidelidade oculta:</strong> cancelamento a qualquer momento sem multa abusiva.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Conforme com a LGPD:</strong> guarda segura e criptografada de dados pessoais.</span>
              </div>
            </div>
          </div>

          {/* Cláusulas Contratuais Detalhadas */}
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B] flex items-center justify-center text-xs font-bold">1</span>
                <span>Objeto e Licenciamento de Uso</span>
              </h2>
              <p>
                O presente instrumento regula o licenciamento não exclusivo, intransferível e temporário de uso da plataforma <strong>Domus</strong> na modalidade Software como Serviço (SaaS), fornecida para gestão de locações, intermediações de vendas, cobranças automáticas, conciliação e portal do cliente para imobiliárias e administradoras de imóveis ("Contratante").
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B] flex items-center justify-center text-xs font-bold">2</span>
                <span>Período de Demonstração Gratuita (Teste de 3 Dias)</span>
              </h2>
              <p>
                A Contratante poderá usufruir de um período de degustação de <strong>3 (três) dias corridos</strong> sem exigência de cartão de crédito. Durante este período, o ambiente é liberado com dados demonstrativos para validação das ferramentas de repasse, contratos e CRM. Decorrido o prazo, o acesso permanece em modo de espera até a confirmação do plano definitivo pela Contratante.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B] flex items-center justify-center text-xs font-bold">3</span>
                <span>Planos, Mensalidades e Reajustes</span>
              </h2>
              <p>
                O valor mensal da assinatura varia conforme o plano contratado (Starter, Profissional ou Enterprise), dimensionado pela quantidade de imóveis ativos sob gestão e módulos habilitados.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Os pagamentos ocorrem mensalmente via boleto bancário ou PIX no dia de vencimento escolhido.</li>
                <li>O reajuste dos valores dos planos ocorrerá anualmente com base na variação positiva do <strong>IPCA (IBGE)</strong> ou índice oficial equivalente.</li>
                <li>Em caso de inadimplência superior a 15 (quinze) dias, o acesso poderá ser temporariamente suspenso, sem prejuízo da preservação integral dos dados cadastrados por até 90 (noventa) dias.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B] flex items-center justify-center text-xs font-bold">4</span>
                <span>Isolamento, Propriedade e Segurança dos Dados</span>
              </h2>
              <p>
                A Domus emprega arquitetura multi-tenant com <strong>Row Level Security (RLS)</strong> no banco de dados Postgres, garantindo que contratos, clientes, extratos e lançamentos de uma imobiliária sejam tecnicamente inacessíveis por qualquer outra empresa usuária da plataforma.
              </p>
              <p>
                A Contratante é a única e exclusiva proprietária de sua carteira de clientes, contratos e dados financeiros. A Domus atua estritamente como operadora da infraestrutura tecnológica.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B] flex items-center justify-center text-xs font-bold">5</span>
                <span>Conformidade com a LGPD (Lei 13.709/2018)</span>
              </h2>
              <p>
                Ambas as partes comprometem-se a cumprir integralmente as disposições da Lei Geral de Proteção de Dados Pessoais. A Contratante figura como Controladora dos dados pessoais de seus locatários e proprietários, sendo responsável pela legitimidade da coleta. A Domus assegura medidas técnicas de criptografia em trânsito (TLS 1.3) e em repouso (AES-256).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B] flex items-center justify-center text-xs font-bold">6</span>
                <span>Cancelamento e Rescisão</span>
              </h2>
              <p>
                A assinatura não possui período de carência ou fidelidade forçada. A Contratante pode solicitar o cancelamento a qualquer momento com aviso prévio de 30 (trinta) dias. Antes da desativação do ambiente, a Contratante terá direito a exportar a totalidade de seus dados e relatórios em formatos padrão (CSV, PDF, JSON).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#AD7B3B]/10 text-[#AD7B3B] flex items-center justify-center text-xs font-bold">7</span>
                <span>Foro e Legislação Aplicável</span>
              </h2>
              <p>
                O presente contrato é regido pelas leis da República Federativa do Brasil, elegendo-se o foro da comarca da sede da Contratante ou da capital do estado para dirimir quaisquer controvérsias oriundas deste termo.
              </p>
            </section>
          </div>

          {/* Rodapé do Card com Ações */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/privacidade" className="text-xs text-[#AD7B3B] hover:underline font-medium">
              Consultar Política de Privacidade & LGPD →
            </Link>
            <Link to="/">
              <Button className="h-10 px-6 bg-[#17323D] hover:bg-[#17323D]/90 text-white rounded-xl text-xs font-medium cursor-pointer">
                Entendido e Aceito
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
