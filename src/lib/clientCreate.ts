import { supabase } from '@/integrations/supabase/client'

/**
 * Cadastro de cliente.
 *
 * Vai para a edge function `cliente-create`, e não para o `useCreateEntity`.
 *
 * A tela de clientes precisa de service role por um motivo que policy nenhuma
 * resolve: profiles.id é REFERENCES auth.users(id) e não tem default, e o
 * cliente entra no portal por CPF + telefone mas recebe o código por e-mail —
 * ou seja, a linha em auth.users precisa existir. Criar cliente é criar conta.
 *
 * O org_id nunca vem do front: a função tira do token.
 */

export class ClientCreateError extends Error {}

export interface NovoCliente {
  full_name: string
  email: string
  cpf_cnpj_limpo: string
  telefone_e164: string
  tipo_relacao?: string
  categoria?: string
  status?: 'ativo' | 'inativo'
  observacoes?: string
  endereco?: string
  endereco_cep?: string
  endereco_street?: string
  endereco_number?: string
  endereco_complement?: string
  endereco_neighborhood?: string
  endereco_city?: string
  endereco_state?: string
}

export async function createClient(input: NovoCliente): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new ClientCreateError('Sessão expirada. Entre novamente.')

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cliente-create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(input),
    },
  )

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ClientCreateError(data.error ?? 'Não foi possível cadastrar o cliente.')
  }
  return data.id
}

/**
 * Alteração do cadastro.
 *
 * Update normal, direto pelo RLS: nenhuma das colunas de cliente depende de
 * auth.users, e a policy já restringe à própria org. Só a criação precisa de
 * service role.
 */
export async function updateClient(id: string, data: Partial<NovoCliente>): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(data as Record<string, unknown>)
    .eq('id', id)

  if (error) {
    if (/row-level security/i.test(error.message)) {
      throw new ClientCreateError('Sua conta não tem permissão para alterar este cliente.')
    }
    throw new ClientCreateError(error.message)
  }
}
