import { useEffect, useState } from 'react'
import { AlertTriangle, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/integrations/supabase/client'
import { devAdmin, DevAdminError, type AppErrorLog } from '@/lib/devAdmin'
import type { Organization } from '@/types'

const SEVERITY_STYLES: Record<string, string> = {
  error: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  info: 'bg-gray-100 text-gray-700 border-gray-200',
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

export function DevErrors() {
  const { addToast } = useToast()
  const [logs, setLogs] = useState<AppErrorLog[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [severity, setSeverity] = useState<'todas' | 'error' | 'warning'>('todas')

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [logList, orgList] = await Promise.all([
        devAdmin.errorLogs(200),
        // A tabela organizations tem policy de SELECT só para a própria org, e
        // a DEV não tem org. O nome da imobiliária vem por esta RPC, que é
        // SECURITY DEFINER e devolve apenas o necessário.
        supabase.rpc('dev_org_names'),
      ])
      setLogs(logList)
      setOrgs((orgList.data ?? []) as Organization[])
    } catch (error) {
      const message =
        error instanceof DevAdminError ? error.message : 'Falha ao carregar erros.'
      setLoadError(message)
      addToast(message, 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClear = async () => {
    if (!confirm('Limpar todos os logs de erro? A ação fica registrada na auditoria.')) return
    try {
      await devAdmin.clearErrorLogs()
      addToast('Logs de erro limpos.', 'success')
      load()
    } catch (error) {
      addToast(error instanceof DevAdminError ? error.message : 'Falha ao limpar.', 'error')
    }
  }

  const orgName = (orgId: string | null) =>
    orgId ? orgs.find((o) => o.id === orgId)?.name ?? 'imobiliária' : 'sem imobiliária'

  const filtered = logs.filter((log) => severity === 'todas' || log.severity === severity)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl">Erros</h2>
          <p className="text-sm text-muted-foreground">
            {logs.filter((l) => l.severity === 'error').length} erros ·{' '}
            {logs.filter((l) => l.severity === 'warning').length} avisos
          </p>
        </div>
        {logs.length > 0 && (
          <Button variant="outline" onClick={handleClear} className="rounded-md">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      <div className="flex gap-1 border-b">
        {(['todas', 'error', 'warning'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setSeverity(value)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px cursor-pointer transition-colors active:scale-[0.98] ${
              severity === value
                ? 'border-[#AD7B3B] text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {value === 'todas' ? 'Todos' : value === 'error' ? 'Erros' : 'Avisos'}
          </button>
        ))}
      </div>

      {loadError && (
        <Alert variant="error" title="Erro ao carregar os logs" className="mb-4">
          {loadError}
        </Alert>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card className="rounded-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground opacity-40" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum erro registrado.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-md">
          <CardContent className="pt-6">
            <ul className="divide-y">
              {filtered.map((log) => {
                const isOpen = expanded === log.id
                return (
                  <li key={log.id} className="py-3">
                    <button
                      onClick={() => setExpanded(isOpen ? null : log.id)}
                      className="w-full text-left flex items-start gap-2 cursor-pointer hover:bg-muted/40 transition-colors active:scale-[0.995] rounded-sm px-1 -mx-1 py-0.5"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded border ${SEVERITY_STYLES[log.severity]}`}
                          >
                            {log.severity}
                          </span>
                          <code className="text-xs text-muted-foreground">{log.source}</code>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm break-words">{log.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {orgName(log.org_id)}
                        </p>

                        {isOpen && (
                          <div className="mt-3 space-y-2">
                            {log.stack && (
                              <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                                {log.stack}
                              </pre>
                            )}
                            {log.context && (
                              <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                                {JSON.stringify(log.context, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DevErrors
