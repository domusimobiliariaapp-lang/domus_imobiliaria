import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Building2, User, Phone, Mail, FileText, X, Trash2, Edit, MessageCircle, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/solar/components/layout/AppLayout';
import { clientService, Client, CreateClientData } from '@/solar/services/clientService';
import { projectService, Project } from '@/solar/services/projectService';
import { quoteService, Quote } from '@/solar/services/quoteService';
import { serviceOrderService, ServiceOrder } from '@/solar/services/serviceOrderService';
import { supabase } from '@/solar/services/solarSupabaseClient';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePagination } from '@/solar/hooks/use-pagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { ClientDetailSheet } from '@/solar/components/clients/ClientDetailSheet';
import { Badge } from '@/components/ui/badge';
import { maskCPF, maskCNPJ, maskPhone, maskCEP } from '@/solar/utils/masks';

interface ClientWithExtras extends Client {
  projects_count?: number;
  quotes_count?: number;
  service_orders_count?: number;
  cpf_rg_url?: string;
  electricity_bills?: any[];
}

export default function Clients() {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<ClientWithExtras[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithExtras | null>(null);
  const [editingClient, setEditingClient] = useState<CreateClientData | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'CPF' | 'CNPJ'>('all');
  const [clientToDelete, setClientToDelete] = useState<ClientWithExtras | null>(null);

  const canDelete = hasRole(['MASTER', 'DEV']);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, projectsData, quotesData, serviceOrdersData] = await Promise.all([
        clientService.getAll(),
        projectService.getAll(),
        quoteService.getAll(),
        serviceOrderService.getAll(),
      ]);
      
      // Count projects, quotes and service orders per client
      const clientsWithCounts = clientsData.map(client => ({
        ...client,
        projects_count: projectsData.filter(p => p.client_id === client.id).length,
        quotes_count: quotesData.filter(q => q.client_id === client.id).length,
        service_orders_count: serviceOrdersData.filter(so => so.client_id === client.id).length,
      }));
      
      setClients(clientsWithCounts as ClientWithExtras[]);
      setProjects(projectsData);
      setQuotes(quotesData);
      setServiceOrders(serviceOrdersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (client?: ClientWithExtras) => {
    if (client) {
      setEditingClient({
        name: client.name,
        email: client.email,
        phone: client.phone,
        document: client.document,
        document_type: client.document_type,
        street: client.street,
        number: client.number,
        complement: client.complement,
        neighborhood: client.neighborhood,
        city: client.city,
        state: client.state,
        zip_code: client.zip_code,
      });
      setSelectedClient(client);
    } else {
      setEditingClient({
        name: '',
        email: '',
        phone: '',
        document: '',
        document_type: 'CPF',
      });
      setSelectedClient(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setSelectedClient(null);
  };

  const handleOpenClientDetail = (client: ClientWithExtras) => {
    setSelectedClient(client);
    setShowDetailSheet(true);
  };

  const handleSaveClient = async () => {
    if (!editingClient) return;

    try {
      if (selectedClient) {
        await clientService.update(selectedClient.id, editingClient);
        await auditLogService.log('UPDATE', 'CLIENT', selectedClient.id, editingClient.name);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        const newClient = await clientService.create(editingClient);
        await auditLogService.log('CREATE', 'CLIENT', newClient.id, editingClient.name);
        toast.success('Cliente criado com sucesso!');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      await clientService.delete(clientToDelete.id);
      await auditLogService.log('DELETE', 'CLIENT', clientToDelete.id, clientToDelete.name);
      toast.success('Cliente excluído com sucesso!');
      setClientToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleWhatsApp = (client: ClientWithExtras) => {
    const phone = client.phone.replace(/\D/g, '');
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;
    const message = encodeURIComponent(`Olá ${client.name}, tudo bem?`);
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  const handleSearchCNPJ = async (cnpjValue?: string) => {
    const val = cnpjValue || editingClient?.document;
    if (!val) return;
    const cleanCNPJ = val.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return;
    
    try {
      const data = await clientService.searchCNPJ(cleanCNPJ);
      setEditingClient((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          name: data.razao_social || data.nome_fantasia || prev.name,
          email: data.email || prev.email,
          phone: data.ddd_telefone_1 ? maskPhone(data.ddd_telefone_1) : prev.phone,
          street: data.logradouro || prev.street,
          number: data.numero || prev.number,
          complement: data.complemento || prev.complement,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.municipio || prev.city,
          state: data.uf || prev.state,
          zip_code: data.cep ? maskCEP(data.cep) : prev.zip_code,
        };
      });
      toast.success('Dados da empresa preenchidos via Receita!');
    } catch (error) {
      console.warn('CNPJ não encontrado via API:', error);
    }
  };

  const handleSearchCEP = async (cepValue?: string) => {
    const val = cepValue || editingClient?.zip_code;
    if (!val) return;
    const cleanCEP = val.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;
    
    try {
      const data = await clientService.searchCEP(cleanCEP);
      setEditingClient((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        };
      });
      toast.success('Endereço preenchido via CEP!');
    } catch (error) {
      console.warn('CEP não encontrado via API:', error);
    }
  };

  // Upload is now handled by ClientDetailSheet component

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase()) ||
      client.document.includes(search);
    const matchesFilter = filterType === 'all' || client.document_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const {
    paginatedItems: paginatedClients,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
    resetPage,
  } = usePagination(filteredClients, { itemsPerPage: 15 });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [search, filterType]);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Clientes</h1>
          <p className="text-slate-400 mt-1">
            Gerencie sua base de clientes
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer text-sm"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          Novo Cliente
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou documento..."
            className="w-full pl-12 pr-4 py-3 bg-card rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilterType('all')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
              filterType === 'all' ? 'bg-secondary text-secondary-foreground' : 'bg-card border border-border hover:bg-muted'
            )}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterType('CPF')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
              filterType === 'CPF' ? 'bg-secondary text-secondary-foreground' : 'bg-card border border-border hover:bg-muted'
            )}
          >
            Pessoa Física
          </button>
          <button 
            onClick={() => setFilterType('CNPJ')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
              filterType === 'CNPJ' ? 'bg-secondary text-secondary-foreground' : 'bg-card border border-border hover:bg-muted'
            )}
          >
            Pessoa Jurídica
          </button>
        </div>
      </div>

      {/* Clients List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {paginatedClients.map((client, i) => (
              <div
                key={client.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer animate-fade-in"
                style={{ animationDelay: `${(i + 1) * 50}ms` }}
                onClick={() => handleOpenClientDetail(client)}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'p-2.5 rounded-xl flex-shrink-0',
                    client.document_type === 'CNPJ'
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {client.document_type === 'CNPJ' ? (
                    <Building2 className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>

                {/* Client Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {client.name}
                    </h3>
                    {client.cpf_rg_url && (
                      <FileText className="h-4 w-4 text-secondary flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="truncate">{client.document}</span>
                    <span className="hidden sm:inline truncate">{client.email}</span>
                    <span className="hidden md:inline">{client.phone}</span>
                  </div>
                </div>

                {/* Counts */}
                <div className="hidden sm:flex items-center gap-2">
                  {(client.quotes_count || 0) > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {client.quotes_count} orç.
                    </Badge>
                  )}
                  {(client.projects_count || 0) > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {client.projects_count} proj.
                    </Badge>
                  )}
                  {(client.service_orders_count || 0) > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {client.service_orders_count} OS
                    </Badge>
                  )}
                </div>

                {/* Location */}
                <div className="hidden lg:block text-sm text-muted-foreground min-w-[120px] text-right">
                  {client.city || 'N/A'}/{client.state || 'N/A'}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWhatsApp(client); }}>
                        <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                        WhatsApp
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); setClientToDelete(client); }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && filteredClients.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
        </div>
      )}

      {!isLoading && filteredClients.length > 0 && (
        <div className="mt-4">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
          />
        </div>
      )}

      {/* Client Detail Sheet */}
      <ClientDetailSheet
        client={selectedClient}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        projects={projects}
        quotes={quotes}
        serviceOrders={serviceOrders}
        onEdit={(client) => {
          setShowDetailSheet(false);
          handleOpenModal(client);
        }}
        onWhatsApp={handleWhatsApp}
        onRefresh={loadData}
      />

      {/* Client Modal (Create/Edit) */}
      {showModal && editingClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121724] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {selectedClient ? 'Editar Cliente' : 'Novo Cliente Solar'}
                  </h2>
                  <p className="text-xs text-slate-400">Preencha os dados cadastrais para propostas e homologações</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Document Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Tipo de Pessoa
                </label>
                <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 max-w-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const doc = maskCPF(editingClient.document);
                      setEditingClient({ ...editingClient, document_type: 'CPF', document: doc });
                    }}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center",
                      editingClient.document_type === 'CPF'
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                    Pessoa Física (CPF)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const doc = maskCNPJ(editingClient.document);
                      setEditingClient({ ...editingClient, document_type: 'CNPJ', document: doc });
                    }}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center",
                      editingClient.document_type === 'CNPJ'
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                    Pessoa Jurídica (CNPJ)
                  </button>
                </div>
              </div>

              {/* Document Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>{editingClient.document_type === 'CPF' ? 'CPF do Titular' : 'CNPJ da Empresa'}</span>
                  {editingClient.document_type === 'CNPJ' && (
                    <span className="text-[10px] text-amber-400 font-medium">Busca dados automática na Receita</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingClient.document}
                    onChange={(e) => {
                      const formatted = editingClient.document_type === 'CPF'
                        ? maskCPF(e.target.value)
                        : maskCNPJ(e.target.value);
                      setEditingClient({ ...editingClient, document: formatted });
                      if (editingClient.document_type === 'CNPJ') {
                        const raw = formatted.replace(/\D/g, '');
                        if (raw.length === 14) handleSearchCNPJ(raw);
                      }
                    }}
                    placeholder={editingClient.document_type === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                  />
                  {editingClient.document_type === 'CNPJ' && (
                    <button
                      type="button"
                      onClick={() => handleSearchCNPJ()}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs shadow-md shadow-amber-500/10 cursor-pointer"
                    >
                      <Search className="h-4 w-4" />
                      <span>Buscar CNPJ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  {editingClient.document_type === 'CNPJ' ? 'Razão Social / Nome Fantasia' : 'Nome Completo do Cliente'}
                </label>
                <input
                  type="text"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  placeholder="Ex: João da Silva ou Solar Tech Ltda"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              {/* Email & Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">E-mail</label>
                  <input
                    type="email"
                    value={editingClient.email}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: maskPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Endereço - CEP e Rua Sem Sobreposição */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                    <span>CEP</span>
                    <span className="text-[10px] text-amber-400 font-normal">Preenche automático</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={editingClient.zip_code || ''}
                      onChange={(e) => {
                        const formatted = maskCEP(e.target.value);
                        setEditingClient({ ...editingClient, zip_code: formatted });
                        const raw = formatted.replace(/\D/g, '');
                        if (raw.length === 8) handleSearchCEP(raw);
                      }}
                      placeholder="00000-000"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleSearchCEP()}
                      className="px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition-colors"
                      title="Buscar CEP"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-200">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={editingClient.street || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, street: e.target.value })}
                    placeholder="Rua, Avenida, Estrada..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              {/* Número, Bairro, Cidade, Estado */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">Número</label>
                  <input
                    type="text"
                    value={editingClient.number || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, number: e.target.value })}
                    placeholder="123"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">Bairro</label>
                  <input
                    type="text"
                    value={editingClient.neighborhood || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, neighborhood: e.target.value })}
                    placeholder="Bairro"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">Cidade</label>
                  <input
                    type="text"
                    value={editingClient.city || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, city: e.target.value })}
                    placeholder="Cidade"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={editingClient.state || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm uppercase text-center font-bold"
                  />
                </div>
              </div>

              {/* Documents info */}
              {selectedClient && (selectedClient.cpf_rg_url || (selectedClient.electricity_bills || []).length > 0) && (
                <div className="pt-3 border-t border-slate-800 space-y-1">
                  <p className="text-xs text-amber-400 font-medium">
                    ✓ Documentos e contas de energia anexados. Gerencie na aba de detalhes.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveClient}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clientToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
