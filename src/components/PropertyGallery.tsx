import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Play, X } from 'lucide-react'

interface MediaItem {
  url: string
  type: 'image' | 'video'
}

interface Props {
  images: string[]
  videos?: string[]
}

export function PropertyGallery({ images, videos = [] }: Props) {
  const media: MediaItem[] = [
    ...images.filter(Boolean).map(url => ({ url, type: 'image' as const })),
    ...videos.filter(Boolean).map(url => ({ url, type: 'video' as const })),
  ]
  const [selected, setSelected] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [loadedImages, setLoadedImages] = useState<string[]>([])
  const [loadedVideos, setLoadedVideos] = useState<string[]>([])
  const activeIndex = Math.min(selected, Math.max(media.length - 1, 0))
  const active = media[activeIndex]

  useEffect(() => {
    if (!expanded || !media.length) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
      if (event.key === 'ArrowRight') setSelected(index => (index + 1) % media.length)
      if (event.key === 'ArrowLeft') setSelected(index => (index - 1 + media.length) % media.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [expanded, media.length])

  if (!media.length) {
    return <div className="flex aspect-video items-center justify-center rounded-md border border-border bg-muted text-sm text-muted-foreground">Nenhuma mídia disponível</div>
  }

  const openViewer = (index: number) => {
    setSelected(index)
    setExpanded(true)
  }

  const markImageLoaded = (url: string) => setLoadedImages(current => current.includes(url) ? current : [...current, url])
  const markVideoLoaded = (url: string) => setLoadedVideos(current => current.includes(url) ? current : [...current, url])

  const tile = (item: MediaItem, index: number, className: string, showMore = false) => (
    <button
      key={`${item.url}-${index}`}
      type="button"
      onClick={() => openViewer(index)}
      aria-label={showMore ? `Abrir galeria com ${media.length} mídias, começando pela mídia ${index + 1}` : `Ampliar ${item.type === 'video' ? 'vídeo' : 'foto'} ${index + 1}`}
      className={`group relative block overflow-hidden rounded-md bg-[#E4E1D8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#AD7B3B] ${className}`}
    >
      {item.type === 'image' ? <>
        {!loadedImages.includes(item.url) && <span className="absolute inset-0 flex items-center justify-center bg-[#E4E1D8]" role="status" aria-label={`Carregando foto ${index + 1}`}><Loader2 className="h-7 w-7 animate-spin text-[#AD7B3B]" /></span>}
        <img src={item.url} alt={`Foto ${index + 1} do imóvel`} onLoad={() => markImageLoaded(item.url)} className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.03] ${loadedImages.includes(item.url) ? 'opacity-100' : 'opacity-0'}`} loading={index === 0 ? 'eager' : 'lazy'} />
      </> : <div className="flex h-full w-full items-center justify-center bg-[#17323D] text-white"><Play className="h-10 w-10" /><span className="sr-only">Vídeo {index + 1}</span></div>}
      {showMore && <span className="absolute inset-0 flex flex-col items-end justify-end bg-[#17323D]/55 p-4 text-right font-semibold uppercase text-white sm:p-5"><span className="text-2xl">+ {media.length - 2}</span><span className="text-sm tracking-wide">{videos.length ? (media.length - 2 === 1 ? 'mídia' : 'mídias') : (media.length - 2 === 1 ? 'foto' : 'fotos')}</span></span>}
    </button>
  )

  return (
    <>
      <section aria-label="Fotos e vídeos do imóvel">
        <div className={`grid gap-2 overflow-hidden rounded-md ${media.length > 1 ? 'md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : ''}`}>
          {tile(media[0], 0, 'aspect-[4/3] w-full md:aspect-[16/10]')}
          {media.length > 1 && <div className={`grid min-h-0 grid-cols-2 gap-2 md:grid-cols-1 ${media.length > 2 ? 'md:grid-rows-2' : ''}`}>
            {tile(media[1], 1, 'aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-0')}
            {media.length > 2 && tile(media[2], 2, 'aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-0', true)}
          </div>}
        </div>
      </section>

      {expanded && <div role="dialog" aria-modal="true" aria-label="Visualização ampliada da mídia" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10" onClick={() => setExpanded(false)}>
        <button type="button" aria-label="Fechar visualização" onClick={() => setExpanded(false)} className="absolute right-4 top-4 z-10 rounded-full p-2 text-white hover:bg-white/20"><X className="h-6 w-6" /></button>
        {media.length > 1 && <button type="button" aria-label="Mídia anterior" onClick={(event) => { event.stopPropagation(); setSelected(index => (index - 1 + media.length) % media.length) }} className="absolute left-2 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-white/20 sm:left-5"><ChevronLeft className="h-6 w-6" /></button>}
        {active.type === 'image' ? <>
          {!loadedImages.includes(active.url) && <Loader2 className="absolute h-9 w-9 animate-spin text-white" aria-label="Carregando foto" />}
          <img src={active.url} alt={`Foto ${activeIndex + 1} do imóvel ampliada`} onLoad={() => markImageLoaded(active.url)} onClick={event => event.stopPropagation()} className={`max-h-full max-w-full object-contain ${loadedImages.includes(active.url) ? 'opacity-100' : 'opacity-0'}`} />
        </> : <>
          {!loadedVideos.includes(active.url) && <Loader2 className="absolute h-9 w-9 animate-spin text-white" aria-label="Carregando vídeo" />}
          <video key={active.url} src={active.url} controls autoPlay playsInline onLoadedData={() => markVideoLoaded(active.url)} onClick={event => event.stopPropagation()} className="max-h-full max-w-full" />
        </>}
        {media.length > 1 && <button type="button" aria-label="Próxima mídia" onClick={(event) => { event.stopPropagation(); setSelected(index => (index + 1) % media.length) }} className="absolute right-2 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-white/20 sm:right-5"><ChevronRight className="h-6 w-6" /></button>}
        <span className="absolute bottom-4 text-xs text-white/80">{activeIndex + 1} de {media.length}</span>
      </div>}
    </>
  )
}
