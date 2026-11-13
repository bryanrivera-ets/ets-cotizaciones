import { createContext, useContext } from 'react'
import type { AllowedUser } from '../../services/backend/index.ts'

export interface AuthApi {
  /** Email de la persona conectada ('local' sin Firebase) */
  email: string
  /** Datos de la lista de usuarios autorizados (nombre, perfil) */
  allowed: AllowedUser | null
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthApi | null>(null)

export function useAuth(): AuthApi {
  const a = useContext(AuthContext)
  if (!a) throw new Error('useAuth debe usarse dentro de <AuthGate>')
  return a
}
