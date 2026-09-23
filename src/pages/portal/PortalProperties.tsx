import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, MapPin, Bed, Bath, Car } from 'lucide-react'
import { useProperties } from '@/hooks/useSupabase'
import type { PropertyStatus } from '@/types'

const STATUS_LABELS: Record<PropertyStatus, string> = {
  disponivel: 'Disponível',
  alugado: 'Alugado',
  vendido: 'Vendido',
  reservado: 'Reservado',
  indisponivel: 'Indisponível',
}

export function PortalProperties() {
  const { data: properties, loading } = useProperties()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-medium text-primary">Imóveis</h1>
        <p className="text-muted-foreground mt-1">Explore nossos imóveis disponíveis</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (!properties || properties.length === 0) ? (
        <div className="text-center py-12 text-muted-foreground">
          <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum imóvel cadastrado no momento</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <Home className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium line-clamp-1">{property.title}</CardTitle>
                  <Badge variant={property.status === 'disponivel' ? 'default' : 'secondary'}>
                    {STATUS_LABELS[property.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{property.address}, {property.city} - {property.state}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {property.bedrooms && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Bed className="h-4 w-4" />
                        <span>{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Bath className="h-4 w-4" />
                        <span>{property.bathrooms}</span>
                      </div>
                    )}
                    {property.parking && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Car className="h-4 w-4" />
                        <span>{property.parking}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span className="text-xs">Área: {property.area_m2} m²</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div>
                    {property.rent_price > 0 && (
                      <div className="text-xs text-muted-foreground">Aluguel</div>
                    )}
                    <div className="font-semibold text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.rent_price)}
                    </div>
                  </div>
                  <div>
                    {property.sale_price > 0 && (
                      <div className="text-xs text-muted-foreground">Venda</div>
                    )}
                    <div className="font-semibold text-emerald-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.sale_price)}
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-4 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white">
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
