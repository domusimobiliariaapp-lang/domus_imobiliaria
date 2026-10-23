import React, { createContext, useContext, useMemo } from 'react';
import { useAuth as useDomusAuth } from '@/hooks/useAuth';

export interface SolarUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

interface SolarAuthContextType {
  user: SolarUser | null;
  profile: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (roles?: string[]) => boolean;
  organization: any | null;
}

const SolarAuthContext = createContext<SolarAuthContextType>({
  user: null,
  profile: null,
  loading: false,
  logout: async () => {},
  signOut: async () => {},
  hasRole: () => true,
  organization: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const domusAuth = useDomusAuth();

  const solarUser: SolarUser | null = useMemo(() => {
    if (!domusAuth.user) return null;
    return {
      id: domusAuth.user.id,
      email: domusAuth.user.email,
      name: domusAuth.profile?.name || domusAuth.user.email?.split('@')[0] || 'Usuário',
      role: domusAuth.profile?.role || 'MASTER',
      user_metadata: {
        name: domusAuth.profile?.name || domusAuth.user.email?.split('@')[0],
      },
    };
  }, [domusAuth.user, domusAuth.profile]);

  const value: SolarAuthContextType = useMemo(
    () => ({
      user: solarUser,
      profile: domusAuth.profile,
      loading: domusAuth.loading,
      logout: domusAuth.signOut,
      signOut: domusAuth.signOut,
      hasRole: (_roles?: string[]) => true, // Permite acesso pleno aos módulos liberados
      organization: domusAuth.organization,
    }),
    [solarUser, domusAuth.profile, domusAuth.loading, domusAuth.signOut, domusAuth.organization]
  );

  return (
    <SolarAuthContext.Provider value={value}>
      {children}
    </SolarAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(SolarAuthContext);
  if (!context) {
    // Fallback gracioso se renderizado fora do SolarAuthProvider
    return {
      user: { id: 'dev-user', email: 'dev@domus.com', name: 'Administrador Domus', role: 'MASTER' } as SolarUser,
      profile: null,
      loading: false,
      logout: async () => {},
      signOut: async () => {},
      hasRole: () => true,
      organization: null,
    };
  }
  return context;
}
