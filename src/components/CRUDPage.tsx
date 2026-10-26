import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Edit2, Trash2, List, LayoutGrid, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
// Type definitions for CRUD page
export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
}

export interface FilterOption {
  value: string
  label: string
}

export interface CRUDPageProps<T> {
  title: string
  subtitle?: string
  columns: Column<T>[]
  fetchData: () => Promise<T[]>
  createItem: (data: Partial<T>) => Promise<T>
  updateItem: (id: string, data: Partial<T>) => Promise<T>
  deleteItem: (id: string) => Promise<void>
  getItemId: (item: T) => string
  filters?: {
    status?: FilterOption[]
    type?: FilterOption[]
    category?: FilterOption[]
  }
  initialFilterValues?: Record<string, string>
  renderActions?: (item: T, handlers: { edit: (item: T) => void; delete: (item: T) => void }) => React.ReactNode
  renderCard?: (item: T) => React.ReactNode
  viewMode?: 'list' | 'cards'
  onViewModeChange?: (mode: 'list' | 'cards') => void
  renderForm?: (props: {
    item: T | null
    formData: Partial<T>
    setFormData: React.Dispatch<React.SetStateAction<Partial<T>>>
    onSubmit: (e: React.FormEvent) => void
    saving: boolean
    isEditing: boolean
  }) => React.ReactNode
  emptyStateIcon?: React.ReactNode
  emptyStateMessage?: string
  /**
   * Texto e rótulo da confirmação de exclusão. Ajudando quando a "exclusão"
   * não apaga de verdade — desativar um cliente preserva o histórico, e dizer
   * "esta ação não pode ser desfeita" seria mentira.
   */
  confirmDeleteTitle?: string
  confirmDeleteMessage?: string
  confirmDeleteLabel?: string
  formSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  onEdit?: (item: T) => void
  onCreate?: () => void
  persistState?: boolean
  onDelete?: (id: string) => void
  tabs?: {
    value: string
    onValueChange: (value: string) => void
    items: { value: string; label: string }[]
  }
  extraHeaderActions?: React.ReactNode
}

