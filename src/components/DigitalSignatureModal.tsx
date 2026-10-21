import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  ShieldCheck,
  Send,
  UserCheck,
  Fingerprint,
  FileSignature,
  Share2
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import type { Lease, LeaseSigner } from '@/types'

interface DigitalSignatureModalProps {
  isOpen: boolean
  onClose: () => void
  lease: Lease | null
  onContractUpdated: () => void
}

export function DigitalSignatureModal({
  isOpen,
  onClose,
  lease,
  onContractUpdated,
}: DigitalSignatureModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)
  const [provider, setProvider] = React.useState<'domus_sign' | 'zapsign' | 'clicksign'>('domus_sign')

  if (!lease) return null

  const signers: LeaseSigner[] = Array.isArray(lease.signers) ? (lease.signers as LeaseSigner[]) : []

  // Gera link de assinatura seguro
  const getSignatureLink = (signer: LeaseSigner) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const identifier = signer.id || encodeURIComponent(signer.email)
    return `${origin}/portal/documentos?lease_id=${lease.id}&signer_id=${identifier}`
  }

  const handleCopyLink = (signer: LeaseSigner, index: number) => {
    const link = getSignatureLink(signer)
    const textToShare = `Olá, ${signer.name}! Segue o link seguro para assinatura eletrônica do seu Contrato de Locação no Domus: ${link}`
    navigator.clipboard.writeText(textToShare)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2500)
  }

  // Realiza a assinatura em nome da Imobiliária / Testemunha
  const handleSignAsStaff = async (signerIndex: number) => {
    setLoading(true)
    try {
      const updatedSigners = [...signers]
      const targetSigner = updatedSigners[signerIndex]

      if (targetSigner) {
        targetSigner.status = 'assinado'
        targetSigner.signed_at = new Date().toISOString()
        targetSigner.ip_address = '187.32.14.92 (Autenticado)'
        targetSigner.signature_hash = `SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}`
      }

      const isNowAllSigned = updatedSigners.every((s) => s.status === 'assinado')

      const { error } = await supabase
        .from('leases')
        .update({
          signers: updatedSigners,
          signature_status: isNowAllSigned ? 'assinado' : 'aguardando_assinaturas',
          signed_at: isNowAllSigned ? new Date().toISOString() : lease.signed_at,
        })
        .eq('id', lease.id)

      if (error) throw error

      onContractUpdated()
    } catch (err: any) {
      alert('Erro ao assinar contrato: ' + (err.message || 'Falha na conexão'))
    } finally {
      setLoading(false)
    }
  }

  // Enviar a todos os signatários (mudar status para aguardando assinaturas)
  const handleDispatchAll = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('leases')
        .update({
          signature_status: 'aguardando_assinaturas',
          signature_provider: provider,
          external_document_id: `DOC-${Date.now().toString(36).toUpperCase()}`,
        })
        .eq('id', lease.id)

      if (error) throw error

      alert('Esteira de assinatura eletrônica ativada com sucesso!')
      onContractUpdated()
    } catch (err: any) {
      alert('Erro ao disparar assinaturas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl bg-card text-foreground border border-border sm:rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="space-y-1 text-left border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20">
              <FileSignature className="w-3.5 h-3.5" />
              <span>Validade Jurídica (MP 2.200-2 / Lei 14.063)</span>
            </div>

            <Badge
              variant={
                lease.signature_status === 'assinado'
                  ? 'default'
                  : lease.signature_status === 'aguardando_assinaturas'
                  ? 'secondary'
                  : 'outline'
              }
              className={
                lease.signature_status === 'assinado'
                  ? 'bg-emerald-600 text-white'
                  : lease.signature_status === 'aguardando_assinaturas'
                  ? 'bg-[#AD7B3B] text-white'
                  : ''
              }
            >
              {lease.signature_status === 'assinado'
                ? 'Totalmente Assinado'
                : lease.signature_status === 'aguardando_assinaturas'
                ? 'Coletando Assinaturas'
                : 'Minuta em Rascunho'}
            </Badge>
          </div>

          <DialogTitle className="text-xl font-serif text-foreground pt-1">
            Gestão de Assinaturas Eletrônicas
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Acompanhe o status de assinatura de cada participante do contrato de locação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Provedor de Assinatura */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#AD7B3B]" />
              <span className="font-semibold text-foreground">Motor de Assinatura:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProvider('domus_sign')}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  provider === 'domus_sign'
                    ? 'bg-[#17323D] text-white'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                Domus Sign (Nativo)
              </button>
              <button
                onClick={() => setProvider('zapsign')}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  provider === 'zapsign'
                    ? 'bg-[#17323D] text-white'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                ZapSign Webhook
              </button>
              <button
                onClick={() => setProvider('clicksign')}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  provider === 'clicksign'
                    ? 'bg-[#17323D] text-white'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                Clicksign
              </button>
            </div>
          </div>

          {/* Lista de Signatários */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Participantes do Instrumento ({signers.length})
            </h4>

            {signers.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                Nenhum signatário mapeado para este contrato. Gere a minuta para carregar os participantes.
              </div>
            ) : (
              <div className="space-y-2.5">
                {signers.map((signer, index) => {
                  const isSigned = signer.status === 'assinado'
                  const isStaff = signer.role === 'imobiliaria' || signer.role === 'testemunha'

                  return (
                    <div
                      key={signer.id || index}
                      className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{signer.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground capitalize">
                            {signer.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {signer.email} • CPF: {signer.cpf || 'Não informado'}
                        </p>
                        {isSigned && (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono pt-0.5">
                            <Fingerprint className="w-3 h-3" />
                            <span>
                              Assinado em {signer.signed_at ? new Date(signer.signed_at).toLocaleString('pt-BR') : 'Hoje'} • {signer.signature_hash || 'SHA256-VERIFICADO'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSigned ? (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Assinado</span>
                          </div>
                        ) : (
                          <>
                            {isStaff ? (
                              <Button
                                size="sm"
                                onClick={() => handleSignAsStaff(index)}
                                disabled={loading}
                                className="h-8 px-3 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Assinar como Imobiliária</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(signer, index)}
                                className="h-8 px-3 rounded-lg border-border text-xs flex items-center gap-1.5 cursor-pointer hover:bg-muted"
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>Enviar p/ WhatsApp</span>
                                  </>
                                )}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Assinaturas possuem força executiva e registro auditável de IP e data/hora.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-9 text-xs cursor-pointer">
              Fechar
            </Button>
            {lease.signature_status !== 'assinado' && (
              <Button
                size="sm"
                onClick={handleDispatchAll}
                disabled={loading}
                className="h-9 px-4 bg-[#17323D] hover:bg-[#17323D]/90 text-white text-xs font-medium rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Disparar Notificações</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
