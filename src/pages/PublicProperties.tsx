import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Home, MapPin, Bed, Bath, Car, Search, Filter } from 'lucide-react'
import { useProperties } from '@/hooks/useSupabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PropertyType, PropertyStatus } from '@/types'
import { useState } from 'react'

const TYPE_LABELS: Record<PropertyType, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  comercial: 'Comercial',
  terreno: 'Terreno',
  sala: 'Sala',
  galpao: 'Galpão',
  loja: 'Loja',
}

const TYPE_FILTERS: { value: PropertyType | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'sala', label: 'Sala' },
  { value: 'loja', label: 'Loja' },
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

export function PublicProperties() {
  const { data: properties, loading } = useProperties()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<PropertyType | 'todos'>('todos')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const filteredProperties = properties?.filter(property => {
    const matchesSearch = searchTerm === '' ||
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'todos' || property.type === typeFilter

    return matchesSearch && matchesType
  }) || []

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-[#EEECE5]">
      {/* Header */}
      <header className="bg-white border-b border-border/40 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-medium text-primary">
                Imóveis Disponíveis
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Encontre o imóvel dos seus sonhos
              </p>
            </div>
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/5">
                Área do Cliente
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="bg-white border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome, endereço ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-6 bg-[#EEECE5] border-border/40 focus:bg-white transition-colors"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`md:w-40 flex items-center justify-center gap-2 ${showFilters ? 'bg-primary/5 border-primary/30' : ''}`}
            >
              <Filter className="h-4 w-4" />
              {typeFilter === 'todos' ? 'Todos os tipos' : TYPE_LABELS[typeFilter as PropertyType]}
            </Button>
          </div>

          {/* Type Filter Pills */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {TYPE_FILTERS.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setTypeFilter(type.value as PropertyType | 'todos')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    typeFilter === type.value
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Properties Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-24">
            <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-serif font-medium text-primary mb-2">
              Nenhum imóvel encontrado
            </h2>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou buscar por outro termo.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-muted-foreground">
              {filteredProperties.length} {filteredProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((property) => (
                <Link
                  key={property.id}
                  to={`/imovel/${property.id}`}
                  className="group block bg-white rounded-lg overflow-hidden border border-border/40 hover:shadow-lg transition-all duration-300"
                >
                  {/* Imagem de Capa */}
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-12 w-12 text-muted-foreground opacity-50" />
                      </div>
                    )}
                    {property.videos && property.videos.length > 0 && (
                      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Vídeo
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge
                        className={`${STATUS_COLORS[property.status]} text-xs font-normal`}
                      >
                        {STATUS_LABELS[property.status]}
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-serif font-medium text-primary text-lg mb-1 line-clamp-1 group-hover:text-[#AD7B3B] transition-colors">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{property.neighborhood}, {property.city}</span>
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {property.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{property.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>{property.bathrooms}</span>
                        </div>
                      )}
                      {property.parking && (
                        <div className="flex items-center gap-1">
                          <Car className="h-4 w-4" />
                          <span>{property.parking}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>{property.area_m2} m²</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                      <div>
                        {property.rent_price > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground">Aluguel</div>
                            <div className="font-semibold text-primary">
                              {formatCurrency(property.rent_price)}
                            </div>
                          </div>
                        )}
                        {property.sale_price > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground">Venda</div>
                            <div className="font-semibold text-emerald-600">
                              {formatCurrency(property.sale_price)}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {TYPE_LABELS[property.type]}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