export function CRUDPage<T extends Record<string, any>>({
  title,
  subtitle,
  columns,
  fetchData,
  createItem,
  updateItem,
  deleteItem,
  getItemId,
  filters,
  initialFilterValues = {},
  renderActions,
  renderCard,
  viewMode,
  onViewModeChange,
  renderForm,
  emptyStateIcon,
  emptyStateMessage = 'Nenhum registro encontrado',
  confirmDeleteTitle,
  confirmDeleteMessage,
  confirmDeleteLabel,
  formSize = 'lg',
  tabs,
  onCreate,
  persistState = true,
  extraHeaderActions,
}: CRUDPageProps<T>) {
  // Use localStorage to persist modal state across page refreshes
  const STORAGE_KEY = `crudpage_${title.toLowerCase().replace(/\s+/g, '_')}_state`

  const getInitialState = () => {
    if (!persistState) return null
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          dialogOpen: parsed.dialogOpen || false,
          editingItem: parsed.editingItem || null,
          formData: parsed.formData || {},
          deleteConfirm: parsed.deleteConfirm || null,
          search: parsed.search || '',
          statusFilter: parsed.statusFilter || '',
          typeFilter: parsed.typeFilter || '',
          categoryFilter: parsed.categoryFilter || '',
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null
  }

  const saveState = (state: {
    dialogOpen: boolean
    editingItem: T | null
    formData: Partial<T>
    deleteConfirm: T | null
    search: string
    statusFilter: string
    typeFilter: string
    categoryFilter: string
  }) => {
    if (!persistState) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore storage errors
    }
  }

  const initialState = getInitialState()

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState(initialState?.search || '')
  const [statusFilter, setStatusFilter] = useState(initialState?.statusFilter || initialFilterValues.status || '')
  const [typeFilter, setTypeFilter] = useState(initialState?.typeFilter || initialFilterValues.type || '')
  const [categoryFilter, setCategoryFilter] = useState(initialState?.categoryFilter || initialFilterValues.category || '')
  const [dialogOpen, setDialogOpen] = useState(onCreate ? false : (initialState?.dialogOpen || false))
  const [editingItem, setEditingItem] = useState<T | null>(initialState?.editingItem || null)
  const [deleteConfirm, setDeleteConfirm] = useState<T | null>(initialState?.deleteConfirm || null)
  const [formData, setFormData] = useState<Partial<T>>(initialState?.formData || {})
  const [saving, setSaving] = useState(false)
  // Falha de gravação precisa aparecer. Antes o erro ia só para o console e o
  // modal fechava do mesmo jeito, então uma coluna que não existe no banco
  // parecia exatamente um clique que não fez nada.
  const [saveError, setSaveError] = useState<string | null>(null)
  const { addToast } = useToast()
  const [localViewMode, setLocalViewMode] = useState<'list' | 'cards'>('list')
  const currentViewMode = viewMode ?? localViewMode
  const changeViewMode = (mode: 'list' | 'cards') => {
    setLocalViewMode(mode)
    onViewModeChange?.(mode)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await fetchData()
      setData(result)
      setLoadError(null)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar os registros.')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  const filteredData = data.filter((item) => {
    const matchesSearch = Object.values(item).some(
      (val) => val && String(val).toLowerCase().includes(search.toLowerCase())
    )
    const matchesStatus = !statusFilter || (item as any).status === statusFilter
    const matchesType = !typeFilter || [item.type, item.tipo_relacao, item.tipo].includes(typeFilter)
    const matchesCategory = !categoryFilter || [item.purpose, item.categoria, item.category].includes(categoryFilter)
    return matchesSearch && matchesStatus && matchesType && matchesCategory
  })

  // Persist state whenever it changes
  React.useEffect(() => {
    saveState({
      dialogOpen,
      editingItem,
      formData,
      deleteConfirm,
      search,
      statusFilter,
      typeFilter,
      categoryFilter,
    })
  }, [dialogOpen, editingItem, formData, deleteConfirm, search, statusFilter, typeFilter, categoryFilter])

  const handleOpenCreate = () => {
    if (onCreate) {
      onCreate()
      return
    }
    setEditingItem(null)
    setFormData({})
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: T) => {
    setEditingItem(item)
    setFormData(item as Partial<T>)
    setDialogOpen(true)
  }

  const handleCloseModal = () => {
    setSaveError(null)
    setDialogOpen(false)
    setEditingItem(null)
    setFormData({})
  }

  const handleDelete = (item: T) => {
    setDeleteConfirm(item)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteItem(getItemId(deleteConfirm))
      loadData()
    } catch (err) {
      console.error('Erro ao excluir:', err)
    }
    setDeleteConfirm(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      if (editingItem) {
        await updateItem(getItemId(editingItem), formData)
      } else {
        await createItem(formData)
      }
      // Force reload from server
      setLoading(true)
      const result = await fetchData()
      setData(result)
      setLoading(false)
      handleCloseModal()
    } catch (err) {
      console.error('Erro ao salvar:', err)
      // Modal continua aberto: fechar aqui fazia o usuario acreditar que salvou.
      setSaveError(mensagemDeErro(err))
      addToast(mensagemDeErro(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Normaliza o erro para exibição segura ao usuário.
   *
   * Nunca expor mensagens brutas do Postgres/PostgREST (nomes de
   * coluna, tabela, política RLS): elas mapeiam o schema e ajudam
   * um atacante a encontrar falhas de injeção ou permissão.
   */
  function mensagemDeErro(_err: unknown): string {
    return 'Falha ao salvar. Verifique os dados e tente novamente.'
  }

  const handleCancel = () => {
    handleCloseModal()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || subtitle || renderCard || extraHeaderActions || handleOpenCreate) && (
        <div className={`flex flex-col sm:flex-row ${title ? 'sm:items-center justify-between' : 'justify-end'} gap-3`}>
          {title && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-primary">{title}</h1>
              {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {renderCard && (
              <div role="group" aria-label="Modo de visualização" className="flex rounded-md border border-border bg-background p-1">
                <button type="button" onClick={() => changeViewMode('list')} aria-label="Exibir lista" aria-pressed={currentViewMode === 'list'} className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs sm:text-sm ${currentViewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}><List className="h-4 w-4" /><span className="hidden sm:inline">Lista</span></button>
                <button type="button" onClick={() => changeViewMode('cards')} aria-label="Exibir cards" aria-pressed={currentViewMode === 'cards'} className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs sm:text-sm ${currentViewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="h-4 w-4" /><span className="hidden sm:inline">Cards</span></button>
              </div>
            )}
            {extraHeaderActions}
            <Button onClick={handleOpenCreate} className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white shrink-0">
              <Plus className="h-4 w-4 mr-1.5" />
              Novo
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {tabs && (
        <Tabs
          value={tabs.items[0]?.value || ''}
          onValueChange={tabs.onValueChange}
          className="w-full"
        >
          <TabsList className="w-full sm:w-auto overflow-x-auto flex justify-start">
            {tabs.items.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Toolbar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              {filters?.status && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {filters.status.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {filters?.type && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] h-10">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {filters.type.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {filters?.category && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] h-10">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {filters.category.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className={renderCard && currentViewMode === 'cards' ? 'border-0 bg-transparent shadow-none' : ''}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <p className="text-destructive">Não foi possível carregar os registros: {loadError}</p>
              <Button variant="outline" onClick={() => void loadData()}>Tentar novamente</Button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              {emptyStateIcon || (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <p className="text-muted-foreground">{emptyStateMessage}</p>
            </div>
          ) : renderCard && currentViewMode === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredData.map(item => <React.Fragment key={getItemId(item)}>{renderCard(item)}</React.Fragment>)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.key} className={col.className}>
                        {col.header}
                      </TableHead>
                    ))}
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={getItemId(item)}>
                      {columns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                          {col.render ? col.render(item) : (item as any)[col.key]}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {renderActions ? (
                            renderActions(item, { edit: handleOpenEdit, delete: handleDelete })
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(item)}
                                className="text-muted-foreground hover:text-primary transition-transform hover:scale-110 active:scale-95"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item)}
                                className="text-muted-foreground hover:text-destructive transition-transform hover:scale-110 active:scale-95"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={`${editingItem ? 'Editar' : 'Novo'} ${title.slice(0, -1)}`}
        description={editingItem ? 'Atualize as informações abaixo' : 'Preencha os dados para criar um novo registro'}
        size={formSize}
        footer={{
          onCancel: handleCancel,
          onSave: () => {
            handleSave({ preventDefault: () => {} } as React.FormEvent)
          },
          saveDisabled: saving,
        }}
      >
        {saveError && (
          <div className="mx-6 mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          {renderForm ? (
            renderForm({
              item: editingItem,
              formData,
              setFormData,
              onSubmit: handleSave,
              saving,
              isEditing: !!editingItem,
            })
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {columns.map((col) => {
                if (col.key === 'id' || col.key === 'created_at' || col.key === 'updated_at') return null
                return (
                  <div key={col.key} className="space-y-1">
                    <Label>{col.header}</Label>
                    <Input
                      value={String(formData[col.key as keyof T] || '')}
                      onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                      placeholder={col.header}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title={confirmDeleteTitle || 'Confirmar exclusão'}
        size="sm"
        footer={{
          onCancel: () => setDeleteConfirm(null),
          onSave: confirmDelete,
          saveLabel: confirmDeleteLabel || 'Excluir',
          showCancel: true,
        }}
      >
        <p className="text-muted-foreground">
          {confirmDeleteMessage ||
            'Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.'}
        </p>
      </Modal>
    </div>
  )
}
