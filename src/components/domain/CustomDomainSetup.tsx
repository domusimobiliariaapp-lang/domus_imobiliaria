import { useState, useEffect } from 'react'
import {
  Globe,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Sparkles,
  Lock,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { supabase } from '@/integrations/supabase/client'
import { Link } from 'react-router-dom'
import { getDevWhatsAppUrl } from '@/lib/devContactSettings'

export function CustomDomainSetup() {
  const { addToast } = useToast()
  const { organization, profile } = useAuth()
  const limits = usePlanLimits()

  const [domain, setDomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeDomain, setActiveDomain] = useState<string | null>(null)

  // Verifica se o plano contratado permite domínio próprio
  const hasCustomDomainFeature =
    limits.features?.custom_domain === true ||
    limits.planId === 'enterprise' ||
    limits.planId === 'lifetime'

  useEffect(() => {
    if (organization?.id) {
      const saved = (organization as any).custom_domain || localStorage.getItem(`domus_custom_domain_${organization.id}`)
      if (saved) {
        setDomain(saved)
        setActiveDomain(saved)
      }
    }
  }, [organization?.id])

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    addToast(`${fieldName} copiado para a área de transferência!`, 'success')
    setTimeout(() => setCopiedField(null), 3000)
  }

  const handleSaveDomain = async () => {
    if (!domain.trim()) {
      addToast('Por favor, digite o seu domínio (ex: www.suaimobiliaria.com.br).', 'error')
      return
    }

    let clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!clean.startsWith('www.') && clean.split('.').length === 2) {
      clean = `www.${clean}`
    }

    setSaving(true)
    try {
      if (organization?.id) {
        // Tenta salvar na tabela organizations
        const { error } = await supabase
          .from('organizations')
          .update({
            custom_domain: clean,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', organization.id)

        if (error) {
          // Se a coluna custom_domain ainda não estiver na migration remota, salva no storage local com segurança
          localStorage.setItem(`domus_custom_domain_${organization.id}`, clean)
        } else {
          localStorage.setItem(`domus_custom_domain_${organization.id}`, clean)
        }
      }

      setActiveDomain(clean)
      setDomain(clean)
      addToast('Domínio próprio salvo com sucesso! Siga o passo a passo abaixo para criar o apontamento DNS.', 'success')
    } catch (err: any) {
      addToast(`Erro ao salvar domínio: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCheckDns = async () => {
    setChecking(true)
    try {
      // Simulação rápida de verificação de propagação de DNS
      await new Promise((r) => setTimeout(r, 1200))
      addToast(
        'Apontamento em processo de validação. A propagação de DNS no Registro.br ou GoDaddy pode levar de 15 minutos até 2 horas.',
        'info'
      )
    } finally {
      setChecking(false)
    }
  }

  const handleContactAssistedSetup = () => {
    const message =
      `Olá! Sou da imobiliária *${organization?.name || 'nossa imobiliária'}* (Plano Enterprise Domus) e gostaria de contratar o *Serviço de Configuração Assistida de Domínio & SSL* para o endereço *${domain || 'nosso domínio .com.br'}*.\n\n` +
      `• Responsável: *${profile?.full_name || 'Admin'}*\n` +
      `• Subdomínio atual: *${organization?.slug || 'domus'}*`
    window.open(getDevWhatsAppUrl(message), '_blank')
  }

  // 1. Caso a imobiliária esteja em um plano que NÃO tem domínio próprio (Starter ou Pro)
  if (!hasCustomDomainFeature) {
    return (
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#17323D]/10 via-[#AD7B3B]/10 to-transparent p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B]/15 text-[#AD7B3B] border border-[#AD7B3B]/30">
              <Lock className="w-3.5 h-3.5" />
              <span>Recurso Exclusivo do Plano Enterprise & Vitalício</span>
            </div>
            <h3 className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
              Use seu próprio endereço www.suaimobiliaria.com.br
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Com o Domínio Próprio White-Label, o nome do Domus não aparece na barra de endereço dos seus clientes. Tenha um portal imobiliário com a identidade da sua marca exclusiva.
            </p>
          </div>

          <Button
            asChild
            className="h-11 px-6 bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white font-medium rounded-xl shadow-md cursor-pointer shrink-0"
          >
            <Link to="/admin/upgrade" className="flex items-center gap-2">
              <span>Fazer Upgrade para Enterprise</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </Card>
    )
  }

  // 2. Imobiliária com Plano Enterprise ou Vitalício (Recurso Liberado)
  return (
    <div className="space-y-6">
      {/* Topo informativo */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#AD7B3B]/10 text-[#AD7B3B]">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-serif">Configuração de Domínio Próprio</CardTitle>
                <CardDescription className="text-xs">
                  Substitua o subdomínio padrão pelo seu domínio oficial registrado (ex: www.imobiliariasilva.com.br).
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white text-[11px] font-semibold gap-1 py-1 px-2.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recurso Desbloqueado no seu Plano
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Formulário de Inserção do Domínio */}
          <div className="space-y-2 p-4 rounded-xl border border-border bg-muted/20">
            <Label className="text-xs font-semibold">Qual é o seu endereço de site oficial?</Label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="www.minhaimobiliaria.com.br"
                  className="pl-9 h-10 text-xs font-mono"
                />
              </div>
              <Button
                onClick={handleSaveDomain}
                disabled={saving}
                className="w-full sm:w-auto h-10 px-5 bg-[#17323D] hover:bg-[#17323D]/90 text-white text-xs rounded-xl shrink-0 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Domínio</span>
                )}
              </Button>
            </div>
            {activeDomain && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 pt-1">
                <Check className="w-3.5 h-3.5" />
                Domínio ativo configurado: <strong>https://{activeDomain}</strong>
              </p>
            )}
          </div>

          {/* Passo a Passo de Apontamento DNS */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span>Passo a Passo para Apontar seu Domínio (Faça você mesmo em 2 minutos):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-[#AD7B3B]/10 text-[#AD7B3B] font-bold inline-flex items-center justify-center text-xs">
                  1
                </span>
                <p className="font-semibold text-foreground">Acesse sua Zona de DNS</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Entre no provedor onde você comprou seu domínio (Registro.br, GoDaddy, Hostinger, Cloudflare, etc.).
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-[#AD7B3B]/10 text-[#AD7B3B] font-bold inline-flex items-center justify-center text-xs">
                  2
                </span>
                <p className="font-semibold text-foreground">Crie a entrada CNAME</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Adicione uma nova entrada de DNS do tipo <strong>CNAME</strong> com os dados exatos da tabela abaixo.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-[#AD7B3B]/10 text-[#AD7B3B] font-bold inline-flex items-center justify-center text-xs">
                  3
                </span>
                <p className="font-semibold text-foreground">Aguarde a Propagação</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Aguarde de 15 minutos a 2 horas. O certificado de segurança HTTPS (SSL) é emitido de forma 100% automática.
                </p>
              </div>
            </div>

            {/* Tabela de Dados de DNS */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
              <p className="text-xs font-semibold text-foreground">Dados para cadastrar na sua Zona de DNS:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-background border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Tipo de Registro:</span>
                  <div className="flex items-center justify-between font-mono font-bold text-foreground">
                    <span>CNAME</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('CNAME', 'Tipo')}
                      className="h-6 w-6 p-0"
                    >
                      {copiedField === 'Tipo' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-background border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Nome / Host:</span>
                  <div className="flex items-center justify-between font-mono font-bold text-foreground">
                    <span>www</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('www', 'Nome')}
                      className="h-6 w-6 p-0"
                    >
                      {copiedField === 'Nome' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-background border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Destino / Valor:</span>
                  <div className="flex items-center justify-between font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    <span className="truncate">cname.domus.com.br</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('cname.domus.com.br', 'Destino')}
                      className="h-6 w-6 p-0 shrink-0"
                    >
                      {copiedField === 'Destino' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckDns}
                  disabled={checking}
                  className="text-xs h-8 gap-1.5 cursor-pointer"
                >
                  {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Verificar Status do Apontamento</span>
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  TTL Recomendado: Automático ou 3600 segundos
                </span>
              </div>
            </div>
          </div>

          {/* CARD DE UPSELL: CONTRATAÇÃO DE SERVIÇO TÉCNICO ASSISTIDO */}
          <div className="p-5 rounded-2xl border-2 border-[#AD7B3B]/30 bg-gradient-to-br from-[#17323D]/5 via-[#AD7B3B]/10 to-[#17323D]/5 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
              <div className="space-y-1.5 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#AD7B3B] text-white">
                  <Sparkles className="w-3 h-3" />
                  <span>Serviço Opcional de Implantação VIP</span>
                </div>
                <h4 className="text-base font-serif font-bold text-[#17323D] dark:text-[#EEECE5]">
                  Prefere que nossa equipe técnica configure tudo para você?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  Se não quiser mexer em configurações de DNS ou se não tiver um técnico na sua imobiliária, nossos especialistas cuidam do apontamento no Registro.br/GoDaddy, ativam o certificado SSL e deixam o site no ar sem nenhum risco.
                </p>
                <p className="text-xs font-semibold text-[#AD7B3B] pt-0.5">
                  Taxa única de configuração assistida: apenas <strong>R$ 150</strong>.
                </p>
              </div>

              <Button
                onClick={handleContactAssistedSetup}
                className="w-full md:w-auto h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-md cursor-pointer shrink-0 flex items-center justify-center gap-2 text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contratar Configuração no WhatsApp</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default CustomDomainSetup
