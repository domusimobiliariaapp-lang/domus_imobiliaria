import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Home, MapPin, Bed, Bath, Car, ArrowLeft, Calendar, Square, FileImage, Share2, Check, ShieldCheck, Copy } from 'lucide-react'
import { usePublicProperty } from '@/hooks/useSupabase'
import { useSEO } from '@/hooks/useSEO'
import { PropertyGallery } from '@/components/PropertyGallery'
import { SharePropertyModal } from '@/components/properties/SharePropertyModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PropertyType, PropertyStatus } from '@/types'
import { supabase } from '@/integrations/supabase/client'
import { getPropertyFeature } from '@/lib/propertyFeatures'

const TYPE_LABELS: Record<PropertyType, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  cobertura: 'Cobertura',
  studio: 'Kitnet / Studio',
  sobrado: 'Sobrado',
  comercial: 'Comercial',
  terreno: 'Terreno',
  sala: 'Sala',
  galpao: 'Galpão',
  loja: 'Loja',
  chacara: 'Chácara',
  sitio: 'Sítio',
}

const STATUS_LABELS: Record<PropertyStatus, string> = {
  disponivel: 'Disponível',
  alugado: 'Alugado',
  vendido: 'Vendido',
  reservado: 'Reservado',
  indisponivel: 'Indisponível',
}

const STATUS_COLORS: Record<PropertyStatus, string> = {
  disponivel: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  alugado: 'bg-blue-100 text-blue-700 border-blue-200',
  vendido: 'bg-red-100 text-red-700 border-red-200',
  reservado: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  indisponivel: 'bg-gray-100 text-gray-700 border-gray-200',
}

