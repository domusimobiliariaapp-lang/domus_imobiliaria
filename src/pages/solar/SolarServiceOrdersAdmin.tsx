import { useState, useEffect } from 'react'
import { Sun, Search, Clock, UserCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { solarService, type SolarServiceOrder } from '@/modules/solar/services/solarService'

export function SolarServiceOrdersAdmin() {
  const { organization } = useAuth()
  const orgId = organization?.id

  const [orders, setOrders] = useState<SolarServiceOrder[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      if (!orgId) return
      const data = await solarService.getServiceOrders(orgId)
      setOrders(data)
    }
    load()
  }, [orgId])

  const filtered = orders.filter(o =>
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    (o.project_title || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.technician_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Sun className="h-4 w-4" /> Módulo de Energia Solar
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Ordens de Serviço (OS de Campo)
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestão das equipes técnicas em campo: instalação física, comissionamento e vistorias.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por OS, projeto ou técnico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          <strong>{orders.length}</strong> ordens de serviço registradas
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((os) => (
          <Card key={os.id} className="border-border/60 hover:border-amber-500/40 transition-all shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={os.status === 'CONCLUIDO' ? 'default' : 'secondary'}
                      className={
                        os.status === 'CONCLUIDO'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                      }
                    >
                      {os.status === 'CONCLUIDO' ? 'Concluída' : 'Em Andamento'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Prioridade: {os.priority}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">{os.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium text-amber-600">
                    {os.project_title}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {os.description}
              </p>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-foreground" />
                  <span>{os.technician_name || 'Técnico Responsável'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Prazo: {os.deadline_date ? new Date(os.deadline_date).toLocaleDateString('pt-BR') : 'A definir'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
export default SolarServiceOrdersAdmin
