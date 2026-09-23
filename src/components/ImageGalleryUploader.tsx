import React, { useCallback, useState } from 'react'
import { useR2Upload } from '@/hooks/useR2Upload'
import { ImagePlus, Video, X, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'

export interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video'
  uploading?: boolean
}

interface Props {
  existingImages?: string[]
  existingVideos?: string[]
  onImagesChange: (urls: string[]) => void
  onVideosChange: (urls: string[]) => void
  maxImages?: number
  maxVideos?: number
}

const MAX_IMAGE_SIZE_MB = 10
const MAX_VIDEO_SIZE_MB = 50

export function ImageGalleryUploader({
  existingImages = [],
  existingVideos = [],
  onImagesChange,
  onVideosChange,
  maxImages = 10,
  maxVideos = 2,
}: Props) {
  const { uploadFile, uploading: globalUploading } = useR2Upload()
  const [imageUploading, setImageUploading] = useState<Record<string, boolean>>({})
  const [videoUploading, setVideoUploading] = useState<Record<string, boolean>>({})
  const [images, setImages] = useState<MediaItem[]>(
    existingImages.map((url, i) => ({ id: `img-${i}`, url, type: 'image' as const }))
  )
  const [videos, setVideos] = useState<MediaItem[]>(
    existingVideos.map((url, i) => ({ id: `vid-${i}`, url, type: 'video' as const }))
  )

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = maxImages - images.length
    if (remaining <= 0) return

    const toUpload = files.slice(0, remaining)
    const uploadedUrls: string[] = []
    for (const file of toUpload) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`Arquivo "${file.name}" excede ${MAX_IMAGE_SIZE_MB}MB`)
        continue
      }
      const id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setImageUploading(prev => ({ ...prev, [id]: true }))
      try {
        const result = await uploadFile(file, 'images')
        setImages(prev => [...prev, { id, url: result.url, type: 'image' }])
        uploadedUrls.push(result.url)
        onImagesChange([...images.map(i => i.url), ...uploadedUrls])
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao enviar imagem. Tente novamente.')
      } finally {
        setImageUploading(prev => ({ ...prev, [id]: false }))
      }
    }
    e.target.value = ''
  }, [images, maxImages, uploadFile, onImagesChange])

  const handleVideoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = maxVideos - videos.length
    if (remaining <= 0) return

    const toUpload = files.slice(0, remaining)
    const uploadedUrls: string[] = []
    for (const file of toUpload) {
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        alert(`Arquivo "${file.name}" excede ${MAX_VIDEO_SIZE_MB}MB`)
        continue
      }
      const id = `vid-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setVideoUploading(prev => ({ ...prev, [id]: true }))
      try {
        const result = await uploadFile(file, 'videos')
        setVideos(prev => [...prev, { id, url: result.url, type: 'video' }])
        uploadedUrls.push(result.url)
        onVideosChange([...videos.map(v => v.url), ...uploadedUrls])
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao enviar vídeo. Tente novamente.')
      } finally {
        setVideoUploading(prev => ({ ...prev, [id]: false }))
      }
    }
    e.target.value = ''
  }, [videos, maxVideos, uploadFile, onVideosChange])

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(i => i.id !== id))
    onImagesChange(images.filter(i => i.id !== id).map(i => i.url))
  }, [images, onImagesChange])

  const removeVideo = useCallback((id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id))
    onVideosChange(videos.filter(v => v.id !== id).map(v => v.url))
  }, [videos, onVideosChange])

  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Imagens */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Fotos do Imóvel ({images.length}/{maxImages})</Label>
          {images.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Arraste para reorder
            </span>
          )}
        </div>
        {images.length === 0 ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={globalUploading || images.length >= maxImages}
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer inline-flex flex-col items-center gap-2"
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {globalUploading ? 'Enviando...' : 'Clique para adicionar fotos'}
              </span>
              <span className="text-xs text-muted-foreground">JPG, PNG, WEBP — máx. {MAX_IMAGE_SIZE_MB}MB</span>
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const fromIndex = Number(e.dataTransfer.getData('text/plain'))
                  moveImage(fromIndex, idx)
                }}
              >
                {imageUploading[img.id] ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                ) : (
                  <img
                    src={img.url}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                  {idx + 1}
                </div>
              </div>
            ))}
            {images.length < maxImages && (
              <div className="aspect-square">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={globalUploading}
                  onChange={handleImageUpload}
                  className="hidden"
                  id={`image-upload-more-${images.length}`}
                />
                <label
                  htmlFor={`image-upload-more-${images.length}`}
                  className="flex items-center justify-center w-full h-full border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vídeos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Vídeos do Imóvel ({videos.length}/{maxVideos})</Label>
        </div>
        {videos.length === 0 ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="video/*"
              disabled={globalUploading || videos.length >= maxVideos}
              onChange={handleVideoUpload}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className="cursor-pointer inline-flex flex-col items-center gap-2"
            >
              <Video className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {globalUploading ? 'Enviando...' : 'Clique para adicionar vídeo'}
              </span>
              <span className="text-xs text-muted-foreground">MP4, MOV — máx. {MAX_VIDEO_SIZE_MB}MB</span>
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {videos.map((vid, idx) => (
              <div
                key={vid.id}
                className="relative rounded-lg overflow-hidden bg-muted aspect-video group"
              >
                {videoUploading[vid.id] ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                ) : (
                  <video
                    src={vid.url}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeVideo(vid.id)}
                  className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                  {idx + 1}
                </div>
              </div>
            ))}
            {videos.length < maxVideos && (
              <div className="aspect-video">
                <input
                  type="file"
                  accept="video/*"
                  disabled={globalUploading}
                  onChange={handleVideoUpload}
                  className="hidden"
                  id={`video-upload-more-${videos.length}`}
                />
                <label
                  htmlFor={`video-upload-more-${videos.length}`}
                  className="flex items-center justify-center w-full h-full border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Video className="h-6 w-6 text-muted-foreground" />
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

