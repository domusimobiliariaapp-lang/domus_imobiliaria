import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/solar/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle2, BarChart3, FileText } from 'lucide-react';
import { transactionService, Transaction, CreateTransactionData, TransactionType, TransactionStatus, FinancialSummary } from '@/solar/services/transactionService';
import { clientService } from '@/solar/services/clientService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CashFlowChart } from '@/solar/components/financial/CashFlowChart';

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  PAGO: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  ATRASADO: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  CANCELADO: 'bg-slate-700/40 text-slate-300 border border-slate-600',
};

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
  CANCELADO: 'Cancelado',
};

export default function Financial() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState('transacoes');
  const [formData, setFormData] = useState<CreateTransactionData>({
    type: 'RECEITA',
    status: 'PENDENTE',
    description: '',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    category: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', typeFilter, statusFilter],
    queryFn: () => transactionService.getAll({
      type: typeFilter !== 'all' ? typeFilter as TransactionType : undefined,
      status: statusFilter !== 'all' ? statusFilter as TransactionStatus : undefined,
    }),
  });

  const { data: summary } = useQuery<FinancialSummary>({
    queryKey: ['transactions-summary'],
    queryFn: transactionService.getSummary,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: transactionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
      toast.success('Transação criada com sucesso!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar transação');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) =>
      transactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
      toast.success('Transação atualizada com sucesso!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar transação');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: transactionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
      toast.success('Transação excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir transação');
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: transactionService.markAsPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
      toast.success('Transação marcada como paga!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao marcar como pago');
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'RECEITA',
      status: 'PENDENTE',
      description: '',
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      category: '',
      notes: '',
    });
    setEditingTransaction(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: Number(formData.amount) || 0,
      due_date: formData.due_date || new Date().toISOString().split('T')[0],
    };
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      amount: transaction.amount,
      due_date: transaction.due_date,
      category: transaction.category || '',
      client_id: transaction.client_id || undefined,
      notes: transaction.notes || '',
    });
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number | string | undefined | null) => {
    const val = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filteredTransactions = transactions.filter(transaction =>
    (transaction.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header com Ação Principal */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Financeiro Solar</h1>
            <p className="text-slate-400 mt-1">Controle de receitas, despesas e fluxo de caixa de usinas</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button onClick={resetForm} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer text-sm">
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Nova Transação
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-slate-950 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white text-lg font-bold">
                  {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: TransactionType) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="RECEITA">Receita</SelectItem>
                        <SelectItem value="DESPESA">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-300">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: TransactionStatus) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="PAGO">Pago</SelectItem>
                        <SelectItem value="ATRASADO">Atrasado</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-300">Descrição *</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                      placeholder="Ex: Recebimento Venda #VND-001"
                      className="bg-slate-900 border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Valor (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) || 0 }))}
                      required
                      placeholder="0,00"
                      className="bg-slate-900 border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Vencimento *</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      required
                      className="bg-slate-900 border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Categoria</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Ex: Equipamentos, Venda Solar"
                      className="bg-slate-900 border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Cliente</Label>
                    <Select
                      value={formData.client_id || 'none'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value === 'none' ? undefined : value }))}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="none">Nenhum</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-300">Observações</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Detalhes adicionais..."
                      className="bg-slate-900 border-slate-800 text-white resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="border-slate-800 text-slate-300 hover:bg-slate-900">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                    {editingTransaction ? 'Salvar Alterações' : 'Criar Transação'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900 border border-slate-800 p-1">
            <TabsTrigger value="transacoes" className="flex items-center gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950">
              <DollarSign className="h-4 w-4" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="fluxo" className="flex items-center gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950">
              <BarChart3 className="h-4 w-4" />
              Fluxo de Caixa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transacoes" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-slate-900/80 border-slate-800 border-l-4 border-l-emerald-500 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Receitas Pagas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary?.totalReceitas || 0)}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800 border-l-4 border-l-rose-500 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-rose-400" />
                    Despesas Pagas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-rose-400">{formatCurrency(summary?.totalDespesas || 0)}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800 border-l-4 border-l-amber-500 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-400" />
                    Saldo Operacional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${(summary?.saldo || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(summary?.saldo || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800 border-l-4 border-l-blue-500 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                    Valores Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <span className="text-emerald-400">+{formatCurrency(summary?.receitasPendentes || 0)}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-rose-400">-{formatCurrency(summary?.despesasPendentes || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="RECEITA">Receitas</SelectItem>
              <SelectItem value="DESPESA">Despesas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Carregando transações...</div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="py-16 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 font-medium">Nenhuma transação encontrada</p>
              <p className="text-slate-500 text-xs mt-1">Crie uma nova transação usando o botão superior.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900/60 border-slate-800 overflow-hidden shadow-xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-semibold">Descrição</TableHead>
                    <TableHead className="text-slate-400 font-semibold">Tipo</TableHead>
                    <TableHead className="text-slate-400 font-semibold">Status</TableHead>
                    <TableHead className="text-slate-400 font-semibold">Vencimento</TableHead>
                    <TableHead className="text-right text-slate-400 font-semibold">Valor</TableHead>
                    <TableHead className="text-right text-slate-400 font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const isReceita = (transaction.type || '').toUpperCase() === 'RECEITA';
                    const statusKey = (transaction.status || 'PENDENTE').toUpperCase();

                    return (
                      <TableRow key={transaction.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-white">{transaction.description || 'Sem descrição'}</p>
                            {transaction.category && (
                              <p className="text-xs text-slate-400 mt-0.5">{transaction.category}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            isReceita ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {isReceita ? 'Receita' : 'Despesa'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[statusKey] || STATUS_COLORS.PENDENTE}`}>
                            {STATUS_LABELS[statusKey] || statusKey}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {(() => {
                            const dateVal = transaction.due_date || (transaction as any).date;
                            if (!dateVal) return '-';
                            try {
                              const parsedDate = new Date(dateVal);
                              return isNaN(parsedDate.getTime()) ? '-' : format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
                            } catch {
                              return '-';
                            }
                          })()}
                        </TableCell>
                        <TableCell className={`text-right font-bold text-sm ${isReceita ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isReceita ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {statusKey === 'PENDENTE' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsPaidMutation.mutate(transaction.id)}
                                title="Marcar como pago"
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 h-8 w-8"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(transaction)}
                              title="Editar"
                              className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(transaction.id)}
                              title="Excluir"
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          <TabsContent value="fluxo" className="space-y-6">
            <CashFlowChart />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
