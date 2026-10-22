import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, ShieldCheck, X, CreditCard, RotateCcw } from 'lucide-react'

interface InteractivePaymentModalProps {
  isOpen?: boolean
  onClose?: () => void
  amount?: number
  description?: string
}

export function InteractivePaymentModal({
  isOpen = true,
  onClose,
  amount = 2850.0,
  description = 'Aluguel + Condomínio (Ref: Outubro/2026)',
}: InteractivePaymentModalProps) {
  const [cardName, setCardName] = useState('RODRIGO SILVA')
  const [cardNumber, setCardNumber] = useState('3543 5455 4654 6546')
  const [cvv, setCvv] = useState('465')
  const [expiry, setExpiry] = useState('12/28')
  const [email, setEmail] = useState('rodrigo@exemplo.com.br')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Formatação de número do cartão com espaços
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardNumber(formatted)
  }

  // Formatação de data de expiração
  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`)
    } else {
      setExpiry(raw)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setIsSuccess(true)
    }, 1800)
  }

  const handleReset = () => {
    setIsSuccess(false)
    setIsProcessing(false)
  }

  if (!isOpen) return null

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-white border border-[#D4D0C8] shadow-xl overflow-hidden transition-all duration-300">
      {/* Barra superior de status */}
      <div className="px-6 py-4 bg-[#F7F5F0] border-b border-[#D4D0C8] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-[#AD7B3B]" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6375] ml-3">
            Payment Checkout V4 · Domus Pay
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#6B6375] hover:text-[#17323D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            /* ==========================================================
               ETAPA 1: FORMULÁRIO DE CHECKOUT COM RESUMO
               ========================================================== */
            <motion.div
              key="checkout-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Coluna Esquerda: Informações & Resumo */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#AD7B3B]/10 text-[#AD7B3B] mb-4 shadow-xs border border-[#AD7B3B]/20">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold font-serif tracking-tight text-[#17323D]">
                    Checkout Seguro
                  </h2>
                  <p className="text-sm text-[#6B6375] mt-1">
                    Você está a apenas um passo de confirmar o pagamento no padrão Domus.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#D4D0C8] space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#6B6375]">Total a Pagar:</span>
                    <span className="text-xl font-bold text-[#17323D] font-serif">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
                    </span>
                  </div>
                  <div className="text-xs text-[#6B6375] border-t border-[#D4D0C8] pt-2">
                    {description}
                  </div>
                </div>

                <div className="space-y-3 text-xs text-[#6B6375]">
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EEECE5] font-semibold text-[11px] shrink-0 text-[#17323D]">
                      1
                    </span>
                    <p>Preencha os dados do cartão de crédito para processar a transação.</p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EEECE5] font-semibold text-[11px] shrink-0 text-[#17323D]">
                      2
                    </span>
                    <p>Bandeiras aceitas em ambiente homologado com certificação PCI-DSS.</p>
                  </div>

                  {/* Bandeiras de cartão */}
                  <div className="flex items-center gap-2 pl-7 pt-1">
                    {['VISA', 'MASTERCARD', 'ELO', 'AMEX'].map((badge) => (
                      <span
                        key={badge}
                        className="px-2.5 py-1 rounded bg-white font-mono text-[10px] font-bold border border-[#D4D0C8] text-[#17323D] shadow-2xs"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-start gap-2.5 pt-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p>Seus dados são protegidos por criptografia de ponta a ponta.</p>
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Formulário de Cartão */}
              <div className="lg:col-span-7 bg-[#F7F5F0] p-6 rounded-2xl border border-[#D4D0C8] shadow-xs">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6375] mb-1.5">
                      Nome impresso no cartão
                    </label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="NOME COMO NO CARTÃO"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C8] bg-white text-[#17323D] text-sm focus:outline-none focus:ring-2 focus:ring-[#AD7B3B]/50 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6375] mb-1.5">
                      Número do Cartão
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C8] bg-white text-[#17323D] text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#AD7B3B]/50 shadow-xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEECE5] text-[#17323D] border border-[#D4D0C8]">
                        VISA
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6375] mb-1.5">
                        CVV
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="•••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C8] bg-white text-[#17323D] text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#AD7B3B]/50 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6375] mb-1.5">
                        Validade (MM/AA)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={expiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C8] bg-white text-[#17323D] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#AD7B3B]/50 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6375] mb-1.5">
                      Enviar comprovante para
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@dominio.com.br"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C8] bg-white text-[#17323D] text-sm focus:outline-none focus:ring-2 focus:ring-[#AD7B3B]/50 shadow-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-[#17323D] hover:bg-[#254F5E] border border-[#AD7B3B]/30 shadow-md shadow-[#17323D]/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Processando Pagamento Seguro...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirmar Pagamento</span>
                          <ArrowRight className="w-4 h-4 text-[#AD7B3B]" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            /* ==========================================================
               ETAPA 2: ANIMAÇÃO DE FINALIZAÇÃO (CARTÃO 3D DOMUS + SUCESSO)
               ========================================================== */
            <motion.div
              key="checkout-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="py-6 flex flex-col items-center justify-center text-center space-y-8"
            >
              {/* O Cartão de Crédito Físico Estilizado Domus Black/Petróleo com Ouro */}
              <motion.div
                initial={{ rotateY: -30, rotateX: 10, y: -20, opacity: 0 }}
                animate={{ rotateY: 0, rotateX: 0, y: 0, opacity: 1 }}
                transition={{ duration: 0.8, type: 'spring', damping: 15 }}
                className="w-full max-w-sm aspect-[1.58/1] rounded-2xl p-6 text-white relative overflow-hidden shadow-2xl shadow-[#17323D]/50 select-none bg-gradient-to-tr from-[#0b171c] via-[#17323D] to-[#244f5e] border border-[#AD7B3B]/40"
              >
                {/* Linhas de design orgânicas suaves no fundo em dourado */}
                <div className="absolute inset-0 opacity-25 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 350 220" fill="none">
                    <path
                      d="M -50 180 C 100 120, 200 240, 400 80"
                      stroke="#AD7B3B"
                      strokeWidth="2"
                    />
                    <path
                      d="M -20 220 C 120 160, 240 280, 420 120"
                      stroke="#AD7B3B"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                {/* Top do cartão: Banco e Tipo */}
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#AD7B3B]" />
                    <span className="text-xs font-bold tracking-widest uppercase text-[#AD7B3B]">
                      DOMUS BLACK
                    </span>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-[#E0DED6]/80 font-mono">
                    Cartão Digital
                  </span>
                </div>

                {/* Chip Dourado e Contactless */}
                <div className="my-5 flex items-center justify-between relative z-10">
                  <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300 shadow-inner flex items-center justify-center">
                    <div className="w-9 h-6 border border-amber-800/20 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
                      <div className="border-r border-amber-800/30" />
                      <div />
                    </div>
                  </div>

                  {/* Símbolo Contactless */}
                  <svg className="w-5 h-5 text-[#AD7B3B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                    <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                    <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                  </svg>
                </div>

                {/* Número do Cartão */}
                <div className="relative z-10 font-mono text-lg tracking-[0.2em] font-medium text-white drop-shadow-sm">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>

                {/* Rodapé: CVV, Validade e Nome */}
                <div className="mt-4 flex items-end justify-between relative z-10 text-xs">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[#AD7B3B]">Titular</div>
                    <div className="font-semibold tracking-wider uppercase truncate max-w-[170px] text-white">
                      {cardName || 'NOME DO TITULAR'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-wider text-[#AD7B3B]">Validade</div>
                    <div className="font-mono font-medium text-white">{expiry || 'MM/AA'}</div>
                  </div>
                </div>
              </motion.div>


              {/* Status de Pagamento Concluído com Sucesso */}
              <div className="space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-600 text-emerald-600 mx-auto flex items-center justify-center shadow-md shadow-emerald-500/20"
                >
                  <Check className="w-7 h-7 stroke-[3]" />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl font-bold font-serif tracking-tight text-[#17323D]"
                >
                  Pagamento Confirmado com Sucesso
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-[#6B6375] max-w-sm"
                >
                  A fatura foi quitada com sucesso. O comprovante foi enviado para{' '}
                  <span className="font-medium text-[#17323D]">{email}</span>.
                </motion.p>
              </div>

              {/* Ações de teste */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl bg-[#EEECE5] hover:bg-[#E5E2D9] border border-[#D4D0C8] text-[#17323D] text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-4 h-4 text-[#AD7B3B]" />
                  <span>Testar Novamente</span>
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-[#17323D] text-white text-sm font-semibold hover:bg-[#254F5E] transition-all cursor-pointer shadow-xs"
                  >
                    Concluir
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
