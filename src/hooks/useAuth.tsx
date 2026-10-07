import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, Organization } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  /** Imobiliária do usuário, para o header mostrar nome e logo. Nula para o DEV. */
  organization: Organization | null
  loading: boolean
  /**
   * A conta ainda está com a senha que o admin definiu, e o dono precisa trocar.
   *
   * Vem de app_metadata, que só a service role escreve — por isso não dá para
   * o próprio usuário reescrever o flag e escapar da troca.
   */
  requiresPasswordChange: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  /**
   * Troca a senha do próprio usuário e desliga o flag.
   *
   * `currentPassword` é exigida pelo Supabase mesmo sem este parâetro: trocar
   * senha sem saber a antiga seria uma brecha para quem conseguisse abrir a
   * sessão num navegador compartilhado.
   */
  updatePassword: (
    newPassword: string,
    currentPassword: string,
  ) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)

  // O flag vive no JWT, não no profile: app_metadata não sai de auth.users, e
  // buscar de novo a cada render custaria uma requisição por tecla digitada.
  const lerFlagSenha = (u: User | null) => {
    const bruto = (u?.app_metadata as Record<string, unknown> | undefined)?.requires_password_change
    setRequiresPasswordChange(bruto === true || bruto === 'true')
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)

      // A organization tem policy de SELECT só para a própria org, então a RLS
      // já garante que o usuário não lê a organização de outra imobiliária.
      if (data.org_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', data.org_id)
          .maybeSingle()
        setOrganization(org ?? null)
      } else {
        setOrganization(null)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfile(null)
      setOrganization(null)
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      lerFlagSenha(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        lerFlagSenha(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setOrganization(null)
        }
        setLoading(false)

        // PASSWORD_RECOVERY é o evento do link de recuperação: a sessão já
        // está logada, mas a senha ainda não foi trocada. Sem isto, o usuário
        // cairia no admin normal sem nunca ver a tela de nova senha.
        if (event === 'PASSWORD_RECOVERY') {
          setRequiresPasswordChange(true)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setOrganization(null)
    setRequiresPasswordChange(false)
  }

  const updatePassword = async (newPassword: string, currentPassword: string) => {
    // Confere a senha atual explicitamente. updateUser aceitaria a troca só com
    // a sessão aberta, e quem estiver num navegador compartilhado trocaria a
    // senha de quem entrou antes sem nunca saber qual era.
    if (!user?.email) {
      return { error: new Error('Sessão expirada. Entre novamente.') }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) {
      return { error: new Error('Senha atual incorreta.') }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      return { error: new Error(error.message) }
    }

    // O JWT em mãos ainda diz que a troca é obrigatória. Sem renovar a sessão, o
    // gate continua segurando o usuário numa tela que ele acabou de resolver.
    try {
      await supabase.auth.refreshSession()
    } catch (refreshError) {
      // If refresh fails, we still want to clear the flag so the user isn't stuck.
      // The user may need to reload the app to get the updated JWT.
      console.warn('Failed to refresh session after password change:', refreshError)
    }
    setRequiresPasswordChange(false)
    return { error: null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        loading,
        requiresPasswordChange,
        signIn,
        signOut,
        refreshProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}