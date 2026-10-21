import { useEffect, useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Home, MapPin, Bed, Bath, Car, Search, Filter, X, Sparkles } from 'lucide-react'
import { usePublicProperties } from '@/hooks/useSupabase'
import { useSEO } from '@/hooks/useSEO'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PropertyType, PropertyStatus } from '@/types'

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

const TYPE_FILTERS: { value: PropertyType | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os Tipos' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'studio', label: 'Kitnet / Studio' },
  { value: 'sobrado', label: 'Sobrado' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'sala', label: 'Sala Comercial' },
  { value: 'loja', label: 'Loja' },
  { value: 'chacara', label: 'Chácara / Sítio' },
]

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

type TransacaoFilter = 'todos' | 'aluguel' | 'venda'
type SortOption = 'recentes' | 'menor_preco' | 'maior_preco'

export function PublicProperties() {
  const { slug } = useParams<{ slug: string }>()
  const { data: properties, loading, error } = usePublicProperties(slug ?? null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<PropertyType | 'todos'>('todos')
  const [transacaoFilter, setTransacaoFilter] = useState<TransacaoFilter>('todos')
  const [sortBy, setSortBy] = useState<SortOption>('recentes')
  const [showFilters, setShowFilters] = useState(false)

  const orgDisplayName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Domus'

  // Open-SEO: Otimização de título, metatags e canonical para vitrine pública
  useSEO({
    title: `Imóveis Disponíveis para Venda e Locação | ${orgDisplayName}`,
    description: `Confira os melhores imóveis disponíveis para alugar ou comprar com a ${orgDisplayName}. Casas, apartamentos e salas comerciais selecionados.`,
    canonical: window.location.href,
    og: {
      title: `Imóveis Disponíveis para Aluguel e Venda | ${orgDisplayName}`,
      description: `Encontre seu próximo imóvel com a ${orgDisplayName}. Atendimento direto e negociações transparentes.`,
      url: window.location.href,
      type: 'website',
      siteName: orgDisplayName,
      image: properties?.[0]?.images?.[0],
    },
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (error) {
    console.error('Erro ao carregar imóveis:', error)
  }

  const filteredProperties = useMemo(() => {
    if (!properties) return []

    const result = properties.filter((property) => {
      // 1. Busca textual
      const matchesSearch =
        searchTerm === '' ||
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase())

      // 2. Filtro de tipo
      const matchesType = typeFilter === 'todos' || property.type === typeFilter

      // 3. Filtro de transação (aluguel vs venda)
      const matchesTransacao =
        transacaoFilter === 'todos' ||
        (transacaoFilter === 'aluguel' && property.rent_price > 0) ||
        (transacaoFilter === 'venda' && property.sale_price > 0)

      return matchesSearch && matchesType && matchesTransacao
    })

    // Ordenação
    return result.sort((a, b) => {
      if (sortBy === 'menor_preco') {
        const priceA = a.rent_price || a.sale_price || 0
        const priceB = b.rent_price || b.sale_price || 0
        return priceA - priceB
      }
      if (sortBy === 'maior_preco') {
        const priceA = a.sale_price || a.rent_price || 0
        const priceB = b.sale_price || b.rent_price || 0
        return priceB - priceA
      }
      // Padrão: mais recentes (por created_at)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [properties, searchTerm, typeFilter, transacaoFilter, sortBy])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const hasActiveFilters = searchTerm !== '' || typeFilter !== 'todos' || transacaoFilter !== 'todos'

  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('todos')
    setTransacaoFilter('todos')
    setSortBy('recentes')
  }

  return (
    <div className="min-h-screen bg-[#EEECE5]">
      {/* Header com identidade da imobiliária */}
      <header className="bg-white border-b border-border/40 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif font-medium text-primary">
                  {orgDisplayName}<span className="text-[#AD7B3B]">.</span>
                </h1>
                <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-normal border-border/60 text-muted-foreground">
                  Vitrine de Imóveis
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Imóveis selecionados com atendimento humanizado e transparência
              </p>
            </div>
            {/* Rota correta para o portal do cliente no multi-tenant */}
            <Link to={slug ? `/${slug}/portal/login` : '/login'}>
              <Button variant="outline" size="sm" className="border-[#AD7B3B]/40 text-primary hover:bg-[#AD7B3B]/10 text-xs sm:text-sm shadow-2xs">
                Área do Cliente
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero & Painel de Busca com Micro-interações */}
      <div className="bg-white border-b border-border/40 pb-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
          {/* Abas Rápidas de Transação (Alugar vs Comprar) */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setTransacaoFilter('todos')}
              className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all ${
                transacaoFilter === 'todos'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted'
              }`}
            >
              Todos os Imóveis
            </button>
            <button
              onClick={() => setTransacaoFilter('aluguel')}
              className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all ${
                transacaoFilter === 'aluguel'
                  ? 'bg-[#17323D] text-white shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted'
              }`}
            >
              Para Alugar
            </button>
            <button
              onClick={() => setTransacaoFilter('venda')}
              className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all ${
                transacaoFilter === 'venda'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted'
              }`}
            >
              Para Comprar
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por bairro, cidade, condomínio ou rua..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-9 py-5 bg-[#EEECE5]/60 border-border/50 focus:bg-white text-sm transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1"
                  title="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm h-11 px-4 ${
                  showFilters || typeFilter !== 'todos' ? 'bg-[#AD7B3B]/10 border-[#AD7B3B]/50 text-primary' : 'border-border/50'
                }`}
              >
                <Filter className="h-4 w-4 text-[#AD7B3B]" />
                {typeFilter === 'todos' ? 'Tipo de Imóvel' : TYPE_LABELS[typeFilter as PropertyType]}
              </Button>

              {/* Ordenação */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Ordenar imóveis"
                  className="h-11 px-3 py-2 bg-white border border-border/50 rounded-md text-xs sm:text-sm text-primary font-medium focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="menor_preco">Menor valor</option>
                  <option value="maior_preco">Maior valor</option>
                </select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-primary px-2"
                  title="Resetar todos os filtros"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Filtros em Chips de Tipo */}
          {showFilters && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[#AD7B3B]" /> Filtrar por categoria:
              </div>
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setTypeFilter(type.value as PropertyType | 'todos')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      typeFilter === type.value
                        ? 'bg-primary text-white shadow-2xs'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-primary'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Imóveis */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-xs text-muted-foreground">Carregando imóveis da imobiliária...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20 bg-white/70 rounded-2xl border border-border/40 p-8 max-w-lg mx-auto shadow-2xs">
            <Home className="h-14 w-14 mx-auto mb-3 text-muted-foreground opacity-40" />
            <h2 className="text-xl font-serif font-medium text-primary mb-1.5">
              Nenhum imóvel encontrado
            </h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Não encontramos imóveis para os filtros atuais. Experimente buscar por outros termos ou limpar a seleção.
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white text-xs font-medium">
                Limpar filtros e ver todos
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <span>
                Exibindo <strong className="text-primary">{filteredProperties.length}</strong>{' '}
                {filteredProperties.length === 1 ? 'imóvel disponível' : 'imóveis disponíveis'}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#AD7B3B] hover:underline font-medium"
                >
                  Ver todos os imóveis ({properties?.length || 0})
                </button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((property) => {
                const hasRent = property.rent_price > 0
                const hasSale = property.sale_price > 0

                return (
                  <Link
                    key={property.id}
                    to={`/${slug}/imovel/${property.id}`}
                    className="group block bg-white rounded-xl overflow-hidden border border-border/40 hover:border-border/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Imagem de Capa */}
                    <div className="aspect-[4/3] bg-muted/60 relative overflow-hidden">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 bg-[#EEECE5]/40">
                          <Home className="h-10 w-10 mb-1" />
                          <span className="text-xs">Foto sob consulta</span>
                        </div>
                      )}

                      {/* Badges de Tipo de Negócio */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <Badge
                          className={`${STATUS_COLORS[property.status]} text-[11px] font-normal backdrop-blur-xs shadow-2xs`}
                        >
                          {STATUS_LABELS[property.status]}
                        </Badge>
                        {hasRent && (
                          <Badge variant="outline" className="bg-blue-900/80 text-white border-0 text-[10px] font-normal">
                            Locação
                          </Badge>
                        )}
                        {hasSale && (
                          <Badge variant="outline" className="bg-emerald-900/80 text-white border-0 text-[10px] font-normal">
                            Venda
                          </Badge>
                        )}
                      </div>

                      {property.videos && property.videos.length > 0 && (
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Vídeo
                        </div>
                      )}
                    </div>

                    {/* Informações Principais */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-medium text-[#AD7B3B]">{TYPE_LABELS[property.type]}</span>
                        <span>{property.area_m2} m² úteis</span>
                      </div>

                      <h3 className="font-serif font-medium text-primary text-lg mb-1.5 line-clamp-1 group-hover:text-[#AD7B3B] transition-colors">
                        {property.title}
                      </h3>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="line-clamp-1">{property.neighborhood}, {property.city}</span>
                      </div>

                      {/* Características Rápidas */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/80 mb-4 py-2 border-y border-border/30">
                        {property.bedrooms ? (
                          <div className="flex items-center gap-1" title={`${property.bedrooms} quartos`}>
                            <Bed className="h-3.5 w-3.5 text-primary/70" />
                            <span>{property.bedrooms} {property.bedrooms === 1 ? 'quarto' : 'quartos'}</span>
                          </div>
                        ) : null}
                        {property.bathrooms ? (
                          <div className="flex items-center gap-1" title={`${property.bathrooms} banheiros`}>
                            <Bath className="h-3.5 w-3.5 text-primary/70" />
                            <span>{property.bathrooms} {property.bathrooms === 1 ? 'banheiro' : 'banheiros'}</span>
                          </div>
                        ) : null}
                        {property.parking ? (
                          <div className="flex items-center gap-1" title={`${property.parking} vagas`}>
                            <Car className="h-3.5 w-3.5 text-primary/70" />
                            <span>{property.parking} {property.parking === 1 ? 'vaga' : 'vagas'}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Preço e CTA */}
                      <div className="flex items-end justify-between pt-1">
                        <div>
                          {hasRent && (
                            <div>
                              <div className="text-[11px] text-muted-foreground">Aluguel mensal</div>
                              <div className="font-semibold text-primary text-base sm:text-lg">
                                {formatCurrency(property.rent_price)}
                              </div>
                            </div>
                          )}
                          {hasSale && (
                            <div className={hasRent ? 'mt-1' : ''}>
                              <div className="text-[11px] text-muted-foreground">Valor de venda</div>
                              <div className="font-semibold text-emerald-700 text-base sm:text-lg">
                                {formatCurrency(property.sale_price)}
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-[#AD7B3B] group-hover:translate-x-0.5 transition-transform">
                          Ver detalhes →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
