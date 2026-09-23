import { CRUDPage } from '@/components/CRUDPage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FileText, AlertCircle, Paperclip } from 'lucide-react'
import { useDocuments, useCreateEntity, useUpdateEntity, useDeleteEntity, useProfiles } from '@/hooks/useSupabase'
import type { Document, Profile } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { Upload, X } from 'lucide-react'
import { useR2Upload } from '@/hooks/useR2Upload'
import * as React from 'react'
import { useState } from 'react'

type DocumentType = 'contrato' | 'procuracao' | 'identidade' | 'comprovante_residencia' | 'certificate_negocial' | 'outro'

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'procuracao', label: 'Procuração' },
  { value: 'identidade', label: 'Identidade/CPF' },
  { value: 'comprovante_residencia', label: 'Comprovante de Residência' },
  { value: 'certificate_negocial', label: 'Certidão Negatorial' },
  { value: 'outro', label: 'Outro' },
]

const ENTITY_TYPES = [
  { value: 'property', label: 'Imóvel' },
  { value: 'lease', label: 'Locação' },
  { value: 'sale', label: 'Venda' },
  { value: 'user', label: 'Usuário' },
]

const FILTER_TYPE = DOCUMENT_TYPES
const FILTER_ENTITY = ENTITY_TYPES

export function LegalAdmin() {
  const { data: documents, error, refetch } = useDocuments()
  const { data: profiles } = useProfiles()
  const { create } = useCreateEntity('documents')
  const { update } = useUpdateEntity('documents')
  const { remove } = useDeleteEntity('documents')

  const columns: Array<{ key: string; header: string; render: (d: Document & { uploader?: Profile }) => React.ReactNode }> = [
    {
      key: 'title',
      header: 'Nome do Arquivo',
      render: (d: Document) => <span className="font-medium">{d.title}</span>
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (d: Document) => {
        const typeLabel = DOCUMENT_TYPES.find(t => t.value === d.type)?.label || d.type
        return <span className="text-sm capitalize">{typeLabel}</span>
      }
    },
    {
      key: 'entity_type',
      header: 'Vinculado a',
      render: (d: Document) => <span>{ENTITY_TYPES.find(e => e.value === d.entity_type)?.label || d.entity_type}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusBadge type="document" value="concluido" />
    },
    {
      key: 'uploader',
      header: 'Enviado por',
      render: (d: any) => <span>{d.uploader?.full_name || 'N/A'}</span>
    },
    {
      key: 'created_at',
      header: 'Data',
      render: (d: Document) => new Date(d.created_at).toLocaleDateString('pt-BR')
    },
  ]

  const handleCreate = async (data: Partial<Document>) => {
    const { data: result, error } = await create({
      ...data,
      file_path: uploadedFileUrl || (data.file_path as string) || '',
    })
    if (error) throw error
    return result
  }

  const handleUpdate = async (id: string, data: Partial<Document>) => {
    const { data: result, error } = await update(id, data)
    if (error) throw error
    return result
  }

  const handleDelete = async (id: string) => {
    const { error } = await remove(id)
    if (error) throw error
  }

  const { uploadFile, uploading: uploadingFile } = useR2Upload()
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await uploadFile(file, 'documents')
      setUploadedFileUrl(result.url)
      setUploadedFileName(file.name)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao enviar documento.')
    } finally {
      e.target.value = ''
    }
  }

  const renderForm = ({
    formData,
    setFormData,
  }: {
    item: Document | null
    formData: Partial<Document>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Document>>>
    onSubmit: (e: React.FormEvent) => void
    saving: boolean
    isEditing: boolean
  }) => {
    return (
      <div>
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Título</Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nome do documento"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Tipo de Documento</Label>
              <Select
                value={formData.type || 'contrato'}
                onValueChange={(v) => setFormData({ ...formData, type: v as DocumentType })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Vinculado a</Label>
              <Select
                value={formData.entity_type || 'property'}
                onValueChange={(v) => setFormData({ ...formData, entity_type: v as 'property' | 'lease' | 'sale' | 'user' })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>ID da Entidade</Label>
              <Input
                value={formData.entity_id || ''}
                onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                placeholder="UUID da entidade vinculada"
                required
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Arquivo</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={uploadingFile}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="document-upload"
                />
                <label
                  htmlFor="document-upload"
                  className="cursor-pointer inline-flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingFile ? 'Enviando...' : 'Clique para enviar arquivo'}
                  </span>
                  <span className="text-xs text-muted-foreground">PDF, DOC, JPG, PNG (máx. 10MB)</span>
                </label>
                {uploadedFileUrl && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="truncate max-w-[200px]">{uploadedFileName}</span>
                    <button
                      onClick={() => {
                        setUploadedFileUrl(null)
                        setUploadedFileName(null)
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {/* Hidden input to store URL in form data */}
              <input type="hidden" value={uploadedFileUrl || ''} />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o documento"
                rows={2}
              />
            </div>
          </div>
        </form>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center gap-4 text-destructive bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Erro ao carregar documentos</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <CRUDPage<Document & { uploader?: Profile }>
      title="Documentos"
      subtitle="Cadastre e gerencie os documentos da imobiliária"
      columns={columns}
      fetchData={async () => {
        await refetch()
        const enriched = (documents || []).map(doc => ({
          ...doc,
          uploader: profiles?.find(p => p.id === doc.uploaded_by),
        }))
        return enriched
      }}
      createItem={handleCreate}
      updateItem={handleUpdate}
      deleteItem={handleDelete}
      getItemId={(d) => d.id}
      filters={{
        type: FILTER_TYPE,
        category: FILTER_ENTITY,
      }}
      renderForm={renderForm}
      formSize="2xl"
      emptyStateIcon={
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
      }
      emptyStateMessage="Nenhum documento cadastrado"
      renderActions={(item: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const methods = (globalThis as any).__crudPageMethods
              if (methods?.openEdit) {
                methods.openEdit(item)
              }
            }}
            className="text-muted-foreground hover:text-primary transition-transform hover:scale-110 active:scale-95"
            title="Editar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const methods = (globalThis as any).__crudPageMethods
              if (methods?.deleteItem) {
                methods.deleteItem(item.id)
              }
            }}
            className="text-muted-foreground hover:text-destructive transition-transform hover:scale-110 active:scale-95"
            title="Excluir"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(`/portal/documents/${item.id}`, '_blank')}
            className="text-muted-foreground hover:text-primary transition-transform hover:scale-110 active:scale-95"
            title="Visualizar"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
      )}
    />
  )
}

