import React, { useState } from 'react';
import { 
  Check, Sparkles, ArrowRight, 
  TrendingUp, TrendingDown, DollarSign, RefreshCw, BarChart3, 
  FileText, QrCode, Building2, AlertTriangle, 
  CheckCircle2, ChevronDown, ChevronUp, Play, Landmark
} from 'lucide-react';
import { FinanceiroCheckoutModal } from './FinanceiroCheckoutModal';

export const FinanceiroLanding: React.FC = () => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'vitalicio' | 'mensal'>('vitalicio');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const openCheckoutWith = (plan: 'vitalicio' | 'mensal') => {
    setCheckoutPlan(plan);
    setIsCheckoutOpen(true);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#17323D] selection:bg-[#C5A880]/20 selection:text-[#17323D]">
      {/* Top Bar de Anúncio / Oferta Vitalícia Domus Finanças */}
      <div className="bg-[#17323D] text-white px-4 py-2.5 text-xs text-center border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="bg-[#C5A880] text-[#17323D] text-[10px] font-black uppercase px-2 py-0.5 rounded">
            Domus Finanças ERP
          </span>
          <span>
            Liberadas <strong>50 Licenças Vitalícias do Domus Finanças ERP</strong> para usar para sempre sem mensalidades com 10% OFF no PIX.
          </span>
          <button 
            onClick={() => openCheckoutWith('vitalicio')}
            className="underline font-bold text-amber-300 hover:text-amber-200 ml-1 inline-flex items-center gap-1"
          >
            Garantir Minha Licença Vitalícia <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Header de Navegação */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#17323D] flex items-center justify-center text-[#C5A880] shadow-xs border border-[#C5A880]/30">
              <Landmark className="w-5 h-5 text-[#C5A880]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xl font-black tracking-tight text-[#17323D]">Domus</span>
                <span className="text-xl font-bold text-[#C5A880]">Finanças</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#AD7B3B] border border-[#C5A880]/30">
                  ERP Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Gestão financeira e operacional completa</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#funcionalidades" className="hover:text-[#AD7B3B] transition-colors">Funcionalidades do ERP</a>
            <a href="#comparativo" className="hover:text-[#AD7B3B] transition-colors">Economia Vitalícia</a>
            <a href="#precos" className="hover:text-[#AD7B3B] transition-colors">Planos & Preços</a>
            <a href="#faq" className="hover:text-[#AD7B3B] transition-colors">Dúvidas Frequentes</a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/financeiro/app"
              className="text-xs font-bold text-[#17323D] px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-[#AD7B3B]" />
              <span className="hidden sm:inline">Abrir ERP Financeiro</span>
            </a>
            <button
              onClick={() => openCheckoutWith('vitalicio')}
              className="bg-[#17323D] hover:bg-[#244754] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Garantir Vitalício</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-[#AD7B3B] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#AD7B3B]" />
            Sistema Financeiro Operacional com opção de Licença Vitalícia
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#17323D] tracking-tight leading-[1.1]">
            Toda a agilidade e poder do <span className="text-[#AD7B3B]">Domus Finanças ERP</span>, agora com <span className="underline decoration-[#C5A880]">Licença Vitalícia</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Contas a Pagar e Receber densas, Fluxo de Caixa Diário Projetado, Conciliação Bancária OFX com 1 clique e Cobranças PIX via WhatsApp. Assine mensalmente ou compre uma única vez e use para sempre no seu negócio.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => openCheckoutWith('vitalicio')}
              className="w-full sm:w-auto px-8 py-4 bg-[#17323D] hover:bg-[#244754] text-white font-black text-sm rounded-xl shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              Comprar Licença Vitalícia por R$ 697 (ou 12x)
            </button>
            <a
              href="/financeiro/app"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-[#17323D] border border-slate-300 font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 text-[#AD7B3B]" />
              Abrir Demonstração do ERP
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-[#17323D]/65 pt-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Opção Mensal ou Vitalícia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Garantia de 30 dias</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Suporte em Português</span>
            </div>
          </div>
        </div>

        {/* Pré-visualização Interativa Flutuante do ERP */}
        <div className="max-w-6xl mx-auto mt-12 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-[#17323D] px-6 py-3.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-300 ml-2">domus-financas.app/visao-geral</span>
            </div>
            <a 
              href="/financeiro/app" 
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Testar no Navegador Agora <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-semibold">Saldo Atual Consolidado</div>
              <div className="text-2xl font-black text-slate-900 mt-1">R$ 48.750,80</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">4 bancos sincronizados</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-semibold">Entradas Previstas (30d)</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">+ R$ 28.550,00</div>
              <div className="text-[11px] text-slate-500 mt-1">Cobrança PIX WhatsApp ativa</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-semibold">Saídas Agendadas (30d)</div>
              <div className="text-2xl font-black text-rose-600 mt-1">- R$ 8.510,00</div>
              <div className="text-[11px] text-slate-500 mt-1">Nenhum juros por atraso</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dores Reais do Empresário vs Solução Domus */}
      <section className="py-16 bg-[#F4EFE6] px-4 sm:px-6 lg:px-8 border-y border-amber-900/10">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-black text-[#17323D] tracking-tight">
              Por que a maioria das empresas sangra caixa todos os meses?
            </h2>
            <p className="text-sm text-[#17323D]/70">
              O problema quase nunca é falta de vendas, e sim o descasamento cego entre pagamentos e recebimentos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Furo de Caixa Inesperado</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Você faturou bem no mês, mas no dia 15 não tem saldo para honrar a folha porque os clientes pagam depois dos fornecedores.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Horas Perdidas com OFX</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Digitar extrato bancário linha por linha em planilhas do Excel causa erros contábeis e toma o tempo que você deveria vender.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Inadimplência Passiva</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cobrar cliente com vergonha ou esquecer faturas abertas corrói seu lucro. Cobrança automática no WhatsApp com PIX resolve na hora.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Prisão das Mensalidades</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ERPs de mercado cobram mensalidades caras que aumentam a cada ano. Com a Licença Vitalícia você paga uma única vez e o sistema é seu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades Principais */}
      <section id="funcionalidades" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#AD7B3B]">
              Tudo o que sua empresa precisa
            </span>
            <h2 className="text-3xl font-black text-[#17323D] tracking-tight">
              Recursos Operacionais Avançados
            </h2>
            <p className="text-sm text-[#17323D]/70">
              Desenhado para ser intuitivo e direto ao ponto, sem telas complexas que ninguém da sua equipe consegue usar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Contas a Receber & PIX</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitore faturas abertas, envie links de cobrança diretamente no WhatsApp do cliente com chave PIX e dê baixa automática.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Contas a Pagar & Boletos</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Controle de vencimentos de fornecedores, impostos e despesas fixas. Alertas de contas a vencer para evitar multas bancárias.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#AD7B3B] flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Fluxo de Caixa Diário</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Projeção do saldo bancário dia a dia para os próximos 30 a 90 dias. Saiba com precisão quando haverá sobra ou aperto financeiro.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Conciliação Bancária OFX</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Basta arrastar o arquivo de extrato do seu banco (.OFX). O sistema cruza os lançamentos e faz a reconciliação com 1 clique.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">DRE Gerencial em Tempo Real</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Demonstrativo de Resultado com Receita Líquida, Margem de Contribuição e Lucro Líquido Real por competência para seu contador.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Multi-Contas & Centro de Custos</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Organize múltiplos bancos (Itaú, Bradesco, NuBank, Inter) e classifique despesas por departamentos e projetos específicos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabela de Preços & Comparativo Mensal vs Vitalício */}
      <section id="precos" className="py-20 bg-[#F4EFE6] px-4 sm:px-6 lg:px-8 border-y border-amber-900/10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#AD7B3B]">
              Transparência Total
            </span>
            <h2 className="text-3xl font-black text-[#17323D] tracking-tight">
              Escolha o modelo que melhor se adapta à sua empresa
            </h2>
            <p className="text-sm text-[#17323D]/70">
              Assine mensalmente se preferir flexibilidade, ou compre a licença vitalícia e nunca mais pague nada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Card 1: Licença Vitalícia */}
            <div className="relative bg-white rounded-3xl p-8 border-2 border-[#AD7B3B] shadow-2xl flex flex-col justify-between ring-2 ring-amber-500/20">
              <div className="absolute -top-3.5 right-6 bg-[#AD7B3B] text-white text-xs font-black uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Recomendado • Economia Máxima
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Posse Definitiva do Software
                  </span>
                  <h3 className="text-2xl font-black text-[#17323D] mt-1">Licença Vitalícia</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Pague uma única vez e utilize o Domus Finanças para sempre no seu negócio.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/70">
                  <div className="text-xs text-slate-500 line-through">De R$ 1.200/ano</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#17323D]">R$ 697</span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      TAXA ÚNICA
                    </span>
                  </div>
                  <div className="text-xs text-amber-900 font-bold mt-1">
                    ou 12x de R$ 68,90 • No PIX à vista por R$ 627,30 (-10%)
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <strong>Zero mensalidades</strong> futuras para sempre
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Contas a Pagar e Receber Ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Importação de Extrato OFX e Conciliação
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Cobranças PIX com envio WhatsApp
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Fluxo de Caixa Diário e DRE Gerencial
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Atualizações e melhorias contínuas inclusas
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Garantia de 30 dias com devolução 100%
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-2">
                <button
                  onClick={() => openCheckoutWith('vitalicio')}
                  className="w-full py-4 bg-[#AD7B3B] hover:bg-[#96672d] text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition-all"
                >
                  Garantir Licença Vitalícia Agora
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-slate-500">
                  Restam apenas 14 licenças no lote promocional
                </p>
              </div>
            </div>

            {/* Card 2: Assinatura Mensal */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    SaaS Recorrente
                  </span>
                  <h3 className="text-2xl font-black text-[#17323D] mt-1">Plano Mensal</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Para quem deseja começar com custo inicial baixo e sem fidelidade anual.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-xs text-slate-500">Sem contrato de permanência</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#17323D]">R$ 59,90</span>
                    <span className="text-xs font-bold text-slate-600">/mês</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Cancele a qualquer momento com apenas 1 clique
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Acesso completo ao Domus Finanças ERP
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Contas a Pagar e Receber Ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Importação de Extratos OFX
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Fluxo de Caixa Diário e Projetado
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Suporte técnico humanizado
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-2">
                <button
                  onClick={() => openCheckoutWith('mensal')}
                  className="w-full py-4 bg-[#17323D] hover:bg-[#204554] text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  Assinar Mensal por R$ 59,90
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-slate-500">
                  Renovação mensal automática • Sem multas de saída
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ de Perguntas Frequentes */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-[#17323D] tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-sm text-[#17323D]/70">
            Tire suas dúvidas antes de adquirir o sistema
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'A licença vitalícia é realmente para sempre?',
              a: 'Sim! Ao adquirir a Licença Vitalícia você paga uma única vez e tem acesso perpétuo ao Domus Finanças ERP para sua empresa, sem cobrança de mensalidades ou anuidades no futuro.'
            },
            {
              q: 'Este sistema é dependente de outros apps como Solar, Obras ou Imobiliária?',
              a: 'Não. O Domus Finanças é um sistema totalmente independente e autônomo, desenhado para gerenciar as finanças de qualquer tipo de comércio, distribuidora, prestadora de serviços ou negócio digital.'
            },
            {
              q: 'Como funciona a importação de arquivo .OFX?',
              a: 'Você baixa o extrato no Internet Banking do seu banco (Itaú, Bradesco, BB, Inter, Santander, etc.) no formato .OFX e arrasta para o Domus Finanças. O sistema cruza os lançamentos automaticamente e você faz a conciliação com 1 clique.'
            },
            {
              q: 'Existe limite de faturamento ou de lançamentos mensais?',
              a: 'Não existe limite! Tanto na licença vitalícia quanto no plano mensal você pode cadastrar quantas contas a pagar e receber precisar, sem cobrança por volume de notas ou receitas.'
            },
            {
              q: 'E se eu comprar e não gostar?',
              a: 'Oferecemos garantia incondicional de 30 dias. Se por qualquer motivo o sistema não atender suas expectativas, basta nos enviar um e-mail ou WhatsApp e devolvemos 100% do seu investimento sem burocracia.'
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left font-bold text-sm text-[#17323D] flex items-center justify-between gap-4"
              >
                <span>{item.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-[#AD7B3B] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#17323D] text-slate-300 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black">
              DF
            </div>
            <div>
              <div className="font-bold text-white text-sm">Domus Finanças ERP</div>
              <p className="text-[11px] text-slate-400">Sistema Financeiro Independente</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-400">
            <a href="/financeiro/app" className="hover:text-white">Acessar Demonstração</a>
            <a href="#precos" className="hover:text-white">Planos & Preços</a>
            <button onClick={() => openCheckoutWith('vitalicio')} className="hover:text-amber-400">Comprar Licença Vitalícia</button>
          </div>

          <div className="text-[11px] text-slate-400 text-center md:text-right">
            © {new Date().getFullYear()} Domus Finanças. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Modal de Checkout / Venda do Sistema */}
      <FinanceiroCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        defaultPlan={checkoutPlan}
      />
    </div>
  );
};
