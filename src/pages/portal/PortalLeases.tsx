import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  FileCheck,
  CheckCircle2,
  Printer,
} from 'lucide-react'
import { useLeases, useProperties, useProfiles } from '@/hooks/useSupabase'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { generateRentalContract, type GeneratedContract } from '@/lib/contractGenerator'
import { useToast } from '@/components/ui/toast'
import type { Lease } from '@/types'

type LeaseStatus = 'ativo' | 'pendente' | 'cancelado' | 'vencido'

const STATUS_LABELS: Record<LeaseStatus, string> = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
  vencido: 'Vencido',
}

export function PortalLeases() {
  const { user, profile, organization } = useAuth()
  const { data: leases, loading, refetch } = useLeases()
  const { data: properties } = useProperties()
  const { data: profiles } = useProfiles()
  const { addToast } = useToast()

  const [selectedLease, setSelectedLease] = React.useState<Lease | null>(null)
  const [minuta, setMinuta] = React.useState<GeneratedContract | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [assinando, setAssinando] = React.useState(false)

  const enrichedLeases = (leases || []).map((lease) => ({
    ...lease,
    property: properties?.find((p) => p.id === lease.property_id),
    tenant: profiles?.find((p) => p.id === lease.tenant_id),
    landlord: profiles?.find((p) => p.id === lease.landlord_id),
  }))

  const handleOpenMinuta = (lease: (typeof enrichedLeases)[0]) => {
    const prop = lease.property
    const tenant = lease.tenant || profile
    const landlord = lease.landlord

    if (!prop) {
      addToast('Não foi possível carregar os dados completos do imóvel para visualização.', 'error')
      return
    }

    const doc = generateRentalContract({
      lease,
      property: prop,
      tenant: tenant || { full_name: 'Locatário', id: lease.tenant_id } as any,
      landlord: landlord || { full_name: organization?.name || 'Locador', id: lease.landlord_id } as any,
      organization,
    })

    setSelectedLease(lease)
    setMinuta(doc)
    setModalOpen(true)
  }

  const handleSignContract = async () => {
    if (!selectedLease || !user) return
    setAssinando(true)
    try {
      const nowIso = new Date().toISOString()
      
      // Atualiza o signatário correspondente no array signers
      const currentSigners = Array.isArray(selectedLease.signers) ? [...selectedLease.signers] : []
      let foundSigner = false
      
      currentSigners.forEach((s) => {
        if (s.email === user.email || s.id === user.id) {
          s.status = 'assinado'
          s.signed_at = nowIso
          s.ip_address = 'Autenticado no Portal do Cliente'
          s.signature_hash = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
          foundSigner = true
        }
      })

      // Se não achou diretamente, mas o usuário é o locatário do contrato:
      if (!foundSigner && selectedLease.tenant_id === user.id) {
        currentSigners.forEach((s) => {
          if (s.role === 'locatario') {
            s.status = 'assinado'
            s.signed_at = nowIso
            s.ip_address = 'Autenticado no Portal do Cliente'
            s.signature_hash = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
          }
        })
      }

      const allSigned = currentSigners.length > 0 && currentSigners.every((s) => s.status === 'assinado')

      const { error } = await supabase
        .from('leases')
        .update({
          signers: currentSigners,
          signature_status: allSigned ? 'assinado' : 'aguardando_assinaturas',
          signed_at: allSigned ? nowIso : selectedLease.signed_at,
          status: allSigned ? 'ativo' : selectedLease.status,
        })
        .eq('id', selectedLease.id)

      if (error) throw error

      addToast('Contrato assinado eletronicamente com sucesso!', 'success')
      setModalOpen(false)
      await refetch()
    } catch (err: any) {
      console.error('Erro ao assinar contrato:', err)
      addToast(err?.message || 'Falha ao assinar o contrato.', 'error')
    } finally {
      setAssinando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-medium text-primary">Meus Contratos de Locação</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Consulte as condições, vigência e realize a assinatura digital do seu contrato de locação.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : enrichedLeases.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border rounded-lg text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40 text-primary" />
          <p className="font-medium">Você não possui locações cadastradas</p>
          <p className="text-xs mt-1">Quando houver um contrato emitido em seu nome ou CPF, ele será listado aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrichedLeases.map((lease) => (
            <Card key={lease.id} className="border-border/80 shadow-xs hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base text-primary">
                      {lease.property?.title || 'Imóvel vinculado'}
                    </CardTitle>
                    {lease.property && (
                      <CardDescription className="text-xs mt-0.5">
                        {lease.property.address}, {lease.property.neighborhood || ''} — {lease.property.city}/{lease.property.state}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lease.signature_status && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          lease.signature_status === 'assinado'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {lease.signature_status === 'assinado'
                          ? 'Assinado Eletronicamente'
                          : 'Aguardando Assinatura'}
                      </Badge>
                    )}
                    <Badge variant={lease.status === 'ativo' ? 'default' : lease.status === 'cancelado' ? 'destructive' : 'secondary'}>
                      {STATUS_LABELS[lease.status]}
                    </Badge>
                  </div>
                </div>

                {lease.signature_status === 'aguardando_assinaturas' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                    <span className="font-medium flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-amber-700 shrink-0" />
                      Sua assinatura eletrônica é solicitada neste contrato.
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleOpenMinuta(lease)}
                      className="bg-amber-800 hover:bg-amber-900 text-white shrink-0 text-xs"
                    >
                      Revisar e Assinar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-3 bg-muted/30 rounded-lg border border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-[11px]">Início</p>
                      <p className="font-semibold text-foreground">
                        {new Date(lease.start_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-[11px]">Término</p>
                      <p className="font-semibold text-foreground">
                        {new Date(lease.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-muted-foreground text-[11px]">Aluguel Mensal</p>
                      <p className="font-semibold text-emerald-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lease.monthly_rent)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-[11px]">Vencimento</p>
                      <p className="font-semibold text-foreground">Todo dia {lease.payment_day}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Código do Contrato: <strong className="text-foreground">{lease.id.slice(0, 8).toUpperCase()}</strong>
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenMinuta(lease)}
                      className="text-xs gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Visualizar Contrato Completo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Leitura / Assinatura de Minuta */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center justify-between pr-6">
              <span>{minuta?.title || 'Contrato de Locação Residencial'}</span>
              <Badge variant="outline" className="text-xs bg-muted">
                {minuta?.contractNumber}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Instrumento particular de locação nos termos da Lei Federal nº 8.245/1991.
            </DialogDescription>
          </DialogHeader>

          {minuta && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 my-2">
              {/* Box de Signatários */}
              <div className="bg-muted/40 p-3 rounded-md border text-xs">
                <span className="font-semibold text-primary block mb-2">Partes e Signatários:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {minuta.signers.map((s, idx) => (
                    <div key={idx} className="bg-card p-2 rounded border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        {s.role}
                      </span>
                      <strong className="truncate block text-foreground">{s.name}</strong>
                      <span className="text-muted-foreground text-[11px] truncate block">{s.email || 'Documento cadastrado'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conteúdo HTML do Contrato */}
              <div
                className="p-6 bg-white rounded-md border shadow-xs text-foreground"
                dangerouslySetInnerHTML={{ __html: minuta.htmlContent }}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir / Salvar PDF
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Fechar
              </Button>

              {selectedLease?.signature_status === 'aguardando_assinaturas' && (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <span className="text-[10px] text-muted-foreground hidden md:inline">
                    Ao clicar, você anui formalmente com este contrato (MP 2.200-2 / Lei 14.063).
                  </span>
                  <Button
                    size="sm"
                    disabled={assinando}
                    onClick={handleSignContract}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 text-xs shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {assinando ? 'Registrando Assinatura...' : 'Assinar Eletronicamente Agora'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
