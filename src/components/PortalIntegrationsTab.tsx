import { useState, useMemo } from 'react'
import {
  Globe,
  Copy,
  Check,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Code2,
  FileCode,
  Radio,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { downloadVRSyncXml, generateVRSyncXml } from '@/lib/portalXmlFeed'
import type { Property } from '@/types'

interface PortalIntegrationsTabProps {
  properties: Property[]
}

export function PortalIntegrationsTab({ properties }: PortalIntegrationsTabProps) {
  const { organization } = useAuth()
  const [copied, setCopied] = useState(false)
  const [showXmlCode, setShowXmlCode] = useState(false)

  const orgSlug = organization?.slug || 'domus'
  const feedUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${orgSlug}/portais.xml`
    : `https://domus.app/${orgSlug}/portais.xml`

  const availableProperties = useMemo(
    () => properties.filter((p) => p.status === 'disponivel'),
    [properties],
  )

  const propertiesWithImages = useMemo(
    () => availableProperties.filter((p) => p.images && p.images.length > 0),
    [availableProperties],
  )

  const forRentCount = useMemo(
    () => availableProperties.filter((p) => p.rent_price > 0).length,
    [availableProperties],
  )

  const forSaleCount = useMemo(
    () => availableProperties.filter((p) => p.sale_price > 0).length,
    [availableProperties],
  )

  const xmlPreview = useMemo(() => {
    if (!showXmlCode || !organization) return ''
    return generateVRSyncXml({
      properties: availableProperties.slice(0, 3),
      organization,
    })
  }, [showXmlCode, availableProperties, organization])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
    }
  }

  const handleDownload = () => {
    if (!organization) return
    downloadVRSyncXml(availableProperties, organization)
  }

  const portals = [
    {
      name: 'ZAP Imóveis',
      logo: '🏢',
      status: 'Compatível (VRSync)',
      description: 'Maior portal imobiliário premium do Brasil. Sincronização automática a cada 24h.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      name: 'VivaReal',
      logo: '🏠',
      status: 'Padrão Nativo (VRSync)',
      description: 'Líder em busca de locação e compra residencial. Lê o feed XML diretamente.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      name: 'OLX Brasil',
      logo: '⚡',
      status: 'Compatível (Grupo OLX)',
      description: 'Integração direta com anúncios profissionais da OLX Pro Imóveis.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      name: 'Chaves na Mão',
      logo: '🔑',
      status: 'Compatível (XML)',
      description: 'Forte presença regional no Sul e Sudeste. Aceita a carga VRSync sem adaptações.',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      name: 'Imovelweb',
      logo: '🌐',
      status: 'Compatível (XML)',
      description: 'Portal nacional de grande audiência. Suporte ao mapeamento de carga padrão.',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg">
                <Globe className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-serif font-bold text-foreground">
                Integração e Feed XML de Portais Imobiliários
              </h2>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200">
                Padrão VRSync
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Publique seu catálogo completo de imóveis automaticamente no <strong>ZAP Imóveis, VivaReal, OLX e Chaves na Mão</strong> sem cadastrar manualmente em cada portal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowXmlCode(!showXmlCode)}
              className="gap-2"
            >
              <Code2 className="h-4 w-4" />
              {showXmlCode ? 'Ocultar XML' : 'Ver Código XML'}
            </Button>
            <Button
              onClick={handleDownload}
              className="gap-2 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white"
            >
              <Download className="h-4 w-4" />
              Baixar Arquivo XML
            </Button>
          </div>
        </div>

        {/* Live URL box */}
        <div className="mt-5 p-3.5 bg-background border border-border rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <Radio className="h-4 w-4 text-emerald-500 animate-pulse flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Link Público do seu Feed XML (Sempre Atualizado):
              </span>
              <code className="text-sm font-mono text-primary truncate block select-all">
                {feedUrl}
              </code>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant={copied ? 'default' : 'outline'}
              onClick={handleCopy}
              className="gap-1.5 min-w-[120px]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="gap-1.5"
            >
              <a href={feedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Testar Link
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Imóveis no Feed</p>
              <p className="text-2xl font-bold text-foreground">{availableProperties.length}</p>
              <p className="text-[11px] text-muted-foreground">Status disponível</p>
            </div>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Com Fotos</p>
              <p className="text-2xl font-bold text-foreground">{propertiesWithImages.length}</p>
              <p className="text-[11px] text-muted-foreground">
                {availableProperties.length > 0
                  ? `${Math.round((propertiesWithImages.length / availableProperties.length) * 100)}% do estoque`
                  : '0%'}
              </p>
            </div>
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 rounded-lg">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Para Locação</p>
              <p className="text-2xl font-bold text-foreground">{forRentCount}</p>
              <p className="text-[11px] text-muted-foreground">Aluguel ativo</p>
            </div>
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 rounded-lg">
              <FileCode className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Para Venda</p>
              <p className="text-2xl font-bold text-foreground">{forSaleCount}</p>
              <p className="text-[11px] text-muted-foreground">Preço de venda</p>
            </div>
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 text-purple-600 rounded-lg">
              <Globe className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning if any property without images */}
      {availableProperties.length > propertiesWithImages.length && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Dica de Desempenho nos Portais:</strong> {availableProperties.length - propertiesWithImages.length} imóvel(is) disponível(is) ainda não possui(em) fotos cadastradas. Portais como ZAP e VivaReal priorizam anúncios com pelo menos 5 fotos em alta resolução.
          </div>
        </div>
      )}

      {/* Supported Portals Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Portais Homologados e Compatíveis</CardTitle>
          <CardDescription>
            Basta fornecer a URL do seu feed para o suporte ou colar nas configurações de integração do seu plano de anunciante em cada portal:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {portals.map((portal) => (
              <div
                key={portal.name}
                className="border border-border rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{portal.logo}</span>
                      <h3 className="font-semibold text-foreground">{portal.name}</h3>
                    </div>
                    <Badge variant="outline" className={`text-[11px] ${portal.badgeColor}`}>
                      {portal.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {portal.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-500" />
                  Atualização diária automática
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to use step-by-step */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como ativar no ZAP, VivaReal e OLX em 3 passos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-semibold text-sm">Copie o link do feed</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Clique no botão <strong>Copiar Link</strong> acima para copiar a URL única de integração da sua imobiliária.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-semibold text-sm">Envie ao Portal</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                No painel do anunciante (ex: ZAP Pro / VivaReal Carga) ou pelo WhatsApp do seu gerente de contas, informe: <em>&quot;Quero ativar a carga via XML no padrão VRSync com esta URL&quot;</em>.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-semibold text-sm">Pronto! Tudo automático</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Sempre que você cadastrar, alterar o valor ou alugar um imóvel no Domus, os portais atualizarão seus anúncios automaticamente na próxima leitura.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XML Code preview if enabled */}
      {showXmlCode && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Estrutura do XML Gerado (Amostra dos 3 primeiros imóveis)
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                application/xml
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted text-foreground text-xs font-mono rounded-lg overflow-x-auto max-h-96 border border-border">
              {xmlPreview}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
