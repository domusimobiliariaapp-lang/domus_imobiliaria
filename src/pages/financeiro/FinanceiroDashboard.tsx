import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, CheckCircle2, Upload, Plus, Search, ChevronDown, 
  Wallet, Building2, Send, Download, Sparkles, X, Landmark,
  ShoppingCart, Package, Users, Receipt, Settings, Bell, Menu, Trash2,
  LogOut, LayoutGrid
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FinanceiroCheckoutModal } from './FinanceiroCheckoutModal';

interface TituloFinanceiro {
  id: string;
  numero: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  entidade: string; // Cliente ou Fornecedor
  categoria: string;
  contaBancaria: string;
  valor: number;
  saldoAberto: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  situacao: 'aberto' | 'pago' | 'vencido' | 'parcial';
  formaRecebimento: 'pix' | 'boleto' | 'cartao' | 'ted' | 'dinheiro';
  codigoBarras?: string;
  nfeOrigem?: string;
}

interface ContaBancaria {
  banco: string;
  ag: string;
  cc: string;
  saldo: number;
  cor: string;
}

export const FinanceiroDashboard: React.FC = () => {
  // Navegação de Módulos Domus Finanças ERP
  const [activeModule, setActiveModule] = useState<'financas' | 'vendas' | 'suprimentos' | 'cadastros' | 'nfe' | 'dashboard'>('financas');
  const [activeSubMenu, setActiveSubMenu] = useState<'receber' | 'pagar' | 'fluxo_caixa' | 'bancos' | 'conciliacao_ofx' | 'dre'>('receber');
  
  // Controle de layout e modais
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showNovoTituloModal, setShowNovoTituloModal] = useState(false);
  const [modalTituloTipo, setModalTituloTipo] = useState<'receita' | 'despesa'>('receita');
  
  // Filtros de Tabela Operacional
  const [filtroSituacao, setFiltroSituacao] = useState<'todos' | 'aberto' | 'pago' | 'vencido'>('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Feedback ao cobrar PIX
  const [pixSentId, setPixSentId] = useState<string | null>(null);

  // Conciliação Bancária OFX
  const [ofxFileLoaded, setOfxFileLoaded] = useState(false);
  const [ofxReconciledIds, setOfxReconciledIds] = useState<string[]>([]);

  // Contexto Multi-Tenant e Persistência Real
  const { organization, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate('/login');
    }
  };
  const storageTitulosKey = `domus_financeiro_titulos_${organization?.id || 'default'}`;
  const storageContasKey = `domus_financeiro_contas_${organization?.id || 'default'}`;

  // Estados do Modal de Novo Título
  const [novoEntidade, setNovoEntidade] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novoVencimento, setNovoVencimento] = useState(() => new Date().toISOString().split('T')[0]);
  const [novoCategoria, setNovoCategoria] = useState('Vendas de Mercadorias');
  const [novoConta, setNovoConta] = useState('Itaú Unibanco (Ag 0482 / C/C 29402-1)');
  const [novoForma, setNovoForma] = useState<'pix' | 'boleto' | 'cartao' | 'ted' | 'dinheiro'>('pix');

  // Base de Dados de Títulos Financeiros Reais
  const [titulos, setTitulos] = useState<TituloFinanceiro[]>(() => {
    try {
      const saved = localStorage.getItem(storageTitulosKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'TIT-10492',
        numero: '0010492/01',
        tipo: 'receita',
        descricao: 'Venda de Mercadorias - Pedido #4820',
        entidade: 'Distribuidora Comercial Alpha Sul Ltda',
        categoria: 'Vendas de Mercadorias',
        contaBancaria: 'Itaú Unibanco (Ag 0482 / C/C 29402-1)',
        valor: 8450.00,
        saldoAberto: 8450.00,
        dataEmissao: '2026-10-15',
        dataVencimento: '2026-10-22',
        situacao: 'aberto',
        formaRecebimento: 'pix',
        nfeOrigem: 'NF-e 004.829'
      },
      {
        id: 'TIT-10493',
        numero: '0010493/01',
        tipo: 'receita',
        descricao: 'Serviço de Licenciamento & Suporte Mensal',
        entidade: 'TechSolutions Engenharia e Projetos',
        categoria: 'Serviços Prestados',
        contaBancaria: 'Banco do Brasil (Ag 1289 / C/C 48201-9)',
        valor: 4200.00,
        saldoAberto: 4200.00,
        dataEmissao: '2026-10-10',
        dataVencimento: '2026-10-25',
        situacao: 'aberto',
        formaRecebimento: 'boleto',
        nfeOrigem: 'NFS-e 001.204'
      },
      {
        id: 'TIT-10494',
        numero: '0010494/01',
        tipo: 'receita',
        descricao: 'Faturamento de Peças e Insumos Eletrônicos',
        entidade: 'Varejo & Automação Paulista S.A.',
        categoria: 'Vendas de Mercadorias',
        contaBancaria: 'Itaú Unibanco (Ag 0482 / C/C 29402-1)',
        valor: 12890.50,
        saldoAberto: 0.00,
        dataEmissao: '2026-10-05',
        dataVencimento: '2026-10-18',
        dataPagamento: '2026-10-18',
        situacao: 'pago',
        formaRecebimento: 'pix',
        nfeOrigem: 'NF-e 004.830'
      },
      {
        id: 'TIT-10495',
        numero: '0010495/01',
        tipo: 'despesa',
        descricao: 'Fornecedor de Caixas e Embalagens Industriais',
        entidade: 'Papéis & Embalagens do Brasil Ltda',
        categoria: 'Custos com Embalagens e Insumos',
        contaBancaria: 'Itaú Unibanco (Ag 0482 / C/C 29402-1)',
        valor: 3120.00,
        saldoAberto: 3120.00,
        dataEmissao: '2026-10-08',
        dataVencimento: '2026-10-23',
        situacao: 'aberto',
        formaRecebimento: 'boleto',
        codigoBarras: '34191.79001 01043.510047 91020.150008 1 98820000312000'
      },
      {
        id: 'TIT-10496',
        numero: '0010496/01',
        tipo: 'despesa',
        descricao: 'Aluguel do Centro de Distribuição & Galpão',
        entidade: 'Administradora Imobiliária Paulista',
        categoria: 'Despesas com Ocupação e Imóvel',
        contaBancaria: 'Banco do Brasil (Ag 1289 / C/C 48201-9)',
        valor: 4500.00,
        saldoAberto: 0.00,
        dataEmissao: '2026-10-01',
        dataVencimento: '2026-10-20',
        dataPagamento: '2026-10-19',
        situacao: 'pago',
        formaRecebimento: 'ted'
      },
      {
        id: 'TIT-10497',
        numero: '0010497/01',
        tipo: 'despesa',
        descricao: 'Conta de Energia Elétrica e Conectividade Fibra',
        entidade: 'Concessionária Estadual de Energia S.A.',
        categoria: 'Utilidades e Telecomunicações',
        contaBancaria: 'Itaú Unibanco (Ag 0482 / C/C 29402-1)',
        valor: 890.00,
        saldoAberto: 890.00,
        dataEmissao: '2026-10-02',
        dataVencimento: '2026-10-21',
        situacao: 'vencido',
        formaRecebimento: 'boleto',
        codigoBarras: '83620.00000 89000.010200 48201.000293 8 00000000089000'
      },
      {
        id: 'TIT-10498',
        numero: '0010498/01',
        tipo: 'receita',
        descricao: 'Faturamento Atacado - Pedido #4829',
        entidade: 'Comércio Varejista do Nordeste Ltda',
        categoria: 'Vendas de Mercadorias',
        contaBancaria: 'NuBank PJ (Ag 0001 / C/C 91823-4)',
        valor: 15300.00,
        saldoAberto: 15300.00,
        dataEmissao: '2026-10-16',
        dataVencimento: '2026-10-29',
        situacao: 'aberto',
        formaRecebimento: 'pix',
        nfeOrigem: 'NF-e 004.835'
      }
    ];
  });

  // Salva títulos persistidos sempre que houver alteração
  useEffect(() => {
    try {
      localStorage.setItem(storageTitulosKey, JSON.stringify(titulos));
    } catch {
      // Ignore
    }
  }, [titulos, storageTitulosKey]);

  // Contas Bancárias Cadastradas
  const [contasBancarias] = useState<ContaBancaria[]>(() => {
    try {
      const saved = localStorage.getItem(storageContasKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      { banco: 'Itaú Unibanco', ag: '0482', cc: '29402-1', saldo: 34150.80, cor: 'border-amber-500' },
      { banco: 'Banco do Brasil', ag: '1289', cc: '48201-9', saldo: 18420.00, cor: 'border-blue-600' },
      { banco: 'NuBank PJ', ag: '0001', cc: '91823-4', saldo: 12890.00, cor: 'border-purple-600' },
      { banco: 'Caixa Física (Gaveta)', ag: 'Sede', cc: '001', saldo: 1520.50, cor: 'border-emerald-600' }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageContasKey, JSON.stringify(contasBancarias));
    } catch {
      // Ignore
    }
  }, [contasBancarias, storageContasKey]);

  const saldoTotalBancos = contasBancarias.reduce((acc: number, c: ContaBancaria) => acc + c.saldo, 0);

  // Cálculos de Somatório de Títulos
  const titulosFiltrados = titulos.filter(t => {
    // Filtro por tipo conforme submenu ativo
    if (activeSubMenu === 'receber' && t.tipo !== 'receita') return false;
    if (activeSubMenu === 'pagar' && t.tipo !== 'despesa') return false;
    
    // Filtro de Situação
    if (filtroSituacao !== 'todos' && t.situacao !== filtroSituacao) return false;

    // Busca textual
    if (termoBusca) {
      const termo = termoBusca.toLowerCase();
      return (
        t.descricao.toLowerCase().includes(termo) ||
        t.entidade.toLowerCase().includes(termo) ||
        t.numero.toLowerCase().includes(termo) ||
        t.categoria.toLowerCase().includes(termo)
      );
    }
    return true;
  });

  const totalAberto = titulosFiltrados
    .filter(t => t.situacao === 'aberto' || t.situacao === 'vencido')
    .reduce((acc, t) => acc + t.saldoAberto, 0);

  const totalPago = titulosFiltrados
    .filter(t => t.situacao === 'pago')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalVencido = titulosFiltrados
    .filter(t => t.situacao === 'vencido')
    .reduce((acc, t) => acc + t.saldoAberto, 0);

  const totalGeral = titulosFiltrados.reduce((acc, t) => acc + t.valor, 0);

  // Ações em Lote e Individuais
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(titulosFiltrados.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBaixarTitulo = (id: string) => {
    setTitulos(prev => prev.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          situacao: 'pago', 
          saldoAberto: 0, 
          dataPagamento: new Date().toISOString().split('T')[0] 
        };
      }
      return t;
    }));
  };

  const handleBaixarEmLote = () => {
    if (selectedIds.length === 0) return;
    setTitulos(prev => prev.map(t => {
      if (selectedIds.includes(t.id)) {
        return { 
          ...t, 
          situacao: 'pago', 
          saldoAberto: 0, 
          dataPagamento: new Date().toISOString().split('T')[0] 
        };
      }
      return t;
    }));
    setSelectedIds([]);
  };

  const handleCobrarWhatsAppPix = (titulo: TituloFinanceiro) => {
    setPixSentId(titulo.id);
    const msg = `Prezado(a) ${titulo.entidade},\n\nSegue cobrança da fatura ${titulo.numero} (${titulo.descricao}) no valor de R$ ${titulo.valor.toFixed(2)} com vencimento em ${titulo.dataVencimento}.\n\nChave PIX Copia e Cola: 00020126580014br.gov.bcb.pix0136domus-financeiro@pix.com.br\n\nObrigado pela preferência!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    setTimeout(() => setPixSentId(null), 3000);
  };

  const handleExcluirTitulo = (id: string) => {
    if (confirm('Deseja realmente excluir este lançamento financeiro?')) {
      setTitulos(prev => prev.filter(t => t.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleSalvarNovoTitulo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoEntidade.trim() || !novoDescricao.trim() || !novoValor) return;

    const val = parseFloat(novoValor) || 0;
    const nextSeq = titulos.length + 1;
    const padSeq = nextSeq < 10 ? `001049${nextSeq}` : `00105${nextSeq}`;

    const novo: TituloFinanceiro = {
      id: `TIT-${Date.now().toString().slice(-6)}`,
      numero: `${padSeq}/01`,
      tipo: modalTituloTipo,
      descricao: novoDescricao.trim(),
      entidade: novoEntidade.trim(),
      categoria: novoCategoria || (modalTituloTipo === 'receita' ? 'Vendas de Mercadorias' : 'Despesas Operacionais'),
      contaBancaria: novoConta,
      valor: val,
      saldoAberto: val,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: novoVencimento || new Date().toISOString().split('T')[0],
      situacao: 'aberto',
      formaRecebimento: novoForma
    };

    setTitulos(prev => [novo, ...prev]);
    setShowNovoTituloModal(false);

    // Limpa campos
    setNovoEntidade('');
    setNovoDescricao('');
    setNovoValor('');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#2C3E50] flex flex-col font-sans select-none">
      
      {/* Barra de Notificação Superior com Oferta de Licença Vitalícia */}
      {/* Barra de Notificação Superior com Oferta de Licença Vitalícia */}
      <div className="bg-[#17323D] text-white px-4 py-1.5 text-xs flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="bg-[#C5A880] text-[#17323D] font-black px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
            Domus Finanças ERP
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Sistema Financeiro Operacional Completo • Opção de Assinatura Mensal ou <strong>Licença Vitalícia (Sem Mensalidades)</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="bg-[#C5A880] hover:bg-[#b5966e] text-[#17323D] text-[11px] font-black px-3 py-1 rounded shadow-sm flex items-center gap-1 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Comprar Licença Vitalícia (R$ 697)
          </button>
        </div>
      </div>

      {/* Topbar Oficial Domus Finanças */}
      <header className="h-14 bg-white border-b border-[#DCE2E6] flex items-center justify-between px-4 sticky top-0 z-30 shadow-xs">
        {/* Lado Esquerdo: Logo e Seletor de Empresa */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            title="Recolher / Expandir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Domus Finanças */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveModule('dashboard')}>
            <div className="w-7 h-7 rounded-lg bg-[#17323D] flex items-center justify-center text-[#C5A880] font-black text-sm shadow-xs border border-[#C5A880]/30">
              <Landmark className="w-4 h-4 text-[#C5A880]" />
            </div>
            <div className="flex items-baseline">
              <span className="font-serif font-black text-lg tracking-tight text-[#17323D]">Domus</span>
              <span className="font-sans font-bold text-lg text-[#C5A880] ml-1">Finanças</span>
              <span className="text-[10px] font-bold uppercase text-slate-400 ml-1.5 tracking-wider hidden md:inline">
                ERP Pro
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* Dropdown de Empresa / Filial */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-900">Distribuidora Central Matriz SP</span>
            <span className="text-[10px] text-slate-400">(12.345.678/0001-90)</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
          </div>
        </div>

        {/* Centro: Barra de Busca Global */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar em pedidos, cadastros, títulos, notas... [Ctrl + K]"
              className="w-full pl-9 pr-4 py-1.5 bg-[#F4F6F8] border border-slate-200 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#17323D] text-slate-800"
            />
          </div>
        </div>

        {/* Lado Direito: Ações Rápidas, Saldo e Perfil */}
        <div className="flex items-center gap-3">
          {/* Botão + Incluir Título Domus Petróleo */}
          <div className="relative">
            <button
              onClick={() => {
                setModalTituloTipo('receita');
                setShowNovoTituloModal(true);
              }}
              className="bg-[#17323D] hover:bg-[#244754] text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-[#C5A880]" />
              <span>Incluir Título</span>
            </button>
          </div>

          {/* Saldo Consolidado em Destaque */}
          <div className="hidden sm:block text-right px-2">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Saldo Disponível</div>
            <div className="text-xs font-black text-[#17323D]">
              R$ {saldoTotalBancos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Ícones de Alertas e Notificações */}
          <button className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1"></span>
          </button>

          {/* Botão Suíte Unificada Domus */}
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Acessar o Painel Unificado com todos os sistemas"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Suíte Unificada</span>
          </button>

          {/* Perfil do Usuário */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-[#17323D] text-[#C5A880] text-xs font-bold flex items-center justify-center border border-[#C5A880]/30">
              {profile?.full_name?.charAt(0).toUpperCase() || 'DF'}
            </div>
            <div className="hidden xl:block text-left text-xs leading-none">
              <div className="font-bold text-slate-800">{profile?.full_name || 'Admin Financeiro'}</div>
              <span className="text-[10px] text-slate-400 capitalize">{organization?.name || 'Diretoria Executiva'}</span>
            </div>
          </div>

          {/* Botão Sair / Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs ml-1"
            title="Sair do sistema e encerrar sessão"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Estrutura Central: Sidebar + Área de Trabalho */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Lateral Domus Finanças (Petróleo Escuro #17323D) */}
        <aside className={`${sidebarCollapsed ? 'w-14' : 'w-56'} bg-[#17323D] text-slate-200 flex flex-col shrink-0 transition-all duration-200 border-r border-[#10242D] select-none`}>
          <div className="flex-1 py-3 space-y-1 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'Início', icon: BarChart3 },
              { id: 'cadastros', label: 'Cadastros', icon: Users },
              { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
              { id: 'suprimentos', label: 'Suprimentos', icon: Package },
              { id: 'financas', label: 'Finanças', icon: Wallet, highlight: true },
              { id: 'nfe', label: 'Notas Fiscais', icon: Receipt },
              { id: 'config', label: 'Preferências', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium transition-colors relative ${
                    isActive 
                      ? 'bg-white/10 text-white font-bold' 
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#C5A880]' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {item.highlight && !sidebarCollapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C5A880]"></span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C5A880]"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Rodapé da Sidebar: Status da Licença */}
          {!sidebarCollapsed && (
            <div className="p-3 bg-[#0E1F26] border-t border-white/10 text-[11px] space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>Licença Domus</span>
                <span className="text-[#C5A880] font-bold">Vitalícia</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#C5A880] h-full w-full"></div>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">Uso ilimitado sem cobrança de mensalidades</p>
            </div>
          )}

          {/* Ações de Saída e Suíte Unificada */}
          <div className="p-2 border-t border-white/10 space-y-1 bg-[#10242D]">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Voltar para a Suíte Unificada Domus"
            >
              <LayoutGrid className="w-4 h-4 text-[#C5A880] shrink-0" />
              {!sidebarCollapsed && <span>Suíte Unificada</span>}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600/30 rounded transition-colors"
              title="Sair do sistema e encerrar sessão"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              {!sidebarCollapsed && <span>Sair do Sistema</span>}
            </button>
          </div>
        </aside>

        {/* Área de Trabalho Principal */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          
          {/* Submenu Superior de Finanças */}
          <div className="bg-white border-b border-[#DCE2E6] px-6 flex items-center gap-6 overflow-x-auto">
            {[
              { id: 'receber', label: 'Contas a Receber' },
              { id: 'pagar', label: 'Contas a Pagar' },
              { id: 'fluxo_caixa', label: 'Fluxo de Caixa' },
              { id: 'bancos', label: 'Caixas e Bancos' },
              { id: 'conciliacao_ofx', label: 'Conciliação Bancária (OFX)' },
              { id: 'dre', label: 'DRE Gerencial' }
            ].map(sub => {
              const isActive = activeSubMenu === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubMenu(sub.id as any)}
                  className={`py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    isActive 
                      ? 'border-[#17323D] text-[#17323D]' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>

          {/* Conteúdo Específico de cada Submenu */}
          <div className="flex-1 p-6 space-y-4">
            
            {/* ================= ABA: CONTAS A RECEBER OU CONTAS A PAGAR ================= */}
            {(activeSubMenu === 'receber' || activeSubMenu === 'pagar') && (
              <div className="space-y-4">
                
                {/* Cabeçalho da Tela: Título e Botões de Importar/Exportar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {activeSubMenu === 'receber' ? 'Contas a Receber' : 'Contas a Pagar'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {activeSubMenu === 'receber' 
                        ? 'Gestão de faturamento, liquidações, emissão de boletos bancários e cobranças PIX'
                        : 'Controle de compromissos com fornecedores, notas fiscais de entrada e títulos a liquidar'
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveSubMenu('conciliacao_ofx')}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      Importar Extrato OFX
                    </button>
                    <button 
                      onClick={() => {
                        setModalTituloTipo(activeSubMenu === 'receber' ? 'receita' : 'despesa');
                        setShowNovoTituloModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#17323D] hover:bg-[#244754] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                      {activeSubMenu === 'receber' ? '+ Nova Conta a Receber' : '+ Nova Conta a Pagar'}
                    </button>
                  </div>
                </div>

                {/* Filtros em Linha estilo Domus Finanças ERP */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  {/* Filtro por Situação (Chips) */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400 font-semibold mr-1">Situação:</span>
                    {[
                      { id: 'todos', label: 'Todas' },
                      { id: 'aberto', label: 'Em Aberto' },
                      { id: 'vencido', label: 'Vencidas' },
                      { id: 'pago', label: 'Liquidadas' }
                    ].map(sit => (
                      <button
                        key={sit.id}
                        onClick={() => setFiltroSituacao(sit.id as any)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          filtroSituacao === sit.id
                            ? 'bg-[#17323D] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sit.label}
                      </button>
                    ))}
                  </div>

                  {/* Campo de Busca Rápida */}
                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <div className="relative w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar por cliente, título ou categoria..."
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#17323D]"
                      />
                    </div>
                  </div>
                </div>

                {/* Barra de Ações em Lote quando houver itens selecionados */}
                {selectedIds.length > 0 && (
                  <div className="bg-[#17323D] text-white px-4 py-2 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#C5A880] text-[#17323D] font-black px-1.5 py-0.5 rounded text-[10px]">
                        {selectedIds.length} selecionado(s)
                      </span>
                      <span>Selecione uma ação para executar em massa:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBaixarEmLote}
                        className="px-2.5 py-1 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Liquidar / Baixar em Lote
                      </button>
                      <button
                        onClick={() => setSelectedIds([])}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded"
                      >
                        Desmarcar Todos
                      </button>
                    </div>
                  </div>
                )}

                {/* Tabela Operacional Densa Domus Finanças ERP */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F9FA] text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">
                            <input
                              type="checkbox"
                              onChange={handleSelectAll}
                              checked={titulosFiltrados.length > 0 && selectedIds.length === titulosFiltrados.length}
                              className="rounded border-slate-300 text-[#17323D]"
                            />
                          </th>
                          <th className="py-2.5 px-3">Nº Título</th>
                          <th className="py-2.5 px-3">Vencimento</th>
                          <th className="py-2.5 px-3">Situação</th>
                          <th className="py-2.5 px-3">{activeSubMenu === 'receber' ? 'Cliente / Sacado' : 'Fornecedor'}</th>
                          <th className="py-2.5 px-3">Histórico / Descrição</th>
                          <th className="py-2.5 px-3">Categoria</th>
                          <th className="py-2.5 px-3 text-right">Valor Título</th>
                          <th className="py-2.5 px-3 text-right">Saldo Aberto</th>
                          <th className="py-2.5 px-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {titulosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-slate-400">
                              Nenhum título encontrado para os filtros selecionados.
                            </td>
                          </tr>
                        ) : (
                          titulosFiltrados.map(item => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                              <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}>
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelect(item.id)}
                                    className="rounded border-slate-300 text-[#17323D]"
                                  />
                                </td>
                                <td className="py-2 px-3 font-mono font-medium text-slate-700">
                                  {item.numero}
                                  {item.nfeOrigem && (
                                    <div className="text-[10px] text-slate-400">{item.nfeOrigem}</div>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-800">
                                  {item.dataVencimento}
                                </td>
                                <td className="py-2 px-3">
                                  {item.situacao === 'pago' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      Liquidado
                                    </span>
                                  ) : item.situacao === 'vencido' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                      Vencido
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                      Em Aberto
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-bold text-slate-900 max-w-xs truncate">
                                  {item.entidade}
                                </td>
                                <td className="py-2 px-3 text-slate-600 max-w-xs truncate">
                                  {item.descricao}
                                </td>
                                <td className="py-2 px-3 text-slate-500 text-[11px]">
                                  {item.categoria}
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900">
                                  R$ {item.valor.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right font-black text-slate-900">
                                  {item.saldoAberto > 0 ? (
                                    <span className={activeSubMenu === 'receber' ? 'text-emerald-700' : 'text-rose-700'}>
                                      R$ {item.saldoAberto.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">R$ 0,00</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {item.situacao !== 'pago' ? (
                                      <>
                                        {activeSubMenu === 'receber' && (
                                          <button
                                            onClick={() => handleCobrarWhatsAppPix(item)}
                                            className={`p-1 rounded text-xs font-bold flex items-center gap-1 ${
                                              pixSentId === item.id 
                                                ? 'bg-emerald-600 text-white' 
                                                : 'text-emerald-700 hover:bg-emerald-50'
                                            }`}
                                            title="Enviar Cobrança com PIX no WhatsApp do Cliente"
                                          >
                                            <Send className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleBaixarTitulo(item.id)}
                                          className="px-2 py-0.5 bg-[#17323D] hover:bg-[#244754] text-white text-[11px] font-bold rounded"
                                          title="Dar baixa no título"
                                        >
                                          Baixar
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">
                                        Pago em {item.dataPagamento}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleExcluirTitulo(item.id)}
                                      className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                                      title="Excluir Lançamento"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Barra de Rodapé com Somatórios Oficiais */}
                  <div className="bg-[#F8F9FA] px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-4 text-slate-600">
                      <span>Exibindo <strong>{titulosFiltrados.length}</strong> lançamentos</span>
                      {selectedIds.length > 0 && (
                        <span className="text-[#17323D] font-bold">
                          Total Selecionado: R$ {titulosFiltrados.filter(t => selectedIds.includes(t.id)).reduce((acc, t) => acc + t.valor, 0).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-slate-400 mr-1.5">Total Vencido:</span>
                        <strong className="text-rose-600">R$ {totalVencido.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 mr-1.5">Total em Aberto:</span>
                        <strong className="text-amber-600">R$ {totalAberto.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 mr-1.5">Total Liquidado:</span>
                        <strong className="text-emerald-600">R$ {totalPago.toFixed(2)}</strong>
                      </div>
                      <div className="pl-4 border-l border-slate-200 font-bold text-slate-900">
                        <span className="text-slate-500 mr-1.5">Total Geral:</span>
                        <span className="text-sm">R$ {totalGeral.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= ABA: FLUXO DE CAIXA ================= */}
            {activeSubMenu === 'fluxo_caixa' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Fluxo de Caixa Diário e Projetado</h2>
                    <p className="text-xs text-slate-500">Acompanhe a curva de saldo financeiro, antecipe necessidades de capital de giro e evite furos de caixa.</p>
                  </div>
                  <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    Exportar Relatório Excel
                  </button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#17323D] text-white font-bold">
                      <tr>
                        <th className="py-2.5 px-4">Data</th>
                        <th className="py-2.5 px-4 text-right">Saldo Inicial (R$)</th>
                        <th className="py-2.5 px-4 text-right text-emerald-400">Entradas Previstas (+)</th>
                        <th className="py-2.5 px-4 text-right text-rose-300">Saídas Previstas (-)</th>
                        <th className="py-2.5 px-4 text-right">Resultado do Dia</th>
                        <th className="py-2.5 px-4 text-right">Saldo Final Projetado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { data: '22/10/2026 (Hoje)', saldoIni: 66981.30, in: 8450.00, out: 890.00, final: 74541.30 },
                        { data: '23/10/2026', saldoIni: 74541.30, in: 0.00, out: 3120.00, final: 71421.30 },
                        { data: '24/10/2026', saldoIni: 71421.30, in: 4200.00, out: 0.00, final: 75621.30 },
                        { data: '25/10/2026', saldoIni: 75621.30, in: 0.00, out: 0.00, final: 75621.30 },
                        { data: '26/10/2026', saldoIni: 75621.30, in: 12500.00, out: 1400.00, final: 86721.30 },
                        { data: '27/10/2026', saldoIni: 86721.30, in: 0.00, out: 450.00, final: 86271.30 },
                        { data: '28/10/2026', saldoIni: 86271.30, in: 15300.00, out: 2100.00, final: 99471.30 }
                      ].map((row, idx) => (
                        <tr key={idx} className={idx === 0 ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50'}>
                          <td className="py-2.5 px-4 text-slate-800">{row.data}</td>
                          <td className="py-2.5 px-4 text-right text-slate-600 font-mono">R$ {row.saldoIni.toFixed(2)}</td>
                          <td className="py-2.5 px-4 text-right text-emerald-600 font-mono font-bold">+ R$ {row.in.toFixed(2)}</td>
                          <td className="py-2.5 px-4 text-right text-rose-600 font-mono font-bold">- R$ {row.out.toFixed(2)}</td>
                          <td className={`py-2.5 px-4 text-right font-mono font-bold ${row.in - row.out >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            R$ {(row.in - row.out).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                            R$ {row.final.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= ABA: CAIXAS E BANCOS ================= */}
            {activeSubMenu === 'bancos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Caixas e Contas Bancárias</h2>
                    <p className="text-xs text-slate-500">Posição consolidada e saldos em tempo real por instituição financeira cadastrada.</p>
                  </div>
                  <button className="px-3 py-1.5 bg-[#17323D] hover:bg-[#244754] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                    Adicionar Conta Bancária
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {contasBancarias.map((conta, idx) => (
                    <div key={idx} className={`bg-white p-4 rounded-lg border-l-4 ${conta.cor} border border-slate-200 shadow-xs space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{conta.banco}</span>
                        <Building2 className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Agência: {conta.ag} • Conta: {conta.cc}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Atual:</span>
                        <span className="text-base font-black text-[#17323D]">
                          R$ {conta.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= ABA: CONCILIAÇÃO BANCÁRIA (OFX) ================= */}
            {activeSubMenu === 'conciliacao_ofx' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Conciliação Bancária OFX</h2>
                  <p className="text-xs text-slate-500">
                    Importe o extrato padrão .OFX gerado pelo seu banco e concilie automaticamente com os lançamentos de contas a pagar e receber do sistema.
                  </p>
                </div>

                {/* Área de Upload OFX */}
                <div className="p-8 bg-white border-2 border-dashed border-slate-300 rounded-lg text-center space-y-3 hover:border-[#17323D] transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-[#17323D]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Clique para carregar ou arraste seu arquivo .OFX</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Suporta Itaú, Bradesco, Banco do Brasil, Santander, NuBank, Caixa e Inter</div>
                  </div>
                  <button
                    onClick={() => setOfxFileLoaded(true)}
                    className="px-4 py-1.5 bg-[#17323D] hover:bg-[#244754] text-white text-xs font-bold rounded shadow-xs"
                  >
                    {ofxFileLoaded ? 'Extrato Carregado: extrato_itau_outubro.ofx (3 transações)' : 'Simular Leitura de Arquivo .OFX'}
                  </button>
                </div>

                {/* Grade de Conciliação Cruzada */}
                {ofxFileLoaded && (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Transações do Extrato Cruzadas com o Sistema
                      </span>
                      <span className="text-xs text-slate-500">{ofxReconciledIds.length}/2 conciliados</span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-emerald-50/60 rounded border border-emerald-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">Match 100%</span>
                            <span>PIX RECEBIDO - DISTRIBUIDORA COMERCIAL ALPHA</span>
                          </div>
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            Extrato: R$ 8.450,00 em 22/10 | ERP: Título TIT-10492 (R$ 8.450,00)
                          </div>
                        </div>
                        <button
                          onClick={() => setOfxReconciledIds(prev => [...prev, '1'])}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs"
                        >
                          {ofxReconciledIds.includes('1') ? '✓ Conciliado' : 'Conciliar 1-Clique'}
                        </button>
                      </div>

                      <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-bold">Match por Valor</span>
                            <span>PAGTO ELETRONICO - PAPEIS & EMBALAGENS BRASIL</span>
                          </div>
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            Extrato: - R$ 3.120,00 em 22/10 | ERP: Título TIT-10495 (R$ 3.120,00)
                          </div>
                        </div>
                        <button
                          onClick={() => setOfxReconciledIds(prev => [...prev, '2'])}
                          className="px-3 py-1 bg-[#17323D] hover:bg-[#244754] text-white font-bold rounded text-xs"
                        >
                          {ofxReconciledIds.includes('2') ? '✓ Conciliado' : 'Conciliar 1-Clique'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= ABA: DRE GERENCIAL ================= */}
            {activeSubMenu === 'dre' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">DRE - Demonstrativo de Resultados do Exercício</h2>
                    <p className="text-xs text-slate-500">Visão oficial contábil e gerencial com regime de competência, margens operacionais e lucro líquido.</p>
                  </div>
                  <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    Exportar DRE Contábil
                  </button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3 text-xs shadow-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-200 font-bold text-slate-900 text-sm">
                    <span>(+) RECEITA OPERACIONAL BRUTA</span>
                    <span className="text-emerald-700 font-black">R$ 40.840,50</span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-slate-600 pl-4">
                    <span>(-) Deduções da Receita Bruta (Simples Nacional 6%)</span>
                    <span className="text-rose-600">- R$ 2.450,43</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-slate-200 font-bold text-slate-800">
                    <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
                    <span>R$ 38.390,07</span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-slate-600 pl-4">
                    <span>(-) Custos das Mercadorias Vendidas (CMV) & Insumos</span>
                    <span className="text-rose-600">- R$ 8.240,00</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-slate-200 font-bold text-slate-800">
                    <span>(=) LUCRO BRUTO (Margem Bruta: 78.5%)</span>
                    <span className="text-emerald-700 font-bold">R$ 30.150,07</span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-slate-600 pl-4">
                    <span>(-) Despesas Administrativas & Ocupação</span>
                    <span className="text-rose-600">- R$ 5.390,00</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-slate-600 pl-4">
                    <span>(-) Despesas com Vendas & Logística</span>
                    <span className="text-rose-600">- R$ 2.150,00</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-slate-600 pl-4">
                    <span>(-) Despesas com Pessoal & Pró-Labore</span>
                    <span className="text-rose-600">- R$ 8.500,00</span>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between font-black text-emerald-950 text-sm mt-4">
                    <div>
                      <div>(=) LUCRO LÍQUIDO DO PERÍODO</div>
                      <div className="text-[11px] font-normal text-emerald-800">Margem Líquida Real: 36,7%</div>
                    </div>
                    <div className="text-lg text-emerald-700 font-black">
                      R$ 14.110,07
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Inclusão de Título Oficial estilo Domus Finanças ERP */}
      {showNovoTituloModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-2xl border border-slate-300 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#C5A880]" />
                  {modalTituloTipo === 'receita' ? 'Incluir Conta a Receber' : 'Incluir Conta a Pagar'}
                </h3>
                <p className="text-[11px] text-slate-500">Lançamento oficial no plano de contas da empresa</p>
              </div>
              <button 
                onClick={() => setShowNovoTituloModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModalTituloTipo('receita')}
                className={`p-2 rounded text-xs font-bold border transition-colors ${
                  modalTituloTipo === 'receita' ? 'bg-[#17323D] text-white border-[#17323D]' : 'bg-slate-50 text-slate-700'
                }`}
              >
                + Receita (A Receber)
              </button>
              <button
                type="button"
                onClick={() => setModalTituloTipo('despesa')}
                className={`p-2 rounded text-xs font-bold border transition-colors ${
                  modalTituloTipo === 'despesa' ? 'bg-rose-700 text-white border-rose-700' : 'bg-slate-50 text-slate-700'
                }`}
              >
                - Despesa (A Pagar)
              </button>
            </div>

            <form onSubmit={handleSalvarNovoTitulo}>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {modalTituloTipo === 'receita' ? 'Cliente / Sacado *' : 'Fornecedor *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={novoEntidade}
                    onChange={(e) => setNovoEntidade(e.target.value)}
                    placeholder="Nome ou Razão Social"
                    className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-[#17323D]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Histórico / Descrição *</label>
                  <input
                    type="text"
                    required
                    value={novoDescricao}
                    onChange={(e) => setNovoDescricao(e.target.value)}
                    placeholder="Ex: Fatura referente a vendas do pedido #4890"
                    className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-[#17323D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Valor do Título (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={novoValor}
                      onChange={(e) => setNovoValor(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-[#17323D] font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Data de Vencimento *</label>
                    <input
                      type="date"
                      required
                      value={novoVencimento}
                      onChange={(e) => setNovoVencimento(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-[#17323D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Conta Bancária</label>
                    <select 
                      value={novoConta}
                      onChange={(e) => setNovoConta(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none bg-white"
                    >
                      {contasBancarias.map((cb, idx) => (
                        <option key={idx} value={`${cb.banco} (Ag ${cb.ag} / C/C ${cb.cc})`}>
                          {cb.banco} (Ag {cb.ag} / C/C {cb.cc})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Forma de Cobrança / Pagto</label>
                    <select 
                      value={novoForma}
                      onChange={(e) => setNovoForma(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none bg-white"
                    >
                      <option value="pix">PIX (Chave & QR Code Dinâmico)</option>
                      <option value="boleto">Boleto Bancário</option>
                      <option value="cartao">Cartão de Crédito</option>
                      <option value="ted">TED / Transferência</option>
                      <option value="dinheiro">Dinheiro em Espécie</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoria Contábil</label>
                  <select
                    value={novoCategoria}
                    onChange={(e) => setNovoCategoria(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none bg-white"
                  >
                    <option value="Vendas de Mercadorias">Vendas de Mercadorias</option>
                    <option value="Serviços Prestados">Serviços Prestados</option>
                    <option value="Custos Operacionais">Custos Operacionais</option>
                    <option value="Utilidades e Telecomunicações">Utilidades e Telecomunicações</option>
                    <option value="Despesas com Ocupação e Imóvel">Despesas com Ocupação e Imóvel</option>
                    <option value="Outras Receitas/Despesas">Outras Receitas/Despesas</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowNovoTituloModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#17323D] hover:bg-[#244754] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Checkout / Venda do Domus Finanças ERP (Mensal ou Licença Vitalícia) */}
      <FinanceiroCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        defaultPlan="vitalicio"
      />
    </div>
  );
};
