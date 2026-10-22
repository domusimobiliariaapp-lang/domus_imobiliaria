import React, { useState } from 'react';
import { 
  X, Check, Sparkles, ShieldCheck, CreditCard, 
  QrCode, Copy, Clock, ArrowRight, Star, 
  CheckCircle2, Landmark
} from 'lucide-react';

interface FinanceiroCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: 'vitalicio' | 'mensal';
}

export const FinanceiroCheckoutModal: React.FC<FinanceiroCheckoutModalProps> = ({
  isOpen,
  onClose,
  defaultPlan = 'vitalicio'
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'vitalicio' | 'mensal'>(defaultPlan);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');
  const [step, setStep] = useState<'plan_details' | 'payment' | 'success'>('plan_details');
  const [pixCopied, setPixCopied] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    cnpjCpf: '',
    cardNumero: '',
    cardNome: '',
    cardValidade: '',
    cardCvv: '',
    parcelas: '12'
  });

  if (!isOpen) return null;

  const VITALICIO_VALOR_CHEIO = 697.00;
  const VITALICIO_PIX_COM_DESCONTO = 627.30; // 10% off
  const MENSAL_VALOR = 59.90;

  const handleCopyPix = () => {
    navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136domus-financeiro-vitalicio@pix.com5204000053039865406627.305802BR5925DOMUS FINANCEIRO LTDA6009SAO PAULO62070503***6304E8A2');
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-[#FCFAF6] text-[#17323D] rounded-3xl shadow-2xl border border-amber-900/10 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com indicador de segurança e fechar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#17323D] flex items-center justify-center text-[#C5A880] shadow-sm border border-[#C5A880]/30">
              <Landmark className="w-5 h-5 text-[#C5A880]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black tracking-tight text-base text-[#17323D]">Domus Finanças ERP</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#AD7B3B] border border-[#C5A880]/40">
                  Edição Profissional
                </span>
              </div>
              <p className="text-xs text-slate-500">Gestão financeira e operacional completa para sua empresa</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Ambiente Seguro 256-bit
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'plan_details' && (
            <div className="space-y-6">
              {/* Seletor de Modelo: Vitalício vs Mensal */}
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h3 className="text-2xl font-black text-[#17323D] tracking-tight">
                  Escolha como deseja adquirir o Domus Finanças ERP
                </h3>
                <p className="text-sm text-slate-600">
                  Sem taxas ocultas, sem pegadinhas. Você decide se prefere assinatura mensal ou a posse definitiva vitalícia.
                </p>
              </div>

              {/* Grid dos 2 Planos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
                {/* Opção 1: Licença Vitalícia (Destaque Principal) */}
                <div 
                  onClick={() => setSelectedPlan('vitalicio')}
                  className={`relative cursor-pointer rounded-2xl p-5 transition-all duration-200 border-2 flex flex-col justify-between ${
                    selectedPlan === 'vitalicio'
                      ? 'border-[#AD7B3B] bg-gradient-to-b from-amber-50/70 to-white shadow-xl ring-2 ring-[#AD7B3B]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Badge Exclusivo */}
                  <div className="absolute -top-3.5 right-4 bg-gradient-to-r from-[#AD7B3B] to-amber-600 text-white text-[11px] font-black uppercase px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Mais Econômico (Economia de 80%)
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        Licença Vitalícia (Lifetime)
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedPlan === 'vitalicio' ? 'border-[#AD7B3B] bg-[#AD7B3B] text-white' : 'border-slate-300'
                      }`}>
                        {selectedPlan === 'vitalicio' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs text-[#17323D]/60 line-through">De R$ 1.200/ano</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#17323D]">R$ 697</span>
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Pagamento ÚNICO
                        </span>
                      </div>
                      <p className="text-[12px] text-amber-800 mt-1 font-medium">
                        ou 12x de R$ 68,90 • No PIX com 10% OFF por <strong>R$ 627,30</strong>
                      </p>
                    </div>

                    <div className="p-3 bg-amber-100/40 rounded-xl border border-amber-200/60 text-xs text-amber-950 mb-4 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-900">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" /> Acesso Para Sempre:
                      </div>
                      <p>Nunca mais pague mensalidades de ERP. Use no seu negócio sem limite de tempo e com todas as atualizações inclusas.</p>
                    </div>

                    <ul className="space-y-2 text-xs text-[#17323D]/80">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <strong>Sem nenhuma mensalidade</strong> futura
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Contas a Pagar & Receber Ilimitadas
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Importação OFX & Conciliação Bancária
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Fluxo de Caixa Diário e DRE em 1 clique
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Cobrança PIX com link WhatsApp
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <strong>Plataforma Unificada Domus</strong> (Imobiliária, Obras & Solar integrados)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Garantia Incondicional de 30 dias
                      </li>
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-amber-900/10 text-center">
                    <span className="text-[11px] text-amber-900 font-semibold">
                      🔥 Apenas 14 licenças vitalícias restantes no lote atual
                    </span>
                  </div>
                </div>

                {/* Opção 2: Assinatura Mensal */}
                <div 
                  onClick={() => setSelectedPlan('mensal')}
                  className={`relative cursor-pointer rounded-2xl p-5 transition-all duration-200 border-2 flex flex-col justify-between ${
                    selectedPlan === 'mensal'
                      ? 'border-[#17323D] bg-slate-50 shadow-xl ring-2 ring-[#17323D]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Assinatura Mensal (SaaS)
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedPlan === 'mensal' ? 'border-[#17323D] bg-[#17323D] text-white' : 'border-slate-300'
                      }`}>
                        {selectedPlan === 'mensal' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs text-[#17323D]/60">Sem fidelidade anual</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#17323D]">R$ 59,90</span>
                        <span className="text-xs font-semibold text-slate-600">/mês</span>
                      </div>
                      <p className="text-[12px] text-slate-500 mt-1">
                        Cancele quando quiser com apenas 1 clique.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 mb-4 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-600" /> Ideal para começar:
                      </div>
                      <p>Para quem quer testar o fluxo de caixa no mês a mês com baixo custo inicial de entrada.</p>
                    </div>

                    <ul className="space-y-2 text-xs text-[#17323D]/80">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Todas as funcionalidades do ERP
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Contas a Pagar & Receber Ilimitadas
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Importação de Extrato OFX
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Cobrança PIX
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Suporte técnico via WhatsApp
                      </li>
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500">
                      Cobrança automática renovável a cada 30 dias
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão para avançar */}
              <div className="flex items-center justify-between pt-4 border-t border-amber-900/10">
                <div className="text-xs text-[#17323D]/70 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Garantia de 30 dias com devolução integral do valor se não se adaptar.
                </div>
                <button
                  onClick={() => setStep('payment')}
                  className="px-6 py-3 bg-[#AD7B3B] hover:bg-[#96672d] text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 flex items-center gap-2 transition-all transform active:scale-95"
                >
                  Continuar com Plano {selectedPlan === 'vitalicio' ? 'Vitalício' : 'Mensal'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Resumo do Pedido */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#17323D]/60 font-semibold uppercase">Você está adquirindo:</div>
                  <div className="text-base font-bold text-[#17323D] flex items-center gap-2">
                    Domus Finanças ERP — {selectedPlan === 'vitalicio' ? 'Licença Vitalícia (Sem Mensalidades)' : 'Plano Mensal'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-[#AD7B3B]">
                    {selectedPlan === 'vitalicio' 
                      ? (paymentMethod === 'pix' ? `R$ ${VITALICIO_PIX_COM_DESCONTO.toFixed(2)}` : `R$ ${VITALICIO_VALOR_CHEIO.toFixed(2)}`)
                      : `R$ ${MENSAL_VALOR.toFixed(2)}/mês`
                    }
                  </div>
                  <button 
                    onClick={() => setStep('plan_details')}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Alterar plano
                  </button>
                </div>
              </div>

              {/* Seletor de Método de Pagamento */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#17323D] uppercase tracking-wider">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-sm transition-all ${
                      paymentMethod === 'pix'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    PIX Imediato {selectedPlan === 'vitalicio' && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black">-10%</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao')}
                    className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-sm transition-all ${
                      paymentMethod === 'cartao'
                        ? 'border-[#17323D] bg-slate-100 text-[#17323D] shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-[#17323D]" />
                    Cartão de Crédito {selectedPlan === 'vitalicio' && <span className="text-[10px] text-slate-500 font-normal">(em até 12x)</span>}
                  </button>
                </div>
              </div>

              {/* Formulário de Identificação */}
              <form onSubmit={handleFinalize} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Seu Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Roberto Silva"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD7B3B]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Seu E-mail Corporativo *</label>
                    <input
                      type="email"
                      required
                      placeholder="carlos@suaempresa.com.br"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD7B3B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">WhatsApp para Ativação *</label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 98888-7777"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD7B3B]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">CPF ou CNPJ da Empresa *</label>
                    <input
                      type="text"
                      required
                      placeholder="00.000.000/0001-00"
                      value={formData.cnpjCpf}
                      onChange={(e) => setFormData({...formData, cnpjCpf: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD7B3B]"
                    />
                  </div>
                </div>

                {/* Se for PIX, mostrar QR Code e Chave */}
                {paymentMethod === 'pix' ? (
                  <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-emerald-900 font-bold text-sm">
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      Pague com PIX com liberação instantânea da sua chave de acesso
                    </div>

                    <div className="w-40 h-40 mx-auto bg-white p-2 rounded-xl shadow-md border border-emerald-200 flex items-center justify-center">
                      {/* Simulação visual do QR Code */}
                      <div className="w-full h-full bg-slate-900 rounded-lg p-2 flex flex-col justify-between items-center text-white text-[9px] font-mono select-none">
                        <div className="flex justify-between w-full">
                          <div className="w-7 h-7 bg-white p-1"><div className="w-full h-full bg-slate-900"></div></div>
                          <div className="w-7 h-7 bg-white p-1"><div className="w-full h-full bg-slate-900"></div></div>
                        </div>
                        <div className="text-[10px] font-bold tracking-widest text-emerald-400">PIX OFICIAL</div>
                        <div className="flex justify-between w-full">
                          <div className="w-7 h-7 bg-white p-1"><div className="w-full h-full bg-slate-900"></div></div>
                          <div className="text-[8px] text-slate-300">DOMUS ERP</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-slate-600">Copie o código PIX Copia e Cola abaixo:</div>
                      <div className="flex items-center gap-2 max-w-md mx-auto">
                        <input
                          type="text"
                          readOnly
                          value="00020126580014br.gov.bcb.pix0136domus-financeiro-vitalicio@pix.com..."
                          className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {pixCopied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Se for Cartão */
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Número do Cartão *</label>
                      <input
                        type="text"
                        required
                        placeholder="0000 0000 0000 0000"
                        value={formData.cardNumero}
                        onChange={(e) => setFormData({...formData, cardNumero: e.target.value})}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#17323D]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">Validade *</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/AA"
                          value={formData.cardValidade}
                          onChange={(e) => setFormData({...formData, cardValidade: e.target.value})}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">CVV *</label>
                        <input
                          type="text"
                          required
                          placeholder="123"
                          value={formData.cardCvv}
                          onChange={(e) => setFormData({...formData, cardCvv: e.target.value})}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    {selectedPlan === 'vitalicio' && (
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">Opções de Parcelamento</label>
                        <select
                          value={formData.parcelas}
                          onChange={(e) => setFormData({...formData, parcelas: e.target.value})}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none"
                        >
                          <option value="1">1x de R$ 697,00 (sem juros)</option>
                          <option value="2">2x de R$ 348,50 (sem juros)</option>
                          <option value="3">3x de R$ 232,33 (sem juros)</option>
                          <option value="6">6x de R$ 123,50</option>
                          <option value="12">12x de R$ 68,90 (Recomendado)</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setStep('plan_details')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Voltar aos planos
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all transform active:scale-95"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Finalizar e Ativar Acesso Imediato
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-[#17323D]">
                Acesso Ativado com Sucesso!
              </h3>
              <p className="text-sm text-slate-600">
                Parabéns, <strong>{formData.nome || 'Cliente'}</strong>! Sua licença do <strong>Domus Finanças ERP</strong> está confirmada.
              </p>
              
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Detalhes da sua licença:
                </div>
                <div>• <strong>Tipo:</strong> {selectedPlan === 'vitalicio' ? 'Licença Vitalícia (Sem Mensalidades Para Sempre)' : 'Assinatura Mensal Ativa'}</div>
                <div>• <strong>E-mail de Acesso:</strong> {formData.email || 'seu-email@empresa.com'}</div>
                <div>• <strong>Chave de Autenticação:</strong> DOMUS-FIN-{Math.random().toString(36).substring(2, 9).toUpperCase()}</div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/financeiro/app';
                  }}
                  className="px-6 py-3 bg-[#17323D] hover:bg-[#204554] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  Abrir Sistema Agora
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
