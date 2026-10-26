import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, MessageCircle, FileText } from 'lucide-react'
import { formatBRL, type RepasseLocacao } from '@/lib/repasse'
import type { Organization, Property, Profile } from '@/types'

interface ExtratoProprietarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repasse: RepasseLocacao | null
  organization: Organization | null
  property?: Property | null
  landlord?: Profile | null
  tenant?: Profile | null
  periodoStr: string
}

export function ExtratoProprietarioModal({
  open,
  onOpenChange,
  repasse,
  organization,
  property,
  landlord,
  tenant,
  periodoStr,
}: ExtratoProprietarioModalProps) {
  if (!repasse) return null

  const orgName = organization?.name || 'Imobiliária'
  const orgDocument = organization?.document_number || 'CNPJ não informado'
  const orgPhone = organization?.phone || ''
  const orgEmail = organization?.email || ''

  const landlordName = landlord?.full_name || 'Proprietário'
  const landlordDoc = landlord?.document_number || 'Não informado'
  const landlordPhone = landlord?.phone || ''

  const tenantName = tenant?.full_name || 'Inquilino'
  const propertyTitle = property?.title || 'Imóvel sob locação'
  const propertyAddress = [property?.address, property?.address_number, property?.neighborhood, property?.city]
    .filter(Boolean)
    .join(', ')

  const handlePrint = () => {
    window.print()
  }

  const handleSendWhatsApp = () => {
    const cleanPhone = landlordPhone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Prezado(a) *${landlordName}*,\n\n` +
      `Segue a prestação de contas do seu imóvel *"${propertyTitle}"* referente ao período *${periodoStr}*:\n\n` +
      `💰 *Aluguel Recebido:* ${formatBRL(repasse.brutoPago)}\n` +
      `📉 *Taxa de Administração:* -${formatBRL(repasse.taxas)}\n` +
      (repasse.despesas > 0 ? `🛠️ *Despesas/Retenções:* -${formatBRL(repasse.despesas)}\n` : '') +
      `✅ *Líquido Repassado:* ${formatBRL(repasse.liquido)}\n\n` +
      `Qualquer dúvida estamos à disposição!\n` +
      `Atenciosamente,\n*${orgName}*`
    )

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${msg}`
      : `https://api.whatsapp.com/send?text=${msg}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-card">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-xl font-serif flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#AD7B3B]" />
              Prestação de Contas ao Proprietário
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* ÁREA IMPRIMÍVEL DO EXTRATO */}
        <div id="extrato-content" className="space-y-6 text-foreground p-2 sm:p-4">
          {/* Cabeçalho da Imobiliária */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary">{orgName}</h2>
              <p className="text-xs text-muted-foreground">{orgDocument} • {orgEmail} • {orgPhone}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Extrato de Repasse
              </span>
              <p className="text-xs text-muted-foreground mt-1">Competência: <strong>{periodoStr}</strong></p>
            </div>
          </div>

          {/* Dados do Proprietário e Imóvel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border text-xs">
            <div>
              <p className="font-semibold text-muted-foreground uppercase text-[10px] mb-1">Proprietário / Beneficiário</p>
              <p className="font-bold text-sm text-foreground">{landlordName}</p>
              <p className="text-muted-foreground">Doc: {landlordDoc}</p>
              {landlordPhone && <p className="text-muted-foreground">Tel: {landlordPhone}</p>}
            </div>
            <div>
              <p className="font-semibold text-muted-foreground uppercase text-[10px] mb-1">Imóvel Administrado</p>
              <p className="font-bold text-sm text-foreground">{propertyTitle}</p>
              <p className="text-muted-foreground">{propertyAddress || 'Endereço cadastrado no sistema'}</p>
              <p className="text-muted-foreground mt-1">Locatário: <strong>{tenantName}</strong></p>
            </div>
          </div>

          {/* Tabela Financeira Demonstrativa */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Demonstrativo Financeiro do Período
            </h4>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2.5 px-3">Item / Discriminação</th>
                    <th className="text-center py-2.5 px-3">Tipo</th>
                    <th className="text-right py-2.5 px-3">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs">
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Aluguel Bruto Recebido do Inquilino</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-medium">Crédito (+)</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-foreground">{formatBRL(repasse.brutoPago)}</td>
                  </tr>

                  {repasse.taxas > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        Taxa de Administração da Imobiliária
                      </td>
                      <td className="py-2.5 px-3 text-center text-amber-600 font-medium">Débito (-)</td>
                      <td className="py-2.5 px-3 text-right font-medium text-amber-700">-{formatBRL(repasse.taxas)}</td>
                    </tr>
                  )}

                  {repasse.despesas > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        Retenções / Despesas Operacionais / Reparos
                      </td>
                      <td className="py-2.5 px-3 text-center text-red-600 font-medium">Débito (-)</td>
                      <td className="py-2.5 px-3 text-right font-medium text-red-700">-{formatBRL(repasse.despesas)}</td>
                    </tr>
                  )}

                  {repasse.receitas > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        Outros Acréscimos / Reembolsos
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 font-medium">Crédito (+)</td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-700">+{formatBRL(repasse.receitas)}</td>
                    </tr>
                  )}

                  <tr className="bg-emerald-50/60 dark:bg-emerald-950/30 border-t-2 font-bold text-sm">
                    <td className="py-3 px-3 text-emerald-900 dark:text-emerald-300">
                      VALOR LÍQUIDO REPASSADO AO PROPRIETÁRIO
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-700">Líquido (=)</td>
                    <td className="py-3 px-3 text-right text-emerald-800 dark:text-emerald-300 font-mono text-base">
                      {formatBRL(repasse.liquido)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé e Declaração */}
          <div className="pt-4 border-t text-[11px] text-muted-foreground space-y-1">
            <p>
              Este extrato é emitido para fins de prestação de contas mensal conforme contrato de administração imobiliária.
            </p>
            <p>
              Emitido eletronicamente pelo sistema <strong>Domus Gestão Imobiliária</strong> em {new Date().toLocaleDateString('pt-BR')}.
            </p>
          </div>
        </div>

        {/* Ações (Não saem na impressão) */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-4 border-t print:hidden">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="w-full sm:w-auto text-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir / Salvar em PDF
          </Button>

          <Button
            onClick={handleSendWhatsApp}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs"
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Enviar no WhatsApp do Proprietário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
