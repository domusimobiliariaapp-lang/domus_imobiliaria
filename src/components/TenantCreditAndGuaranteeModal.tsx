import { useState, useMemo, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Printer,
  Sparkles,
  Building,
  User,
} from 'lucide-react'
import { formatBRL } from '@/lib/repasse'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/inputMasks'
import type { Lease, Property, Profile } from '@/types'

interface TenantCreditAndGuaranteeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lease?: Lease | null
  property?: Property | null
  tenant?: Profile | null
}

export function TenantCreditAndGuaranteeModal({
  open,
  onOpenChange,
  lease,
  property,
  tenant,
}: TenantCreditAndGuaranteeModalProps) {
  const [tenantName, setTenantName] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState(6000)
  const [rentPrice, setRentPrice] = useState(1800)
  const [condoFee, setCondoFee] = useState(400)
  const [iptuFee, setIptuFee] = useState(120)
  const [fireInsurance, setFireInsurance] = useState(45)
  const [selectedGuarantee, setSelectedGuarantee] = useState<'seguro' | 'capitalizacao' | 'caucao' | 'fiador'>('seguro')
  const [copied, setCopied] = useState(false)

  // Atualiza com dados do contrato selecionado quando abrir
  useEffect(() => {
    if (lease) {
      setRentPrice(lease.monthly_rent || 0)
    }
    if (property) {
      if (property.condo_fee) setCondoFee(property.condo_fee)
      if (property.iptu) setIptuFee(property.iptu)
      if (!lease && property.rent_price) setRentPrice(property.rent_price)
    }
    if (tenant) {
      setTenantName(tenant.full_name || '')
    }
  }, [lease, property, tenant])

  // Total do pacote de locação
  const totalPackage = useMemo(() => {
    return rentPrice + condoFee + iptuFee + fireInsurance
  }, [rentPrice, condoFee, iptuFee, fireInsurance])

  // Comprometimento de renda
  const commitmentPercent = useMemo(() => {
    if (monthlyIncome <= 0) return 0
    return (totalPackage / monthlyIncome) * 100
  }, [totalPackage, monthlyIncome])

  // Renda mínima recomendada (30%)
  const recommendedIncome = useMemo(() => {
    return totalPackage / 0.3
  }, [totalPackage])

  // Classificação de risco
  const riskStatus = useMemo(() => {
    if (commitmentPercent <= 30) {
      return {
        level: 'baixo',
        label: 'Aprovado • Risco Baixo',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: CheckCircle2,
        description: 'Comprometimento dentro da margem segura de mercado (até 30%). Capacidade financeira excelente para honrar os encargos.',
      }
    }
    if (commitmentPercent <= 40) {
      return {
        level: 'moderado',
        label: 'Atenção • Risco Moderado',
        color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: AlertTriangle,
        description: 'Comprometimento entre 30% e 40%. Recomendado comprovar renda adicional, incluir co-titular ou optar por Seguro Fiança.',
      }
    }
    return {
      level: 'alto',
      label: 'Alto Risco • Acima do Limite',
      color: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-300',
      badge: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      description: 'Comprometimento superior a 40% da renda comprovada. Não recomendado sem a composição de renda de outro pagador.',
    }
  }, [commitmentPercent])

  // Simulações de Garantia
  const guaranteeCalculations = useMemo(() => {
    // 1. Seguro Fiança: média de 8.5% ao mês sobre o total do pacote
    const seguroMensal = totalPackage * 0.085
    const seguroAnual = seguroMensal * 12

    // 2. Título de Capitalização: 4x a 6x o valor do pacote
    const capitalizacaoMin = totalPackage * 4
    const capitalizacaoRecomendada = totalPackage * 6

    // 3. Caução em Dinheiro: limite legal de até 3 aluguéis (Lei 8.245/91 art. 38 §2º)
    const caucaoDinheiro = rentPrice * 3

    return {
      seguroMensal,
      seguroAnual,
      capitalizacaoMin,
      capitalizacaoRecomendada,
      caucaoDinheiro,
    }
  }, [totalPackage, rentPrice])

  const handlePrint = () => {
    window.print()
  }

  const handleCopyWhatsApp = async () => {
    const texto = `📋 *ANÁLISE DE LOCAÇÃO E GARANTIAS*
Imóvel: ${property?.title || 'Imóvel Residencial'}
Pretendente: ${tenantName || 'Pretendente'}

💰 *Composição Mensal da Locação:*
• Aluguel: ${formatBRL(rentPrice)}
• Condomínio: ${formatBRL(condoFee)}
• IPTU: ${formatBRL(iptuFee)}
• Seguro Incêndio: ${formatBRL(fireInsurance)}
*Total do Pacote: ${formatBRL(totalPackage)}/mês*

📊 *Análise de Capacidade Financeira:*
• Renda Declarada: ${formatBRL(monthlyIncome)}
• Comprometimento de Renda: ${commitmentPercent.toFixed(1)}%
• Renda Mínima Recomendada: ${formatBRL(recommendedIncome)}
• Parecer: *${riskStatus.label}*

🛡️ *Opções de Garantia Locatícia (Sem Fiador):*
1️⃣ *Seguro Fiança (Sem Fiador):* Aprox. ${formatBRL(guaranteeCalculations.seguroMensal)}/mês (sem fiador, aprovação imediata)
2️⃣ *Título de Capitalização:* ${formatBRL(guaranteeCalculations.capitalizacaoMin)} (100% resgatável ao término)
3️⃣ *Caução em Dinheiro:* ${formatBRL(guaranteeCalculations.caucaoDinheiro)} (até 3 meses de aluguel)
4️⃣ *Fiador Tradicional:* Comprovação de 1 ou 2 imóveis quitados na comarca

Dúvidas? Estamos à disposição!`.trim()

    try {
      await navigator.clipboard.writeText(texto)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
    }
  }

  const RiskIcon = riskStatus.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-serif">
                Análise de Renda & Simulador de Garantias Locatícias
              </DialogTitle>
              <DialogDescription>
                Avalie o comprometimento de renda do pretendente e simule opções de locação sem fiador (Lei 8.245/1991).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Form Grid: Inquilino e Encargos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 border border-border rounded-xl">
            {/* Coluna 1: Dados do Pretendente */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Dados do Pretendente
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-name" className="text-xs">Nome do Pretendente / Inquilino</Label>
                <Input
                  id="tenant-name"
                  placeholder="Ex: João Carlos da Silva"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthly-income" className="text-xs">Renda Mensal Comprovada (R$)</Label>
                <Input
                  id="monthly-income"
                  value={formatCurrencyInput(monthlyIncome)}
                  onChange={(e) => setMonthlyIncome(parseCurrencyInput(e.target.value))}
                  className="h-9 text-sm font-semibold text-emerald-600"
                />
              </div>
            </div>

            {/* Coluna 2: Composição do Pacote */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" />
                Composição do Pacote Mensal
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Aluguel (R$)</Label>
                  <Input
                    value={formatCurrencyInput(rentPrice)}
                    onChange={(e) => setRentPrice(parseCurrencyInput(e.target.value))}
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Condomínio (R$)</Label>
                  <Input
                    value={formatCurrencyInput(condoFee)}
                    onChange={(e) => setCondoFee(parseCurrencyInput(e.target.value))}
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">IPTU Mensal (R$)</Label>
                  <Input
                    value={formatCurrencyInput(iptuFee)}
                    onChange={(e) => setIptuFee(parseCurrencyInput(e.target.value))}
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Seguro Incêndio (R$)</Label>
                  <Input
                    value={formatCurrencyInput(fireInsurance)}
                    onChange={(e) => setFireInsurance(parseCurrencyInput(e.target.value))}
                    className="h-8 text-xs font-medium"
                  />
                </div>
              </div>
              <div className="pt-1 flex items-center justify-between text-xs border-t border-border/60">
                <span className="font-semibold text-muted-foreground">Pacote Total Locação:</span>
                <span className="font-bold text-sm text-foreground">{formatBRL(totalPackage)}/mês</span>
              </div>
            </div>
          </div>

          {/* Resultado da Análise de Crédito */}
          <div className={`p-4 rounded-xl border ${riskStatus.color}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <RiskIcon className="h-5 w-5 flex-shrink-0" />
                <span className="font-bold text-base">{riskStatus.label}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>Comprometimento:</span>
                <Badge variant="outline" className={`font-mono font-bold ${riskStatus.badge}`}>
                  {commitmentPercent.toFixed(1)}% da renda
                </Badge>
              </div>
            </div>
            <p className="text-xs leading-relaxed opacity-90">{riskStatus.description}</p>
            <div className="mt-3 pt-3 border-t border-current/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>
                Renda mínima sugerida (para limite de 30%):{' '}
                <strong className="underline underline-offset-2">{formatBRL(recommendedIncome)}</strong>
              </span>
              <span className="opacity-80">
                Margem livre restante:{' '}
                <strong>{formatBRL(Math.max(0, monthlyIncome - totalPackage))}</strong>
              </span>
            </div>
          </div>

          {/* Modalidades de Garantia Locatícia */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#AD7B3B]" />
                Modalidades de Garantia (Simulação Instantânea)
              </h3>
              <span className="text-[11px] text-muted-foreground">Lei do Inquilinato nº 8.245/91</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opção 1: Seguro Fiança */}
              <div
                onClick={() => setSelectedGuarantee('seguro')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedGuarantee === 'seguro'
                    ? 'border-[#AD7B3B] bg-[#AD7B3B]/5 ring-1 ring-[#AD7B3B]'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <div>
                      <h4 className="font-semibold text-sm">Seguro Fiança</h4>
                      <p className="text-[11px] text-muted-foreground">Sem fiador • Aprovação rápida</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
                    Mais Escolhido
                  </Badge>
                </div>
                <div className="my-2 p-2 bg-background rounded-lg border border-border/60">
                  <span className="text-[11px] text-muted-foreground block">Parcela estimada:</span>
                  <span className="text-base font-bold text-[#AD7B3B]">
                    {formatBRL(guaranteeCalculations.seguroMensal)}
                    <span className="text-xs font-normal text-muted-foreground">/mês (~8,5%)</span>
                  </span>
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Inquilino não precisa de fiador nem caução</li>
                  <li>Cobre aluguel, IPTU, condomínio e danos</li>
                </ul>
              </div>

              {/* Opção 2: Título de Capitalização */}
              <div
                onClick={() => setSelectedGuarantee('capitalizacao')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedGuarantee === 'capitalizacao'
                    ? 'border-[#AD7B3B] bg-[#AD7B3B]/5 ring-1 ring-[#AD7B3B]'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <div>
                      <h4 className="font-semibold text-sm">Título de Capitalização</h4>
                      <p className="text-[11px] text-muted-foreground">100% resgatável ao final</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Sem Análise
                  </Badge>
                </div>
                <div className="my-2 p-2 bg-background rounded-lg border border-border/60">
                  <span className="text-[11px] text-muted-foreground block">Depósito único (4x pacote):</span>
                  <span className="text-base font-bold text-foreground">
                    {formatBRL(guaranteeCalculations.capitalizacaoMin)}
                  </span>
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Inquilino resgata com correção pela TR</li>
                  <li>Sem burocracia ou exigência de comprovação</li>
                </ul>
              </div>

              {/* Opção 3: Caução em Dinheiro */}
              <div
                onClick={() => setSelectedGuarantee('caucao')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedGuarantee === 'caucao'
                    ? 'border-[#AD7B3B] bg-[#AD7B3B]/5 ring-1 ring-[#AD7B3B]'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏦</span>
                    <div>
                      <h4 className="font-semibold text-sm">Caução em Dinheiro</h4>
                      <p className="text-[11px] text-muted-foreground">Poupança vinculada</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Art. 38 §2º
                  </Badge>
                </div>
                <div className="my-2 p-2 bg-background rounded-lg border border-border/60">
                  <span className="text-[11px] text-muted-foreground block">Limite legal (3 aluguéis):</span>
                  <span className="text-base font-bold text-foreground">
                    {formatBRL(guaranteeCalculations.caucaoDinheiro)}
                  </span>
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Depositado em conta poupança conjunta</li>
                  <li>Devolvido ao final se não houver pendências</li>
                </ul>
              </div>

              {/* Opção 4: Fiador Tradicional */}
              <div
                onClick={() => setSelectedGuarantee('fiador')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedGuarantee === 'fiador'
                    ? 'border-[#AD7B3B] bg-[#AD7B3B]/5 ring-1 ring-[#AD7B3B]'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤝</span>
                    <div>
                      <h4 className="font-semibold text-sm">Fiador Tradicional</h4>
                      <p className="text-[11px] text-muted-foreground">Com imóvel próprio</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Sem Custo Direto
                  </Badge>
                </div>
                <div className="my-2 p-2 bg-background rounded-lg border border-border/60">
                  <span className="text-[11px] text-muted-foreground block">Custo de emissão:</span>
                  <span className="text-base font-bold text-emerald-600">
                    R$ 0,00
                  </span>
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Exige certidão de matrícula de imóvel quitado</li>
                  <li>Fiador responde solidariamente com seu patrimônio</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ações de Compartilhamento e Impressão */}
          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Gere propostas instantâneas para enviar ao inquilino no WhatsApp</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir Parecer
              </Button>
              <Button
                size="sm"
                onClick={handleCopyWhatsApp}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white min-w-[170px]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copiado para o Zap!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar para WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
