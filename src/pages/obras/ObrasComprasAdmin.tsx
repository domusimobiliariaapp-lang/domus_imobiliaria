import { useState, useEffect } from 'react'
import {
  HardHat,
  Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { obrasService, type ObraPedidoCompra, type ObraProjeto } from '@/modules/obras/services/obrasService'

const STATUS_PEDIDO = {
  pendente: { label: 'Pendente', color: 'bg-slate-500/10 text-slate-700 border-slate-300' },
  cotacao: { label: 'Em Cotação', color: 'bg-amber-500/10 text-amber-700 border-amber-300' },
  aprovado: { label: 'Aprovado / Comprado', color: 'bg-blue-500/10 text-blue-700 border-blue-300' },
  entregue: { label: 'Entregue no Canteiro', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-300' },
  cancelado: { label: 'Cancelado', color: 'bg-rose-500/10 text-rose-700 border-rose-300' }
}

export function ObrasComprasAdmin() {
  const { organization } = useAuth()
  const orgId = organization?.id

  const [obras, setObras] = useState<ObraProjeto[]>([])
  const [selectedObraId, setSelectedObraId] = useState<string>('')
  const [pedidos, setPedidos] = useState<ObraPedidoCompra[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      if (!orgId) return
      const obrasData = await obrasService.getObras(orgId)
      setObras(obrasData)
      const defaultObraId = obrasData[0]?.id || ''
      setSelectedObraId(defaultObraId)
      const pedidosData = await obrasService.getPedidosCompra(defaultObraId, orgId)
      setPedidos(pedidosData)
    }
    load()
  }, [orgId])

  const handleSelectObra = async (obraId: string) => {
    setSelectedObraId(obraId)
    if (!orgId) return
    const pedidosData = await obrasService.getPedidosCompra(obraId, orgId)
    setPedidos(pedidosData)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
  }

  const filtered = pedidos.filter(p =>
    p.numero.toLowerCase().includes(search.toLowerCase()) ||
    p.fornecedor_nome.toLowerCase().includes(search.toLowerCase()) ||
    p.itens_descricao.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <HardHat className="h-4 w-4" /> Módulo de Engenharia & Obras
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Compras & Insumos da Construção
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle de pedidos de compra, cotação de materiais e recebimento em canteiro de obras.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Label className="text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">Obra Destino:</Label>
          <Select value={selectedObraId} onValueChange={handleSelectObra}>
            <SelectTrigger className="w-full sm:w-[320px] font-semibold">
              <SelectValue placeholder="Selecione o canteiro de obra" />
            </SelectTrigger>
            <SelectContent>
              {obras.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.numero} - {o.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido ou fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ped) => {
          const statusConfig = STATUS_PEDIDO[ped.status] || STATUS_PEDIDO.pendente
          return (
            <Card key={ped.id} className="border-border/60 hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-muted-foreground">{ped.numero}</span>
                    <CardTitle className="text-base font-bold text-foreground leading-snug mt-0.5">{ped.fornecedor_nome}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Destino: {ped.obra_nome}</p>
                  </div>
                  <Badge variant="outline" className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 flex-1">
                <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/40 line-clamp-3">
                  {ped.itens_descricao}
                </p>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground block">Entrega Prevista</span>
                    <strong className="text-foreground">{ped.data_entrega_prevista ? new Date(ped.data_entrega_prevista).toLocaleDateString('pt-BR') : 'A combinar'}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block">Valor do Pedido</span>
                    <strong className="text-base text-primary font-black">{formatCurrency(ped.valor_total)}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
export default ObrasComprasAdmin
