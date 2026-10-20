import { useEffect, useState } from 'react'
import { LifeBuoy, Send, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/integrations/supabase/client'
import { devAdmin, DevAdminError, type SupportTicket, type SupportMessage } from '@/lib/devAdmin'
import type { Organization } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  respondido: 'Respondido',
  fechado: 'Fechado',
}

const STATUS_STYLES: Record<string, string> = {
  aberto: 'bg-amber-100 text-amber-800 border-amber-200',
  respondido: 'bg-blue-100 text-blue-800 border-blue-200',
  fechado: 'bg-gray-100 text-gray-700 border-gray-200',
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DevTickets() {
  const { addToast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'todos' | 'aberto' | 'respondido' | 'fechado'>('aberto')

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [ticketList, { data: orgList, error: orgError }] = await Promise.all([
        devAdmin.tickets(),
        // A DEV não tem org, então esta query cai na RLS. O nome da
        // imobiliária vem pela RPC dev_org_names, que é SECURITY DEFINER.
        supabase.rpc('dev_org_names'),
      ])
      setTickets(ticketList)
      setOrgs((orgList ?? []) as Organization[])
      if (orgError) {
        setLoadError(`Não foi possível carregar os nomes das imobiliárias: ${orgError.message}`)
      }
    } catch (error) {
      const message =
        error instanceof DevAdminError ? error.message : 'Falha ao carregar chamados.'
      setLoadError(message)
      addToast(message, 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openTicket = async (ticket: SupportTicket) => {
    setSelected(ticket)
    setReply('')
    try {
      setMessages(await devAdmin.ticketMessages(ticket.id))
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao carregar mensagens.', 'error')
    }
  }

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      await devAdmin.replyTicket(selected.id, reply.trim(), true)
      setReply('')
      setMessages(await devAdmin.ticketMessages(selected.id))
      load()
      // Atualiza o cabeçalho sem reabrir a lista.
      setSelected((prev) => (prev ? { ...prev, status: 'respondido' } : prev))
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao responder.', 'error')
    }
    setSending(false)
  }

  const setStatus = async (ticket: SupportTicket, status: string) => {
    try {
      await devAdmin.setTicketStatus(ticket.id, status)
      setSelected((prev) => (prev ? { ...prev, status: status as SupportTicket['status'] } : prev))
      load()
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao alterar status.', 'error')
    }
  }

  const orgName = (orgId: string) => orgs.find((o) => o.id === orgId)?.name ?? 'imobiliária'

  const filtered = tickets.filter((t) => filter === 'todos' || t.status === filter)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl">Chamados</h2>
        <p className="text-sm text-muted-foreground">
          {tickets.filter((t) => t.status === 'aberto').length} em aberto ·{' '}
          {tickets.length} no total
        </p>
      </div>

      <div className="flex gap-1 border-b">
        {(['aberto', 'respondido', 'fechado', 'todos'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px cursor-pointer transition-colors active:scale-[0.98] ${
              filter === value
                ? 'border-[#AD7B3B] text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {value === 'todos' ? 'Todos' : STATUS_LABELS[value]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {loadError && (
            <Alert variant="error" title="Erro ao carregar" className="mb-3">
              {loadError}
            </Alert>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <Card className="rounded-md">
              <CardContent className="pt-6">
                <div className="text-center py-6">
                  <LifeBuoy className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nenhum chamado {filter === 'todos' ? '' : `em ${STATUS_LABELS[filter].toLowerCase()}`}.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filtered.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => openTicket(ticket)}
                className={`w-full text-left p-3 rounded-md border bg-card cursor-pointer hover:border-[#AD7B3B] hover:shadow-sm transition-all active:scale-[0.99] ${
                  selected?.id === ticket.id ? 'border-[#AD7B3B] ring-1 ring-[#AD7B3B]/30' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{ticket.subject}</p>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${STATUS_STYLES[ticket.status]}`}
                  >
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {orgName(ticket.org_id)} · {formatDateTime(ticket.created_at)}
                </p>
              </button>
            ))
          )}
        </div>

        <div>
          {selected ? (
            <Card className="rounded-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-serif">{selected.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      {orgName(selected.org_id)} · aberto em {formatDateTime(selected.created_at)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {selected.status !== 'fechado' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus(selected, 'fechado')}
                      className="rounded-md"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Fechar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus(selected, 'aberto')}
                      className="rounded-md"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Reabrir
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-md p-3 text-sm ${
                        message.is_dev
                          ? 'bg-[#17323D] text-white ml-6'
                          : 'bg-muted mr-6'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <p
                        className={`text-xs mt-1.5 ${message.is_dev ? 'text-white/60' : 'text-muted-foreground'}`}
                      >
                        {message.is_dev ? 'Domus (DEV)' : orgName(selected.org_id)} ·{' '}
                        {formatDateTime(message.created_at)}
                      </p>
                    </div>
                  ))}
                </div>

                {selected.status !== 'fechado' && (
                  <div className="space-y-2 pt-2 border-t">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Escreva a resposta..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={sendReply}
                        disabled={sending || !reply.trim()}
                        className="rounded-md bg-[#17323D] text-white hover:bg-[#17323D]/90"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {sending ? 'Enviando...' : 'Responder'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-10">
                  Selecione um chamado para ver a conversa.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default DevTickets
