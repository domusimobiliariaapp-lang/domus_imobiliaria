import { useState, useEffect } from 'react'
import { Sun, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { solarService, type SolarKit } from '@/modules/solar/services/solarService'

export function SolarKitsAdmin() {
  const { organization } = useAuth()
  const orgId = organization?.id

  const [kits, setKits] = useState<SolarKit[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      if (!orgId) return
      const data = await solarService.getKits(orgId)
      setKits(data)
    }
    load()
  }, [orgId])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
  }

  const filtered = kits.filter(k =>
    (k.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (k.modules || '').toLowerCase().includes(search.toLowerCase()) ||
    (k.inverter || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Sun className="h-4 w-4" /> Módulo de Energia Solar
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Kits Fotovoltaicos & Inversores
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de geradores solares pré-configurados (On-Grid, Off-Grid e Híbridos com Bateria).
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar kit, módulo ou inversor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          <strong>{kits.length}</strong> kits homologados no catálogo
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((k) => (
          <Card key={k.id} className="border-border/60 hover:border-amber-500/50 transition-all shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className="mb-2 text-[11px] uppercase font-bold text-amber-600 border-amber-500/30 bg-amber-500/5">
                    {k.system_type === 'on_grid' ? 'On-Grid' : k.system_type === 'hibrido' ? 'Híbrido + Bateria' : 'Off-Grid'}
                  </Badge>
                  <CardTitle className="text-lg font-bold text-foreground leading-snug">{k.name}</CardTitle>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Potência</span>
                  <span className="text-lg font-black text-amber-600">{k.total_power_kwp} kWp</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 flex-1">
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-muted-foreground block font-semibold mb-0.5">Gerador Fotovoltaico</span>
                  <span className="text-foreground font-medium">{k.modules}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-muted-foreground block font-semibold mb-0.5">Inversor / Conversor</span>
                  <span className="text-foreground font-medium">{k.inverter}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block">Custo Fornecedor</span>
                  <span className="text-sm font-semibold text-muted-foreground">{formatCurrency(k.cost_price)}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-emerald-600 block">Preço de Venda</span>
                  <span className="text-xl font-black text-foreground">{formatCurrency(k.sale_price)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
export default SolarKitsAdmin
