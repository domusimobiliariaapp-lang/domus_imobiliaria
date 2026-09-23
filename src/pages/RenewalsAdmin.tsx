import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Calendar, Clock, Loader2, AlertTriangle } from 'lucide-react'
import { useLeases } from '@/hooks/useSupabase'
import { useProperties } from '@/hooks/useSupabase'
import { useClients } from '@/hooks/useSupabase'
import { useCreateEntity, useUpdateEntity } from '@/hooks/useSupabase'
import type { Lease } from '@/types'
import { format, differenceInDays, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/integrations/supabase/client'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

const getRenewalStatus = (daysLeft: number) => {
  if (daysLeft < 0) return { label: `Vencido há ${Math.abs(daysLeft)} dias`, variant: 'destructive' as const }
  if (daysLeft <= 30) return { label: `${daysLeft} dias (urgente)`, variant: 'default' as const }
  if (daysLeft <= 60) return { label: `${daysLeft} dias (atenção)`, variant: 'secondary' as const }
  return { label: `${daysLeft} dias`, variant: 'outline' as const }
}

const INDEX_OPTIONS = [
  { value: 'IGPM', label: 'IGP-M' },
  { value: 'IPCA', label: 'IPCA' },
  { value: 'INCC', label: 'INCC' },
  { value: 'NENHUM', label: 'Nenhum' },
]

export function RenewalsAdmin() {
  const { data: leases, loading: leasesLoading, refetch: refetchLeases } = useLeases()
  const { data: properties } = useProperties()
  const { data: clients } = useClients()
  const { update } = useUpdateEntity('leases')
  const { create } = useCreateEntity('lease_history')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'renew' | 'close'>('renew')
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  const [formData, setFormData] = useState({
    new_rent: '',
    index_type: 'IGPM',
    new_end_date: '',
    observations: '',
  })
  const [saving, setSaving] = useState(false)
  const [alertDays, setAlertDays] = useState(60)

  // Load renewal alert days from company settings
  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from('company_settings')
        .select('renewal_alert_days')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()
      if (data?.renewal_alert_days) {
        setAlertDays(data.renewal_alert_days)
      }
    }
    loadSettings()
  }, [])

  // Today for renewal calculations (recomputed when alertDays changes)
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const renewalLeases = leases
    ?.filter(lease => {
      if (lease.status !== 'ativo' || !lease.end_date) return false
      const endDate = new Date(lease.end_date)
      const diffDays = differenceInDays(endDate, today)
      return diffDays <= alertDays
    })
    .map(lease => {
      const endDate = new Date(lease.end_date)
      const daysLeft = differenceInDays(endDate, today)
      const renewalStatus = getRenewalStatus(daysLeft)
      const property = properties?.find(p => p.id === lease.property_id)
      const tenant = clients?.find(c => c.id === lease.tenant_id)
      return { ...lease, daysLeft, renewalStatus, property, tenant }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft) || []

  const handleRenew = async () => {
    if (!selectedLease) return
    setSaving(true)
    try {
      // Update lease with new values
      await update(selectedLease.id, {
        monthly_rent: Number(formData.new_rent),
        end_date: formData.new_end_date,
        // Store index type in notes or a separate field
      })

      // Create history record
      await create({
        lease_id: selectedLease.id,
        tipo: 'Renovação',
        descricao: `Contrato renovado: aluguel de ${formatCurrency(Number(selectedLease.monthly_rent))} para ${formatCurrency(Number(formData.new_rent))}, índice ${formData.index_type}, nova data fim ${format(new Date(formData.new_end_date), 'dd/MM/yyyy', { locale: ptBR })}`,
        observacoes: formData.observations,
        created_by: 'current_user',
      })

      await refetchLeases()
      setDialogOpen(false)
    } catch (err) {
      console.error('Erro ao renovar:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = async () => {
    if (!selectedLease) return
    setSaving(true)
    try {
      // Update lease status
      await update(selectedLease.id, { status: 'encerrado' })

      // Update property status to available
      if (selectedLease.property_id) {
        await update(selectedLease.property_id, { status: 'disponivel' })
      }

      // Create history record
      await create({
        lease_id: selectedLease.id,
        tipo: 'Encerramento',
        descricao: `Contrato encerrado antecipadamente. Aluguel: ${formatCurrency(Number(selectedLease.monthly_rent))}`,
        observacoes: formData.observations,
        created_by: 'current_user',
      })

      await refetchLeases()
      setDialogOpen(false)
    } catch (err) {
      console.error('Erro ao encerrar:', err)
    } finally {
      setSaving(false)
    }
  }

  const openDialog = (type: 'renew' | 'close', lease: Lease) => {
    setActionType(type)
    setSelectedLease(lease)
    if (type === 'renew') {
      const suggestedEndDate = addMonths(new Date(lease.end_date!), 12)
      setFormData({
        new_rent: String(lease.monthly_rent),
        index_type: 'IGPM',
        new_end_date: format(suggestedEndDate, 'yyyy-MM-dd'),
        observations: '',
      })
    } else {
      setFormData({
        new_rent: '',
        index_type: 'NENHUM',
        new_end_date: format(new Date(), 'yyyy-MM-dd'),
        observations: '',
      })
    }
    setDialogOpen(true)
  }

  if (leasesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-medium text-primary">Renovações</h1>
        <p className="text-muted-foreground mt-1">
          Contratos de locação ativos com vencimento dentro de {alertDays} dias (incluindo vencidos)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contratos Próximos ao Vencimento</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renewalLeases.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg">Nenhum contrato próximo ao vencimento</p>
              <p className="text-sm">Todos os contratos ativos têm vencimento superior a {alertDays} dias</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Contrato</TableHead>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Locatário</TableHead>
                    <TableHead className="w-40">Vencimento</TableHead>
                    <TableHead className="w-48">Situação</TableHead>
                    <TableHead className="w-32">Valor Atual</TableHead>
                    <TableHead className="w-48 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renewalLeases.map(lease => (
                    <TableRow key={lease.id}>
                      <TableCell className="font-mono text-sm">{lease.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lease.property?.title || 'Imóvel não encontrado'}</p>
                          <p className="text-xs text-muted-foreground">
                            {lease.property?.neighborhood}, {lease.property?.city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lease.tenant?.full_name || 'Locatário não encontrado'}</p>
                          <p className="text-xs text-muted-foreground">{lease.tenant?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{format(new Date(lease.end_date!), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lease.renewalStatus.variant} className="gap-1">
                          {lease.renewalStatus.variant === 'destructive' && <AlertCircle className="h-3 w-3" />}
                          {lease.renewalStatus.variant === 'default' && <Clock className="h-3 w-3" />}
                          {lease.renewalStatus.variant === 'secondary' && <AlertTriangle className="h-3 w-3" />}
                          {lease.renewalStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{formatCurrency(Number(lease.monthly_rent))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog('renew', lease)}
                            disabled={saving}
                          >
                            Renovar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDialog('close', lease)}
                            disabled={saving}
                          >
                            Encerrar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renewal Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{actionType === 'renew' ? 'Renovar Contrato' : 'Encerrar Contrato'}</DialogTitle>
            <DialogDescription>
              {actionType === 'renew'
                ? 'Preencha os dados da renovação. O histórico será registrado automaticamente.'
                : 'Confirme o encerramento. O imóvel ficará disponível para nova locação.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); actionType === 'renew' ? handleRenew() : handleClose() }} className="space-y-4">
            {actionType === 'renew' && (
              <>
                <div className="space-y-1">
                  <Label>Novo Valor do Aluguel</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.new_rent}
                    onChange={(e) => setFormData({ ...formData, new_rent: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Índice de Reajuste</Label>
                  <Select
                    value={formData.index_type}
                    onValueChange={(v) => setFormData({ ...formData, index_type: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {INDEX_OPTIONS.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Nova Data de Término</Label>
                  <Input
                    type="date"
                    value={formData.new_end_date}
                    onChange={(e) => setFormData({ ...formData, new_end_date: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Observações sobre a renovação/encerramento"
                rows={3}
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={actionType === 'renew' ? handleRenew : handleClose} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : actionType === 'renew' ? 'Confirmar Renovação' : 'Confirmar Encerramento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}