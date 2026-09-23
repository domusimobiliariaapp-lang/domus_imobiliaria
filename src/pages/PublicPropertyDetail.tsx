import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Home, MapPin, Bed, Bath, Car, ArrowLeft, Calendar, Square } from 'lucide-react'
import { useProperty } from '@/hooks/useSupabase'
import { PropertyGallery } from '@/components/PropertyGallery'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PropertyType, PropertyStatus } from '@/types'

const TYPE_LABELS: Record<PropertyType, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  comercial: 'Comercial',
  terreno: 'Terreno',
  sala: 'Sala',
  galpao: 'Galpão',
  loja: 'Loja',
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
  const { id } = useParams<{ id: string }>()
  const { data: property, loading, error } = useProperty(id ?? null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
          <Link to="/imoveis" className="mt-6 inline-block">
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
          <Link to="/imoveis">
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
  const hasRent = property.rent_price > 0
  const hasSale = property.sale_price > 0

  return (
    <div className="min-h-screen bg-[#EEECE5]">
      {/* Header */}
      <header className="bg-white border-b border-border/40 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/imoveis" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para imóveis
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <div className="bg-white rounded-lg p-6 border border-border/40 sticky top-24">
                <h2 className="font-serif text-xl font-medium text-primary mb-4">Valores</h2>
                <div className="space-y-4">
                  {hasRent && (
                    <div className="border-b border-border/40 pb-4">
                      <div className="text-sm text-muted-foreground mb-1">Aluguel</div>
                      <div className="text-3xl font-semibold text-primary">
                        {formatCurrency(property.rent_price)}
                      </div>
                      <div className="text-xs text-muted-foreground">/mês</div>
                    </div>
                  )}
                  {hasSale && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Venda</div>
                      <div className="text-3xl font-semibold text-emerald-600">
                        {formatCurrency(property.sale_price)}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-6 space-y-3">
                  <Button
                    className="w-full bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white font-medium"
                    size="lg"
                    onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Tenho interesse no imóvel', '_blank')}
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
                    onClick={() => window.location.href = 'mailto:contato@domus.com.br'}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Enviar E-mail
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
      </main>
    </div>
  )
}
