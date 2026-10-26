import { useState, useEffect } from 'react'
import {
  MessageCircle,
  Mail,
  Phone,
  Building,
  Clock,
  Save,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import {
  getDevContactSettings,
  saveDevContactSettings,
  getDevWhatsAppUrl,
  type DevContactSettings,
  DEFAULT_DEV_CONTACT_SETTINGS,
} from '@/lib/devContactSettings'

export function DevContact() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState<DevContactSettings>(DEFAULT_DEV_CONTACT_SETTINGS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const current = getDevContactSettings()
    setSettings(current)
  }, [])

  const handleSave = () => {
    setSaving(true)
    try {
      saveDevContactSettings(settings)
      addToast('Dados de contato e WhatsApp do desenvolvedor salvos com sucesso!', 'success')
    } catch (err: any) {
      addToast(`Erro ao salvar: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTestWhatsApp = () => {
    const url = getDevWhatsAppUrl('Olá! Estou testando o botão de atendimento do Domus SaaS.')
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Topo explicativo */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#AD7B3B]/10 text-[#AD7B3B] border border-[#AD7B3B]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Configurações Globais do SaaS</span>
        </div>
        <h2 className="text-2xl font-serif text-[#17323D] dark:text-[#EEECE5]">
          Dados de Contato & WhatsApp do DEV
        </h2>
        <p className="text-xs text-muted-foreground">
          Configure o seu número de WhatsApp, e-mail comercial e dados da sua empresa. Todos os botões de atendimento, suporte, dúvidas de checkout e pedidos de implantação no sistema serão direcionados automaticamente para este número.
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            Canais de Atendimento e Vendas do Sistema
          </CardTitle>
          <CardDescription className="text-xs">
            Preencha seus canais oficiais para recebimento de mensagens e pedidos dos clientes:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp Oficial */}
            <div className="space-y-1.5 md:col-span-2 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Principal de Vendas e Suporte (com DDD):</span>
                </Label>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Canal Principal
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <Input
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="h-10 text-sm font-mono bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestWhatsApp}
                  className="h-10 px-4 text-xs shrink-0 cursor-pointer border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Testar Link do WhatsApp</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Dica: Digite apenas o DDD e o número (ex: 11987654321). O sistema formata automaticamente.
              </p>
            </div>

            {/* E-mail Comercial */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span>E-mail Comercial / Suporte:</span>
              </Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="contato@gestaodomus.com.br"
                className="h-10 text-sm"
              />
              <span className="text-[11px] text-muted-foreground">
                Exibido no rodapé e contratos de termos de uso do SaaS.
              </span>
            </div>

            {/* Telefone Fixo ou 0800 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Telefone de Contato (Opcional):</span>
              </Label>
              <Input
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="(11) 3000-0000"
                className="h-10 text-sm"
              />
              <span className="text-[11px] text-muted-foreground">
                Caso sua empresa tenha número fixo ou 0800.
              </span>
            </div>

            {/* Razão Social / Nome da Empresa */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Nome da Empresa / Razão Social:</span>
              </Label>
              <Input
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                placeholder="Domus Tecnologia & Sistemas Ltda"
                className="h-10 text-sm"
              />
              <span className="text-[11px] text-muted-foreground">
                Nome jurídico da proprietária da plataforma.
              </span>
            </div>

            {/* Horário de Atendimento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Horário de Atendimento:</span>
              </Label>
              <Input
                value={settings.support_hours}
                onChange={(e) => setSettings({ ...settings, support_hours: e.target.value })}
                placeholder="Segunda a Sexta, das 09h às 18h"
                className="h-10 text-sm"
              />
              <span className="text-[11px] text-muted-foreground">
                Informado aos clientes na central de suporte.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              As alterações surtem efeito instantâneo em toda a aplicação.
            </p>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-6 bg-[#17323D] hover:bg-[#17323D]/90 text-white text-xs font-semibold rounded-xl gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Dados de Contato</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default DevContact
