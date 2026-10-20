import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/integrations/supabase/client'

interface AuditEntry {
  id: string
  actor_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  create_user: 'Criou conta',
  update_user: 'Editou conta',
  set_password: 'Trocou senha',
  activate_user: 'Ativou conta',
  deactivate_user: 'Desativou conta',
  delete_user: 'Excluiu conta',
  create_organization: 'Criou imobiliária',
  update_organization: 'Editou imobiliária',
  delete_organization: 'Excluiu imobiliária',
  clear_error_logs: 'Limpou logs de erro',
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function DevAudit() {
  const { addToast } = useToast()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setLoadError(null)
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) {
        const message = `Erro ao carregar auditoria: ${error.message}`
        setLoadError(message)
        addToast(message, 'error')
      } else {
        setEntries((data ?? []) as AuditEntry[])
      }
      setLoading(false)
    }
    load()
  }, [addToast])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl">Auditoria</h2>
        <p className="text-sm text-muted-foreground">
          Ações sensíveis feitas no painel, com autor e horário.
        </p>
      </div>

      <Card className="rounded-md">
        <CardContent className="pt-6">
          {loadError && (
            <Alert variant="error" title="Erro ao carregar" className="mb-4">
              {loadError}
            </Alert>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <ScrollText className="h-8 w-8 mx-auto text-muted-foreground opacity-40" />
              <p className="mt-2 text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="pb-2 pr-3 font-medium">Quando</th>
                    <th className="pb-2 pr-3 font-medium">Ação</th>
                    <th className="pb-2 pr-3 font-medium">Alvo</th>
                    <th className="pb-2 font-medium">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(entry.created_at)}
                      </td>
                      <td className="py-2.5 pr-3">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                        {entry.target_type ?? '—'}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground font-mono break-all">
                        {entry.details ? JSON.stringify(entry.details) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DevAudit
