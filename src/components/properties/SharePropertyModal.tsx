import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Share2, Check, Copy, MessageCircle, ExternalLink, Sparkles } from 'lucide-react'
import { generatePropertyShareText, openWhatsAppShare } from '@/lib/whatsappShare'
import type { Property } from '@/types'

interface SharePropertyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Partial<Property>
  slug: string
  orgName?: string
}

export function SharePropertyModal({
  open,
  onOpenChange,
  property,
  slug,
  orgName,
}: SharePropertyModalProps) {
  const [copiedText, setCopiedText] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [targetPhone, setTargetPhone] = useState('')

  // Monta a URL pública correta
  const publicUrl = useMemo(() => {
    const origin = window.location.origin
    return `${origin}/${slug}/imovel/${property.id}`
  }, [slug, property.id])

  // Gera o texto formatado do WhatsApp
  const shareText = useMemo(() => {
    return generatePropertyShareText(property, publicUrl, orgName)
  }, [property, publicUrl, orgName])

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2500)
    } catch {
      // fallback
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } catch {
      // fallback
    }
  }

  const handleSendWhatsApp = () => {
    openWhatsAppShare(shareText, targetPhone)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 bg-white dark:bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-serif">Compartilhar Imóvel no WhatsApp</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Envie uma ficha técnica completa e atrativa com fotos e link direto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Campo opcional de telefone */}
          <div className="space-y-1.5">
            <Label htmlFor="share-phone" className="text-xs font-medium text-foreground">
              Enviar para um número específico (opcional):
            </Label>
            <Input
              id="share-phone"
              placeholder="Ex: (11) 99999-9999 (ou deixe vazio para escolher no WhatsApp)"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Pré-visualização com estilo WhatsApp */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-[#AD7B3B]" /> Prévia da mensagem:
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-emerald-700 hover:text-emerald-800 text-xs font-medium flex items-center gap-1"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar texto
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#EFEAE2] dark:bg-muted/40 p-3.5 rounded-xl border border-border/50 text-xs font-mono text-[#111B21] dark:text-foreground whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed shadow-inner">
              {shareText}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
          <Button
            onClick={handleSendWhatsApp}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Enviar no WhatsApp
          </Button>

          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="border-border text-foreground hover:bg-muted"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 mr-2 text-emerald-600" /> Link Copiado!
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" /> Copiar Link
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
