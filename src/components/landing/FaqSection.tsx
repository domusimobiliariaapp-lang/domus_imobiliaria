import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'Como funciona o subdomínio da minha imobiliária?',
      answer:
        'Você escolhe o nome curto da sua empresa (ex: horizonte). A vitrine pública e a área de clientes ficam disponíveis imediatamente em horizonte.gestaodomus.com.br. Você divulga esse link no WhatsApp, redes sociais e anúncios. Se preferir usar um domínio próprio (ex: www.imobiliariahorizonte.com.br), o plano Enterprise permite apontar o DNS diretamente.',
    },
    {
      question: 'Preciso colocar cartão de crédito para fazer o teste de 3 dias?',
      answer:
        'Não. O teste de 3 dias é liberado sem pedir cartão nem dados bancários. Você entra, cadastra seus primeiros imóveis, simula um contrato de aluguel e avalia se o sistema atende a rotina da sua equipe antes de decidir contratar.',
    },
    {
      question: 'Consigo importar meus imóveis e contratos de planilhas Excel?',
      answer:
        'Sim. Você pode subir suas planilhas de cadastro (imóveis, locatários e proprietários) por meio do modelo padrão de importação. Para carteiras maiores nos planos Profissional e Enterprise, nossa equipe acompanha o processo para garantir que nenhuma data de reajuste ou repasse fique para trás.',
    },
    {
      question: 'Como o inquilino acessa a segunda via do boleto?',
      answer:
        'Ele entra na página da sua imobiliária e digita o CPF ou telefone cadastrado. O sistema envia um código de 6 dígitos no WhatsApp ou e-mail dele. Com esse código ele já acessa a 2ª via em PDF, a linha digitável e o código PIX Copia e Cola, sem sobrecarregar seu atendimento.',
    },
    {
      question: 'Como funciona o cálculo e o repasse para o proprietário?',
      answer:
        'Assim que o aluguel é marcado como pago, o Domus desconta a taxa de administração configurada (ex: 10%), abate eventuais despesas autorizadas (IPTU, reparos) e gera o lote de repasse com comprovante pronto para envio ao proprietário.',
    },
    {
      question: 'Existe carência ou contrato de fidelidade?',
      answer:
        'No plano mensal não há fidelidade: você paga mês a mês e pode cancelar a qualquer momento sem multa. No plano anual, você tem 20% de desconto (equivalente a 2 meses grátis) parcelado em 12 vezes.',
    },
  ]

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx
        return (
          <div
            key={idx}
            className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${
              isOpen
                ? 'border-[#AD7B3B]/40 bg-card shadow-sm'
                : 'border-border bg-card/60 hover:bg-card'
            }`}
          >
            <button
              onClick={() => toggle(idx)}
              className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
            >
              <span className="font-serif text-base sm:text-lg font-medium text-foreground">
                {faq.question}
              </span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isOpen ? 'bg-[#AD7B3B] text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/40 mt-1">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
