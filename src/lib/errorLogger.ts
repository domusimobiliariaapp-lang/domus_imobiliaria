import { supabase } from '@/integrations/supabase/client'

/**
 * Envia erros para app_error_logs, que só a conta DEV lê.
 *
 * Nunca deve lançar nem rejeitar: um logger que derruba a tela que ele deveria
 * apenas registrar é pior que o erro original. Todo caller usa `void logError`.
 */

let queue: Promise<unknown> = Promise.resolve()

export function logError(
  error: unknown,
  source: string,
  context?: Record<string, unknown>,
  severity: 'error' | 'warning' | 'info' = 'error',
) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack ?? null : null

  // currentUser fica fora do payload: o id do usuário já vem pela sessão e a
  // coluna user_id é preenchida pelo servidor quando a sessão existe.
  queue = queue
    .then(() =>
      supabase.from('app_error_logs').insert({
        source,
        message: message.slice(0, 2000),
        stack: stack?.slice(0, 8000) ?? null,
        context: context ?? null,
        severity,
      }),
    )
    // Engolido de propósito: falha ao registrar não pode virar erro novo.
    .catch(() => undefined)

  return queue
}

/** Erro de rede/Supabase que a UI mostra como falha de carregamento. */
export function logQueryError(error: unknown, source: string, context?: Record<string, unknown>) {
  return logError(error, source, context, 'warning')
}
