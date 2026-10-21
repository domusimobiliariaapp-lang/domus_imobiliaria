import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Eye, Database } from 'lucide-react'
import { DomusLogo } from '@/components/brand/DomusLogo'
import { Button } from '@/components/ui/button'

export function PrivacyPage() {
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
              <Lock className="w-3.5 h-3.5" />
              <span>Conformidade com a LGPD (Lei 13.709/2018)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#17323D] dark:text-[#EEECE5] tracking-tight">
              Política de Privacidade e Proteção de Dados
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Transparência no tratamento de dados de imobiliárias, proprietários e locatários • Outubro de 2026
            </p>
          </div>

          {/* Destaques de Segurança */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-border space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">Isolamento Físico Lógico</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Cada imobiliária possui partição estrita de banco de dados. Nenhuma informação é compartilhada com concorrentes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-border space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#AD7B3B]/10 text-[#AD7B3B] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">Criptografia Ponta a Ponta</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Toda comunicação trafega sob TLS 1.3 com chaves de 256 bits e senhas armazenadas com algoritmo Argon2id/Bcrypt.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-border space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">Não Comercialização</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Nunca vendemos, alugamos ou monetizamos dados de inquilinos, contratos ou proprietários para terceiros ou anunciantes.
              </p>
            </div>
          </div>

          {/* Seções da Política */}
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">1. Papéis no Tratamento de Dados (Controlador vs Operador)</h2>
              <p>
                Para os fins da Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018):
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>A Imobiliária Contratante</strong> atua como <strong>Controladora</strong> dos dados pessoais de seus clientes (locatários, proprietários, fiadores e corretores), sendo a responsável pelas decisões sobre o tratamento e pelo consentimento dos titulares.</li>
                <li><strong>A plataforma Domus</strong> atua como <strong>Operadora</strong>, processando tais dados exclusivamente segundo as instruções da Contratante e nos estritos limites necessários para a prestação do serviço de gestão imobiliária.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">2. Dados Pessoais Coletados e Finalidades</h2>
              <p>
                Os dados tratados pela plataforma são estritamente aqueles necessários para a formalização de contratos de locação, emissão de cobranças bancárias e prestação de contas:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Dados Cadastrais:</strong> Nome completo, CPF, RG, estado civil, profissão, e-mail, telefone e endereço. Finalidade: qualificação das partes em minutas contratuais de locação e compra e venda.</li>
                <li><strong>Dados Financeiros:</strong> Chave PIX, conta bancária para repasse de aluguéis e histórico de pagamentos de boletos. Finalidade: liquidação financeira e cálculo de comissões.</li>
                <li><strong>Dados de Imóveis:</strong> Endereço, matrícula, fotos de vistorias e características físicas. Finalidade: vitrine pública, vistorias de entrada/saída e gestão predial.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">3. Direitos dos Titulares de Dados</h2>
              <p>
                Em conformidade com o artigo 18 da LGPD, os titulares de dados (inquilinos, proprietários e colaboradores) possuem direito à confirmação da existência de tratamento, acesso aos dados, correção de dados incompletos ou inexatos, anonimização e revogação do consentimento.
              </p>
              <p className="text-xs">
                As solicitações de titulares serão atendidas diretamente pelo Encarregado de Proteção de Dados (DPO) através do canal de suporte da imobiliária ou pelo e-mail institucional da Domus.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">4. Retenção e Descarte de Dados</h2>
              <p>
                Os dados contratuais são mantidos pelo período de vigência da relação contratual e, após seu encerramento, pelo prazo legal necessário para cumprimento de obrigações fiscais, tributárias e contábeis (Código Civil e Lei do Inquilinato). Após este prazo, os dados são anonimizados ou descartados de forma segura.
              </p>
            </section>
          </div>

          {/* Rodapé com Links */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/termos" className="text-xs text-[#AD7B3B] hover:underline font-medium">
              ← Consultar Termos de Uso e Contrato de Licença
            </Link>
            <Link to="/">
              <Button className="h-10 px-6 bg-[#17323D] hover:bg-[#17323D]/90 text-white rounded-xl text-xs font-medium cursor-pointer">
                Entendido
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
