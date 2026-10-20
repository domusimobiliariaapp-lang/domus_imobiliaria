import { useEffect, useState } from 'react'
import { LifeBuoy, Send, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { devAdmin, DevAdminError, type SupportTicket, type SupportMessage } from '@/lib/devAdmin'

/**
 * Chamados com o suporte, do lado da equipe da imobiliária.
 *
 * A RLS já limita a leitura aos chamados da própria org
 * ("Team can view own org tickets"), então a lista aqui nunca traz o chamado de
 * outra imobiliária — não é filtro no navegador. O org_id do chamado vem do
 * trigger set_org_id no banco, que ignora o valor do corpo.
 *
 * O botão do cabeçalho abre esta tela em vez de um modal: chamado é
 * assunto com conversa em thread, e um modal estreito obrigaria a abrir e
 * fechar a cada mensagem.
 */

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

export function AdminSupport() {
  const { addToast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setTickets(await devAdmin.tickets())
    } catch (error) {
      const message =
        error instanceof DevAdminError ? error.message : 'Falha ao carregar chamados.'
      setLoadError(message)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    try {
      const ticket = await devAdmin.openTicket(subject.trim(), body.trim())
      setSubject('')
      setBody('')
      addToast('Chamado enviado. O suporte foi notificado.', 'success')
      await load()
      await openTicket(ticket)
    } catch (error) {
      addToast(
        error instanceof DevAdminError ? error.message : 'Não foi possível abrir o chamado.',
        'error',
      )
    }
    setSending(false)
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      await devAdmin.replyTicket(selected.id, reply.trim(), false)
      setReply('')
      setMessages(await devAdmin.ticketMessages(selected.id))
      load()
      // Atualiza o cabeçalho sem reabrir a lista.
      setSelected((prev) => (prev ? { ...prev, status: 'aberto' } : prev))
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao responder.', 'error')
    }
    setSending(false)
  }

  const closeTicket = async (ticket: SupportTicket) => {
    try {
      await devAdmin.setTicketStatus(ticket.id, 'fechado')
      setSelected((prev) => (prev ? { ...prev, status: 'fechado' as SupportTicket['status'] } : prev))
      load()
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao fechar o chamado.', 'error')
    }
  }

  const abertos = tickets.filter((t) => t.status === 'aberto').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl flex items-center gap-2">
          <LifeBuoy className="h-6 w-6" />
          Chamados
        </h2>
        <p className="text-sm text-muted-foreground">
          {abertos} em aberto · {tickets.length} no total
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Novo chamado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Abrir chamado</CardTitle>
            <CardDescription>
              A equipe de suporte responde por aqui. Descreva o problema com o
              máximo de detalhe possível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket_subject">Assunto</Label>
                <Input
                  id="ticket_subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Resumo do problema"
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_body">Descrição</Label>
                <Textarea
                  id="ticket_body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="O que aconteceu, o que você esperava, e passos para reproduzir..."
                  rows={5}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={sending || !subject.trim() || !body.trim()}
                  className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Chamados da imobiliária */}
        <div className="space-y-4">
          {loadError && (
            <div className="p-4 flex items-center gap-3 text-destructive bg-destructive/10 rounded-md">
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Não foi possível carregar os chamados</p>
                <p className="text-sm">{loadError}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum chamado aberto ainda.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => openTicket(ticket)}
                    className={`w-full text-left p-4 rounded-md border bg-card text-card-foreground transition-colors hover:bg-accent/5 ${
                      selected?.id === ticket.id ? 'border-[#AD7B3B]' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(ticket.created_at)}
                        </p>
                      </div>
                      <Badge className={STATUS_STYLES[ticket.status]} variant="outline">
                        {STATUS_LABELS[ticket.status]}
                      </Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Conversa do chamado selecionado */}
      {selected && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{selected.subject}</CardTitle>
                <CardDescription>
                  Aberto em {formatDateTime(selected.created_at)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_STYLES[selected.status]} variant="outline">
                  {STATUS_LABELS[selected.status]}
                </Badge>
                {selected.status !== 'fechado' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => closeTicket(selected)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Marcar como resolvido
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={`p-3 rounded-md border ${
                    message.is_dev
                      ? 'bg-accent/10 border-accent/30'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">
                      {message.is_dev ? 'Suporte (Domus)' : 'Equipe'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                </li>
              ))}
            </ul>

            {selected.status !== 'fechado' ? (
              <form onSubmit={handleReply} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="ticket_reply">Responder</Label>
                  <Textarea
                    id="ticket_reply"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Enviando...' : 'Enviar resposta'}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este chamado está fechado. Abra um novo chamado se precisar de ajuda.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
