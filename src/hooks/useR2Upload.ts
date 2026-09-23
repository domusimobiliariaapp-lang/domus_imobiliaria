import { useCallback, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/toast'

export interface UploadResult {
  url: string
  path: string
}

async function invokeR2(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('domus-r2-upload', { body })
  if (error) {
    let message = error.message
    if (error.context instanceof Response) {
      const details = await error.context.json().catch(() => null)
      message = details?.error || message
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export function useR2Upload() {
  const { addToast } = useToast()
  const [pending, setPending] = useState(0)

  const uploadFile = useCallback(async (file: File, folder = 'documents'): Promise<UploadResult> => {
    setPending(count => count + 1)
    try {
      const fallbackTypes: Record<string, string> = {
        pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        webp: 'image/webp', mp4: 'video/mp4', mov: 'video/quicktime',
        doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
      const fileType = file.type || fallbackTypes[file.name.split('.').pop()?.toLowerCase() || ''] || 'application/octet-stream'
      const data = await invokeR2({ fileName: file.name, fileType, fileSize: file.size, folder })
      if (!data?.uploadUrl || !data?.key || !data?.publicUrl) throw new Error('Resposta inválida da função de upload R2.')
      let response: Response
      try {
        response = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': fileType }, body: file })
      } catch {
        throw new Error('Não foi possível conectar ao R2. Verifique a conexão e o CORS do bucket.')
      }
      if (!response.ok) throw new Error(`Falha no upload para o R2 (HTTP ${response.status}). Verifique as credenciais e permissões do bucket.`)
      addToast('Arquivo enviado com sucesso!', 'success')
      return { url: data.publicUrl, path: data.key }
    } finally {
      setPending(count => count - 1)
    }
  }, [addToast])

  const deleteFile = useCallback(async (path: string): Promise<void> => {
    await invokeR2({ action: 'delete', key: path })
  }, [])

  const uploadImages = useCallback(async (files: File[]): Promise<string[]> => {
    const results = await Promise.all(files.map(file => uploadFile(file, 'images')))
    return results.map(result => result.url)
  }, [uploadFile])

  return { uploadFile, uploadImages, deleteFile, uploading: pending > 0 }
}