export function PublicPropertyDetail() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const { data: property, loading, error } = usePublicProperty(slug ?? null, id ?? null)
  const [contact, setContact] = useState<{ whatsapp: string; email: string }>({ whatsapp: '', email: '' })
  const [copiedLink, setCopiedLink] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // O contato é o da imobiliária dona do imóvel
  useEffect(() => {
    if (!slug) return
    supabase.rpc('public_contact_settings', { p_slug: slug }).maybeSingle().then(({ data }) => {
      const values = data as { whatsapp?: string; email?: string } | null
      if (values) setContact({ whatsapp: values.whatsapp || '', email: values.email || '' })
    })
  }, [slug])

  const hasRent = property ? property.rent_price > 0 : false
  const hasSale = property ? property.sale_price > 0 : false
  const hasMapPoint = property?.latitude != null && property?.longitude != null && Number.isFinite(Number(property.latitude)) && Number.isFinite(Number(property.longitude))

  // Integração Open-SEO: meta tags, OpenGraph e Schema.org JSON-LD para compartilhamento e buscadores
  useSEO({
    title: property ? `${property.title} | Imóveis em ${property.city} - ${property.state}` : 'Detalhes do Imóvel | Domus',
    description: property?.description
      ? property.description.slice(0, 160)
      : property
      ? `${TYPE_LABELS[property.type]} com ${property.bedrooms || 0} quartos em ${property.neighborhood}, ${property.city}. Saiba mais!`
      : undefined,
    canonical: window.location.href,
    og: {
      title: property?.title,
      description: property?.description?.slice(0, 160),
      image: property?.images?.[0],
      imageWidth: '1200',
      imageHeight: '630',
      type: 'article',
      url: window.location.href,
      siteName: slug ? `${slug.toUpperCase()} Imobiliária` : 'Domus Imobiliária',
    },
    jsonLd: property
      ? {
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          name: property.title,
          description: property.description,
          image: property.images || [],
          url: window.location.href,
          datePosted: property.created_at,
          offers: {
            '@type': 'Offer',
            price: property.sale_price || property.rent_price,
            priceCurrency: 'BRL',
            businessFunction: hasRent
              ? 'http://purl.org/goodrelations/v1#LeaseOut'
              : 'http://purl.org/goodrelations/v1#Sell',
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: `${property.address || ''}${property.address_number ? `, ${property.address_number}` : ''}`,
            addressLocality: property.city,
            addressRegion: property.state,
            postalCode: property.zip_code,
            addressCountry: 'BR',
          },
          ...(hasMapPoint
            ? {
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: property.latitude,
                  longitude: property.longitude,
                },
              }
            : {}),
        }
      : undefined,
  })


  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title || 'Imóvel',
          text: `Confira este imóvel: ${property?.title}`,
          url,
        })
        return
      } catch {
        // Fallback para cópia
      }
    }
    await navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 3000)
  }

  // Log error if any
  if (error) {
    console.error('Erro ao carregar imóvel:', error)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEECE5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#EEECE5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">Erro ao carregar imóvel</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          <Link to={slug ? `/${slug}/imoveis` : '/login'} className="mt-6 inline-block">
            <Button className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para imóveis
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#EEECE5] flex items-center justify-center">
        <div className="text-center">
          <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-serif font-medium text-primary mb-2">Imóvel não encontrado</h2>
          <p className="text-muted-foreground mb-6">Este imóvel pode ter sido removido ou não existe.</p>
          <Link to={slug ? `/${slug}/imoveis` : '/login'}>
            <Button className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para imóveis
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const features = property.features || []
  const fullAddress = [property.address, property.address_number, property.neighborhood, property.city, property.state, property.zip_code, 'Brasil'].filter(Boolean).join(', ')
  const detailItems = [
    property.suites ? `${property.suites} suíte${property.suites === 1 ? '' : 's'}` : null,
    property.area_util ? `${property.area_util} m² privativos` : null,
    property.furnished_status === 'mobiliado' ? 'Mobiliado' : property.furnished_status === 'semimobiliado' ? 'Semimobiliado' : null,
    property.pet_allowed === true ? 'Aceita pets' : property.pet_allowed === false ? 'Não aceita pets' : null,
    property.has_elevator ? 'Elevador' : null,
    property.parking_covered ? 'Vaga coberta' : property.parking ? 'Vaga descoberta' : null,
  ].filter(Boolean) as string[]

  const monthlyTotal = hasRent
    ? property.rent_price +
      (property.condo_fee || 0) +
      (property.iptu || 0) +
      (property.gas_fee || 0) +
      (property.water_fee || 0) +
      (property.electricity_fee || 0) +
      (property.other_fees || 0)
    : 0

  return (
    <div className="min-h-screen bg-[#EEECE5]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Barra superior de Navegação e Compartilhamento */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to={slug ? `/${slug}/imoveis` : '/login'}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary/80 hover:text-primary transition-colors bg-white/70 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-border/40 shadow-2xs hover:shadow-xs"
          >
            <ArrowLeft className="h-4 w-4 text-[#AD7B3B]" />
            Voltar para o catálogo de imóveis
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareModalOpen(true)}
              className="bg-white/80 border-border/60 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-xs gap-1.5 shadow-2xs cursor-pointer font-medium"
              title="Compartilhar ficha completa no WhatsApp"
            >
              <Share2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Compartilhar no WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="bg-white/80 border-border/60 hover:bg-white text-xs gap-1.5 shadow-2xs cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-[#AD7B3B]" />}
              {copiedLink ? 'Link copiado!' : 'Copiar link'}
            </Button>
          </div>
        </div>

        {/* Galeria de Fotos */}
        <div className="mb-8">
          <PropertyGallery
            images={property.images || []}
            videos={property.videos || []}
          />
        </div>

        {/* Info do Imóvel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Título e Status */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-serif font-medium text-primary leading-tight">
                  {property.title}
                </h1>
                <Badge
                  variant="outline"
                  className={`${STATUS_COLORS[property.status]} text-sm font-normal px-3 py-1`}
                >
                  {STATUS_LABELS[property.status]}
                </Badge>
              </div>

              {/* Tipo e Endereço */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="bg-muted px-3 py-1 rounded-md">{TYPE_LABELS[property.type]}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {property.address}, {property.address_number || ''}
                  {property.address_complement && ` - ${property.address_complement}`}
                </span>
                <span>{property.neighborhood}, {property.city} - {property.state}</span>
              </div>
            </div>

            {/* Detalhes Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.bedrooms && (
                <div className="bg-white rounded-lg p-4 text-center border border-border/40">
                  <Bed className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-semibold text-primary">{property.bedrooms}</div>
                  <div className="text-xs text-muted-foreground">Quartos</div>
                </div>
              )}
              {property.bathrooms && (
                <div className="bg-white rounded-lg p-4 text-center border border-border/40">
                  <Bath className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-semibold text-primary">{property.bathrooms}</div>
                  <div className="text-xs text-muted-foreground">Banheiros</div>
                </div>
              )}
              {property.parking && (
                <div className="bg-white rounded-lg p-4 text-center border border-border/40">
                  <Car className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-semibold text-primary">{property.parking}</div>
                  <div className="text-xs text-muted-foreground">Vagas</div>
                </div>
              )}
              <div className="bg-white rounded-lg p-4 text-center border border-border/40">
                <Square className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-semibold text-primary">{property.area_m2}</div>
                <div className="text-xs text-muted-foreground">m²</div>
              </div>
            </div>

            {/* Descrição */}
            {property.description && (
              <div className="bg-white rounded-lg p-6 border border-border/40">
                <h2 className="font-serif text-xl font-medium text-primary mb-3">Descrição</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>
            )}

            {/* Características */}
            {features.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-border/40">
                <h2 className="font-serif text-xl font-medium text-primary mb-3">Características</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {features.map((value, idx) => {
                    const feature = getPropertyFeature(value)
                    return <div key={`${value}-${idx}`} className="flex items-center gap-3 text-sm text-primary">
                      <feature.icon className="h-5 w-5 shrink-0 text-[#AD7B3B]" aria-hidden="true" />
                      <span>{feature.label}</span>
                    </div>
                  })}
                </div>
              </div>
            )}

            {detailItems.length > 0 && <div className="bg-white rounded-lg p-6 border border-border/40"><h2 className="font-serif text-xl font-medium text-primary mb-3">Detalhes do imóvel</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{detailItems.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-[#AD7B3B]" />{item}</div>)}</div></div>}

            {(property.reference_point || property.proximity_details) && <div className="bg-white rounded-lg p-6 border border-border/40"><h2 className="font-serif text-xl font-medium text-primary mb-3">Localização</h2>{property.reference_point && <p className="text-sm mb-2"><strong>Ponto de referência:</strong> {property.reference_point}</p>}{property.proximity_details && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{property.proximity_details}</p>}</div>}

            {property.floor_plan_url && <div className="bg-white rounded-lg p-6 border border-border/40"><h2 className="font-serif text-xl font-medium text-primary mb-3 flex items-center gap-2"><FileImage className="h-5 w-5" /> Planta baixa</h2><a href={property.floor_plan_url} target="_blank" rel="noreferrer" className="text-[#AD7B3B] underline">Abrir planta baixa</a></div>}

            {/* Informações Complementares */}
            <div className="bg-white rounded-lg p-6 border border-border/40">
              <h2 className="font-serif text-xl font-medium text-primary mb-4">Informações Complementares</h2>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {property.iptu != null && property.iptu > 0 && (
                  <>
                    <div>
                      <dt className="text-muted-foreground">IPTU</dt>
                      <dd className="font-medium">{formatCurrency(property.iptu)}/mês</dd>
                    </div>
                  </>
                )}
                {property.condo_fee != null && property.condo_fee > 0 && (
                  <>
                    <div>
                      <dt className="text-muted-foreground">Condomínio</dt>
                      <dd className="font-medium">{formatCurrency(property.condo_fee)}/mês</dd>
                    </div>
                  </>
                )}
                {property.gas_fee != null && property.gas_fee > 0 && (
                  <>
                    <div>
                      <dt className="text-muted-foreground">Gás</dt>
                      <dd className="font-medium">{formatCurrency(property.gas_fee)}/mês</dd>
                    </div>
                  </>
                )}
                {property.water_fee != null && property.water_fee > 0 && (
                  <>
                    <div>
                      <dt className="text-muted-foreground">Água</dt>
                      <dd className="font-medium">{formatCurrency(property.water_fee)}/mês</dd>
                    </div>
                  </>
                )}
                {property.electricity_fee != null && property.electricity_fee > 0 && (
                  <>
                    <div>
                      <dt className="text-muted-foreground">Eletricidade</dt>
                      <dd className="font-medium">{formatCurrency(property.electricity_fee)}/mês</dd>
                    </div>
                  </>
                )}
                {property.other_fees != null && property.other_fees > 0 && (
                  <>
                    <div>
                      <dt className="text-muted-foreground">Outras Taxas</dt>
                      <dd className="font-medium">{formatCurrency(property.other_fees)}/mês</dd>
                    </div>
                  </>
                )}
                <div>
                  <dt className="text-muted-foreground">Código Postal</dt>
                  <dd className="font-medium">{property.zip_code}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cadastrado em</dt>
                  <dd className="font-medium">{formatDate(property.created_at)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Coluna Lateral - Preços e Contato */}
          <div className="space-y-6">
            {/* Preços */}
            {(hasRent || hasSale) && (
              <div className="bg-white rounded-lg p-6 border border-border/40 shadow-xs sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-medium text-primary">Valores</h2>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Negociação Direta
                  </span>
                </div>
                <div className="space-y-4">
                  {hasRent && (
                    <div className="border-b border-border/40 pb-4">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Aluguel</div>
                      <div className="text-3xl font-semibold text-primary">
                        {formatCurrency(property.rent_price)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">/mês</span>
                      </div>

                      {/* Estimativa de custo total mensal para locatário */}
                      {monthlyTotal > property.rent_price && (
                        <div className="mt-3 p-3 bg-muted/40 rounded-lg border border-border/30">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Estimativa total mensal:</span>
                            <span className="font-semibold text-primary text-sm">{formatCurrency(monthlyTotal)}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Inclui aluguel + taxas discriminadas.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {hasSale && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Valor de Venda</div>
                      <div className="text-3xl font-semibold text-emerald-700">
                        {formatCurrency(property.sale_price)}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-6 space-y-3">
                  <Button
                    className="w-full bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white font-medium shadow-xs"
                    size="lg"
                    onClick={() => {
                      if (!contact.whatsapp) return
                      const humanizedMsg = encodeURIComponent(
                        `Olá! Vi o imóvel "${property.title}" (${TYPE_LABELS[property.type]}) no portal da imobiliária e gostaria de mais informações e verificar a disponibilidade de visita.`
                      )
                      window.open(`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}?text=${humanizedMsg}`, '_blank')
                    }}
                    disabled={!contact.whatsapp}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-primary/30 hover:bg-primary/5"
                    size="lg"
                    onClick={() => contact.email && (window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(`Interesse no imóvel ${property.title}`)}`)}
                    disabled={!contact.email}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Enviar E-mail
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 font-medium"
                    size="lg"
                    onClick={() => setShareModalOpen(true)}
                  >
                    <Share2 className="h-4 w-4 mr-2 text-emerald-600" />
                    Compartilhar no WhatsApp
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-border/40 text-xs text-muted-foreground text-center">
                  <Calendar className="h-4 w-4 mx-auto mb-1 opacity-50" />
                  Publicado em {formatDate(property.created_at)}
                </div>
              </div>
            )}
          </div>
        </div>
        <section className="mt-8 overflow-hidden rounded-lg border border-border/40 bg-white p-4 sm:p-6" aria-label="Localização no mapa">
          <h2 className="mb-4 font-serif text-xl font-medium text-primary">Localização no mapa</h2>
          {hasMapPoint ? <>
            <iframe
              title="Mapa da localização do imóvel"
              className="h-80 w-full rounded-md border-0 sm:h-96"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(property.longitude) - 0.01}%2C${Number(property.latitude) - 0.01}%2C${Number(property.longitude) + 0.01}%2C${Number(property.latitude) + 0.01}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`}
            />
            <a className="mt-2 inline-block text-xs text-muted-foreground underline hover:text-primary" href={`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=16/${property.latitude}/${property.longitude}`} target="_blank" rel="noreferrer">Ver no OpenStreetMap</a>
          </> : <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-border/60 bg-[#EEECE5]/50 p-6 text-center">
            <MapPin className="mb-3 h-7 w-7 text-[#AD7B3B]" aria-hidden="true" />
            <p className="text-sm text-primary">O ponto exato deste imóvel ainda não foi confirmado.</p>
            <p className="mt-1 text-xs text-muted-foreground">{fullAddress}</p>
            <a className="mt-3 text-sm font-medium text-[#AD7B3B] underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noreferrer">Pesquisar o endereço no Google Maps</a>
          </div>}
        </section>

        {slug && property && (
          <SharePropertyModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            property={property}
            slug={slug}
          />
        )}
      </main>
    </div>
  )
}
