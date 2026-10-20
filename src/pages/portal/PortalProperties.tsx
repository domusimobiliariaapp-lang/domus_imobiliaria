import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Home,
  MapPin,
  Bed,
  Bath,
  Car,
  FileText,
  DollarSign,
  Building,
  ShieldCheck,
  Phone,
  Mail,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProperties, useLeases } from '@/hooks/useSupabase'
import { formatBRL } from '@/lib/repasse'
import { Link } from 'react-router-dom'

export function PortalProperties() {
  const { profile, organization } = useAuth()
  const { data: properties, loading: loadingProperties } = useProperties()
  const { data: leases, loading: loadingLeases } = useLeases()

  const isLocatario = profile?.tipo_relacao === 'locatario'
  const isLocador = profile?.tipo_relacao === 'locador'

  const activeLease = (leases || []).find((l) => l.status === 'ativo') || (leases || [])[0]
  const rentedProperty = activeLease
    ? (properties || []).find((p) => p.id === activeLease.property_id)
    : (properties || [])[0]

  const loading = loadingProperties || loadingLeases

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Visualização para Locatário: Imóvel que ele loca
  if (isLocatario || (activeLease && !isLocador)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-medium text-primary">Meu Imóvel Locado</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Informações detalhadas sobre a unidade e condomínio do seu contrato de aluguel.
          </p>
        </div>

        {!rentedProperty ? (
          <div className="text-center py-16 bg-muted/20 border rounded-lg text-muted-foreground">
            <Home className="h-12 w-12 mx-auto mb-3 opacity-40 text-primary" />
            <p className="font-medium">Nenhum imóvel locado encontrado</p>
            <p className="text-xs mt-1">Assim que seu contrato for emitido, as informações do seu lar aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Foto e Características */}
            <div className="md:col-span-2 space-y-6">
              <Card className="overflow-hidden border-border/80 shadow-xs">
                <div className="aspect-[16/9] bg-muted relative overflow-hidden flex items-center justify-center">
                  {rentedProperty.images?.[0] ? (
                    <img
                      src={rentedProperty.images[0]}
                      alt={rentedProperty.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Home className="h-16 w-16 opacity-30" />
                      <span className="text-xs">Foto do imóvel</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary/90 text-white font-normal text-xs backdrop-blur">
                      Imóvel Locado
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-xl font-serif text-primary">
                    {rentedProperty.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {rentedProperty.address}, {rentedProperty.neighborhood || ''} — {rentedProperty.city}/{rentedProperty.state}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Atributos do Imóvel */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30 border border-border/60 text-center">
                    <div>
                      <span className="text-[11px] text-muted-foreground block flex items-center justify-center gap-1">
                        <Bed className="h-3.5 w-3.5" /> Quartos
                      </span>
                      <strong className="text-sm font-semibold">{rentedProperty.bedrooms || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block flex items-center justify-center gap-1">
                        <Bath className="h-3.5 w-3.5" /> Banheiros
                      </span>
                      <strong className="text-sm font-semibold">{rentedProperty.bathrooms || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block flex items-center justify-center gap-1">
                        <Car className="h-3.5 w-3.5" /> Vagas
                      </span>
                      <strong className="text-sm font-semibold">{rentedProperty.parking || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block flex items-center justify-center gap-1">
                        <Building className="h-3.5 w-3.5" /> Área Útil
                      </span>
                      <strong className="text-sm font-semibold">{rentedProperty.area_m2 || 0} m²</strong>
                    </div>
                  </div>

                  {/* Encargos e Taxas */}
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-3">Valores e Taxas Contratuais</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg border bg-card">
                        <span className="text-[11px] text-muted-foreground block">Aluguel Mensal</span>
                        <strong className="text-base text-emerald-700">
                          {formatBRL(activeLease?.monthly_rent || rentedProperty.rent_price || 0)}
                        </strong>
                      </div>
                      <div className="p-3 rounded-lg border bg-card">
                        <span className="text-[11px] text-muted-foreground block">Condomínio Estimado</span>
                        <strong className="text-base text-foreground">
                          {rentedProperty.condo_fee ? formatBRL(rentedProperty.condo_fee) : 'Incluso / Não há'}
                        </strong>
                      </div>
                      <div className="p-3 rounded-lg border bg-card">
                        <span className="text-[11px] text-muted-foreground block">IPTU Mensal</span>
                        <strong className="text-base text-foreground">
                          {rentedProperty.iptu ? formatBRL(rentedProperty.iptu) : 'Incluso / Isento'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  {rentedProperty.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-primary mb-2">Sobre o Imóvel</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {rentedProperty.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna Lateral: Contato da Imobiliária e Ações */}
            <div className="space-y-6">
              <Card className="border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Administrado por
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                    <span className="font-semibold text-foreground text-sm block">
                      {organization?.name || 'Imobiliária'}
                    </span>
                    <span className="text-muted-foreground text-[11px] block mt-0.5">
                      Gestão e Suporte ao Locatário
                    </span>
                  </div>

                  <div className="space-y-2 text-muted-foreground">
                    {organization?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        <span>{organization.phone}</span>
                      </div>
                    )}
                    {organization?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        <span>{organization.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t flex flex-col gap-2">
                    <Button asChild size="sm" className="w-full bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white text-xs">
                      <Link to="/portal/leases">
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        Visualizar Contrato
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full text-xs">
                      <Link to="/portal/payments">
                        <DollarSign className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                        2ª Via de Boletos
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="w-full text-xs text-primary">
                      <Link to="/portal/documents">
                        Laudos de Vistoria do Imóvel
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Visualização para Locador/Proprietário: Lista dos imóveis de sua posse
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-medium text-primary">Meus Imóveis</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Acompanhe o status e a ocupação dos seus imóveis sob gestão da imobiliária.
        </p>
      </div>

      {(!properties || properties.length === 0) ? (
        <div className="text-center py-16 bg-muted/20 border rounded-lg text-muted-foreground">
          <Home className="h-12 w-12 mx-auto mb-3 opacity-40 text-primary" />
          <p className="font-medium">Nenhum imóvel cadastrado sob sua titularidade</p>
          <p className="text-xs mt-1">Entre em contato com a imobiliária para cadastrar novos imóveis.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const leaseOfProperty = (leases || []).find((l) => l.property_id === property.id && l.status === 'ativo')
            return (
              <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow border-border/80">
                <div className="aspect-[16/10] bg-muted relative flex items-center justify-center">
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Home className="h-12 w-12 text-muted-foreground opacity-40" />
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant={property.status === 'alugado' ? 'default' : 'secondary'} className="text-xs">
                      {property.status === 'alugado' ? 'Alugado' : property.status === 'disponivel' ? 'Disponível' : property.status}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium line-clamp-1 text-primary">
                    {property.title}
                  </CardTitle>
                  <CardDescription className="text-xs truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    {property.address}, {property.city} - {property.state}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Aluguel Cadastrado</span>
                      <strong className="text-emerald-700 font-semibold">
                        {property.rent_price > 0 ? formatBRL(property.rent_price) : '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Contrato Atual</span>
                      <span className="font-medium text-foreground">
                        {leaseOfProperty ? `Ativo (Dia ${leaseOfProperty.payment_day})` : 'Sem locatário'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-border/50">
                    <Button asChild variant="outline" size="sm" className="w-full text-xs">
                      <Link to="/portal/repasses">
                        Ver Extrato de Repasse
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
