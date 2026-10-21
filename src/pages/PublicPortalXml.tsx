import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePublicProperties, useOrgBranding } from '@/hooks/useSupabase'
import { generateVRSyncXml, downloadVRSyncXml } from '@/lib/portalXmlFeed'
import { Button } from '@/components/ui/button'
import { Download, Copy, Check, ArrowLeft, Globe, Loader2, AlertCircle } from 'lucide-react'

export function PublicPortalXml() {
  const { slug } = useParams<{ slug: string }>()
  const { data: properties, loading: propsLoading, error: propsError } = usePublicProperties(slug ?? null)
  const { data: org, loading: orgLoading, error: orgError } = useOrgBranding(slug ?? null)
  const [copied, setCopied] = useState(false)

  const xmlContent = useMemo(() => {
    if (!properties || !org) return ''
    return generateVRSyncXml({
      properties,
      organization: org,
    })
  }, [properties, org])

  const handleCopy = async () => {
    if (!xmlContent) return
    try {
      await navigator.clipboard.writeText(xmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleDownload = () => {
    if (!properties || !org) return
    downloadVRSyncXml(properties, org)
  }

  if (propsLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando feed de imóveis para portais...</p>
        </div>
      </div>
    )
  }

  if (propsError || orgError || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full p-6 border border-destructive/20 bg-destructive/5 rounded-xl text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Imobiliária não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            Não foi possível localizar o catálogo de imóveis para o endereço informado ({slug}).
          </p>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono text-xs">
      {/* Top action header for human / portal manager */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            to={`/${slug}/imoveis`}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Ver Vitrine Pública"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-sm text-white">{org.name}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Feed VRSync (ZAP / VivaReal / OLX)</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {properties?.length || 0} imóveis disponíveis
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="gap-1.5 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar XML
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            className="gap-1.5 h-8 text-xs bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar .xml
          </Button>
        </div>
      </header>

      {/* Raw XML container */}
      <main className="flex-1 p-4 overflow-x-auto">
        <pre className="text-emerald-400/90 leading-relaxed whitespace-pre font-mono text-[11px] selection:bg-emerald-500/20">
          {xmlContent}
        </pre>
      </main>
    </div>
  )
}
export default PublicPortalXml
