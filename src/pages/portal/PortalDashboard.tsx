import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  FileText,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  FolderOpen,
  Copy,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProperties, useLeases, usePayments } from '@/hooks/useSupabase'
import { formatBRL } from '@/lib/repasse'
import { useToast } from '@/components/ui/toast'

export function PortalDashboard() {
  const { profile, organization } = useAuth()
  const { data: properties, loading: loadingProperties } = useProperties()
  const { data: leases, loading: loadingLeases } = useLeases()
  const { data: payments, loading: loadingPayments } = usePayments()
  const { addToast } = useToast()

  const clientName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Cliente'
  const isLocador = profile?.tipo_relacao === 'locador'

  // Contratos do cliente
  const activeLease = (leases || []).find((l) => l.status === 'ativo') || (leases || [])[0]
  const pendingSignatureLeases = (leases || []).filter(
    (l) => l.signature_status === 'aguardando_assinaturas'
  )

  // Imóvel associado ao contrato ativo ou imóvel próprio
  const activeProperty = activeLease
    ? (properties || []).find((p) => p.id === activeLease.property_id)
    : (properties || [])[0]

  // Próximo boleto / pagamento pendente ou em atraso
  const pendingPayments = (payments || [])
    .filter((p) => p.status === 'pendente' || p.status === 'atrasado')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  const nextPayment = pendingPayments[0]

  const handleCopyBarcode = (paymentId: string) => {
    // Código de barras simulado/gerado para conveniência
    const dummyBarcode = `34191.79001 01043.510047 91020.150008 7 ${paymentId.replace(/\D/g, '').padEnd(14, '0')}`
    void navigator.clipboard.writeText(dummyBarcode)
    addToast('Linha digitável copiada para a área de transferência!', 'success')
  }

  const isLoading = loadingProperties || loadingLeases || loadingPayments

  return (
    <div className="space-y-8 pb-10">
      {/* Boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-primary">
            Olá, {clientName}!
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Bem-vindo ao seu Portal do Cliente {organization?.name ? `da ${organization.name}` : ''}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile?.tipo_relacao && (
            <Badge variant="outline" className="px-3 py-1 text-xs capitalize bg-primary/5 text-primary border-primary/20">
              {profile.tipo_relacao === 'locatario' ? 'Locatário' : profile.tipo_relacao === 'locador' ? 'Proprietário' : profile.tipo_relacao}
            </Badge>
          )}
        </div>
      </div>

      {/* Alerta de Assinatura Pendente */}
      {pendingSignatureLeases.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-amber-200/60 text-amber-900 shrink-0 mt-0.5">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-950 text-sm sm:text-base">
                Você tem contrato aguardando assinatura eletrônica
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                Revise os termos e realize sua assinatura digital com validade jurídica de forma rápida e segura.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-amber-800 hover:bg-amber-900 text-white shrink-0 shadow-xs">
            <Link to="/portal/leases">
              Assinar Agora
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Grid Principal: Imóvel Locado/Propriedade & Próximo Boleto */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card: Meu Imóvel & Contrato */}
        <Card className="flex flex-col justify-between border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Home className="h-4 w-4 text-primary" />
                {isLocador ? 'Meu Imóvel Sob Gestão' : 'Meu Imóvel Locado'}
              </span>
              {activeLease?.status && (
                <Badge variant={activeLease.status === 'ativo' ? 'default' : 'secondary'} className="text-[11px]">
                  Contrato {activeLease.status}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-medium text-primary mt-2">
              {activeProperty?.title || (isLoading ? 'Carregando imóvel...' : 'Nenhum imóvel vinculado')}
            </CardTitle>
            {activeProperty?.address && (
              <CardDescription className="text-xs">
                {activeProperty.address}, {activeProperty.neighborhood || ''} — {activeProperty.city}/{activeProperty.state}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {activeLease ? (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 text-xs border border-border/50">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Valor do Aluguel</span>
                  <strong className="text-sm font-semibold text-emerald-700">
                    {formatBRL(activeLease.monthly_rent || 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Dia de Vencimento</span>
                  <strong className="text-sm font-semibold text-foreground">
                    Todo dia {activeLease.payment_day || 10}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Início do Contrato</span>
                  <span className="font-medium text-foreground">
                    {activeLease.start_date ? new Date(activeLease.start_date).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Término do Contrato</span>
                  <span className="font-medium text-foreground">
                    {activeLease.end_date ? new Date(activeLease.end_date).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Você não possui nenhum contrato ativo no momento.
              </p>
            )}

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/50">
              <Button variant="ghost" size="sm" asChild className="text-xs text-primary -ml-2">
                <Link to="/portal/leases">
                  Ver detalhes do contrato
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs">
                <Link to="/portal/properties">
                  Ver imóvel
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card: Próximo Pagamento / Boletos */}
        <Card className="flex flex-col justify-between border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                {isLocador ? 'Próximo Repasse / Aluguel' : 'Próximo Vencimento'}
              </span>
              {nextPayment && (
                <Badge
                  variant={nextPayment.status === 'atrasado' ? 'destructive' : 'secondary'}
                  className="text-[11px]"
                >
                  {nextPayment.status === 'atrasado' ? 'Vencido' : 'Pendente'}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-medium text-primary mt-2">
              {nextPayment ? (
                <span>Aluguel Mensal</span>
              ) : (
                <span className="text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Todos os pagamentos em dia!
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              {nextPayment
                ? `Vencimento em ${new Date(nextPayment.due_date).toLocaleDateString('pt-BR')}`
                : 'Não há faturas em aberto para a sua conta no momento.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextPayment ? (
              <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block">Valor a pagar</span>
                  <span className="text-2xl font-bold font-serif text-emerald-800">
                    {formatBRL(Number(nextPayment.amount) || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">Vencimento</span>
                  <span className="text-sm font-semibold text-foreground">
                    {new Date(nextPayment.due_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground">
                Parabéns! Suas mensalidades e obrigações contratuais estão completamente regularizadas.
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/50">
              {nextPayment ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyBarcode(nextPayment.id)}
                    className="text-xs gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar Código de Barras
                  </Button>
                  <Button asChild size="sm" className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white text-xs">
                    <Link to="/portal/payments">
                      Ver Todos os Boletos
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" asChild className="text-xs text-primary -ml-2">
                  <Link to="/portal/payments">
                    Acessar histórico de pagamentos
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acesso Rápido a Serviços */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-medium text-primary">Serviços e Atalhos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/portal/leases" className="group block">
            <Card className="h-full p-4 border-border/70 hover:border-primary/50 transition-all hover:shadow-xs group-hover:bg-muted/10">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-sm text-foreground">Meus Contratos</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Visualize as cláusulas, datas e minuta assinada da sua locação.
              </p>
            </Card>
          </Link>

          <Link to="/portal/payments" className="group block">
            <Card className="h-full p-4 border-border/70 hover:border-primary/50 transition-all hover:shadow-xs group-hover:bg-muted/10">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3 text-emerald-700 group-hover:scale-105 transition-transform">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-sm text-foreground">Boletos & Pagamentos</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Emita 2ª via de boleto e acompanhe recibos de pagamentos quitados.
              </p>
            </Card>
          </Link>

          <Link to="/portal/properties" className="group block">
            <Card className="h-full p-4 border-border/70 hover:border-primary/50 transition-all hover:shadow-xs group-hover:bg-muted/10">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3 text-blue-700 group-hover:scale-105 transition-transform">
                <Home className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-sm text-foreground">Dados do Imóvel</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Consulte endereço, condomínio, IPTU e características da unidade.
              </p>
            </Card>
          </Link>

          <Link to="/portal/documents" className="group block">
            <Card className="h-full p-4 border-border/70 hover:border-primary/50 transition-all hover:shadow-xs group-hover:bg-muted/10">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3 text-amber-700 group-hover:scale-105 transition-transform">
                <FolderOpen className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-sm text-foreground">Documentos & Vistorias</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Laudos de vistoria, aditivos, comprovantes e documentos pessoais.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
