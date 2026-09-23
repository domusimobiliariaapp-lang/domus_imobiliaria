import * as React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { profile, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    // Redirect to the user's own area instead of looping
    if (profile?.role === 'cliente') {
      return <Navigate to="/portal/dashboard" replace />
    }
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

interface UnauthorizedProps {
  allowedRoles: UserRole[]
}

export function Unauthorized({ allowedRoles }: UnauthorizedProps) {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif font-medium text-primary mb-2">
          Acesso não autorizado
        </h1>
        <p className="text-muted-foreground mb-6">
          Seu perfil ({profile?.role || 'desconhecido'}) não tem permissão para acessar esta área.
          {allowedRoles.length > 0 && (
            <span> Perfil permitido: {allowedRoles.join(', ')}</span>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <a href="/admin/dashboard">Ir para o Dashboard</a>
          </Button>
          <Button asChild>
            <a href="/portal/dashboard">Ir para o Portal</a>
          </Button>
        </div>
      </div>
    </div>
  )
}