import { useState, useEffect } from 'react'
import { Sun, Search, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { solarService, type SolarSupplier } from '@/modules/solar/services/solarService'

export function SolarSuppliersAdmin() {
  const { organization } = useAuth()
  const orgId = organization?.id

  const [suppliers, setSuppliers] = useState<SolarSupplier[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      if (!orgId) return
      const data = await solarService.getSuppliers(orgId)
      setSuppliers(data)
    }
    load()
  }, [orgId])

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.city || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Sun className="h-4 w-4" /> Módulo de Energia Solar
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Fornecedores & Distribuidores Solares
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de fabricantes e distribuidores de módulos fotovoltaicos, inversores e ferragens.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar distribuidor ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          <strong>{suppliers.length}</strong> distribuidores credenciados
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Card key={s.id} className="border-border/60 hover:border-amber-500/40 transition-all shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-1.5 text-[11px] text-amber-600 border-amber-500/30 bg-amber-500/5">
                    {s.category || 'Distribuidor Fotovoltaico'}
                  </Badge>
                  <CardTitle className="text-base font-bold text-foreground">{s.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">CNPJ: {s.document}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-foreground" />
                <span>{s.city} - {s.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-foreground" />
                <span>{s.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-foreground" />
                <span className="truncate">{s.email}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
export default SolarSuppliersAdmin
