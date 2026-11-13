/**
 * Puerta de entrada: pide iniciar sesión y verifica que el email esté en la lista de
 * usuarios autorizados. Funciona sin internet si la persona ya había entrado antes
 * en este dispositivo (Firebase recuerda la sesión).
 */
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { AllowedUser } from '../../services/backend/index.ts'
import { getFirebase } from '../../services/firebase/app.ts'
import { isFirebaseConfigured } from '../../services/firebase/config.ts'
import { Button } from '../../ui/controls.tsx'
import { AuthContext, type AuthApi } from './context.ts'

const LAST_OK = 'ets.lastAllowedEmail'
const remember = (email: string | null) => {
  try {
    if (email) localStorage.setItem(LAST_OK, email)
    else localStorage.removeItem(LAST_OK)
  } catch {
    /* sin almacenamiento */
  }
}
const lastOk = () => {
  try {
    return localStorage.getItem(LAST_OK)
  } catch {
    return null
  }
}

type State =
  | { kind: 'loading' }
  | { kind: 'signedOut' }
  | { kind: 'notAllowed'; email: string }
  | { kind: 'ready'; email: string; allowed: AllowedUser | null }

export function AuthGate({ children }: { children: ReactNode }) {
  if (!isFirebaseConfigured) return <LocalMode>{children}</LocalMode>
  return <FirebaseGate>{children}</FirebaseGate>
}

function LocalMode({ children }: { children: ReactNode }) {
  const api = useMemo<AuthApi>(() => ({ email: 'local', allowed: null, signOut: async () => {} }), [])
  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}

function FirebaseGate({ children }: { children: ReactNode }) {
  const { auth, db } = getFirebase()
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => onAuthStateChanged(auth, setUser), [auth])

  // Verificar la lista de usuarios autorizados (en vivo: si te quitan, se cierra el acceso)
  useEffect(() => {
    if (user === undefined) return
    if (user === null) {
      // Responde a un cambio de sesión de Firebase (sistema externo)
      // oxlint-disable-next-line react/set-state-in-effect
      setState({ kind: 'signedOut' })
      return
    }
    const email = (user.email ?? '').toLowerCase()
    // Sin internet: si ya había entrado antes con este email, se le deja pasar (los datos están en caché)
    if (lastOk() === email) setState({ kind: 'ready', email, allowed: null })
    return onSnapshot(
      doc(db, 'allowedUsers', email),
      (snap) => {
        if (snap.exists()) {
          remember(email)
          setState({ kind: 'ready', email, allowed: snap.data() as AllowedUser })
        } else if (!snap.metadata.fromCache) {
          remember(null)
          setState({ kind: 'notAllowed', email })
        }
      },
      (e) => {
        if ((e as { code?: string }).code === 'permission-denied') {
          remember(null)
          setState({ kind: 'notAllowed', email })
        }
      },
    )
  }, [user, db])

  const api = useMemo<AuthApi | null>(
    () =>
      state.kind === 'ready'
        ? {
            email: state.email,
            allowed: state.allowed,
            signOut: async () => {
              remember(null)
              await signOut(auth)
            },
          }
        : null,
    [state, auth],
  )

  if (state.kind === 'loading') return <p className="page muted">Cargando…</p>
  if (state.kind === 'signedOut') return <LoginPage />
  if (state.kind === 'notAllowed')
    return (
      <div className="login">
        <div className="login__card">
          <img src={`${import.meta.env.BASE_URL}logo-ets.png`} alt="ETS" />
          <h1>Sin autorización</h1>
          <p>
            La cuenta <b>{state.email}</b> no está en la lista de usuarios autorizados. Pide a un administrador que te agregue en
            Configuración → Usuarios.
          </p>
          <Button onClick={() => signOut(auth)}>Cerrar sesión</Button>
        </div>
      </div>
    )
  return <AuthContext.Provider value={api!}>{children}</AuthContext.Provider>
}

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.',
  'auth/user-not-found': 'Email o contraseña incorrectos.',
  'auth/missing-password': 'Escribe la contraseña.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/user-disabled': 'Esta cuenta está desactivada.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
  'auth/network-request-failed': 'Sin conexión. Para entrar por primera vez en este dispositivo necesitas internet.',
}

function LoginPage() {
  const { auth } = getFirebase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      setError(AUTH_ERRORS[(err as { code?: string }).code ?? ''] ?? `No se pudo iniciar sesión (${(err as Error).message}).`)
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    if (!email.trim()) return setError('Escribe tu email y vuelve a pulsar "Olvidé mi contraseña".')
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setInfo(`Te enviamos un email a ${email.trim()} para cambiar la contraseña.`)
      setError(null)
    } catch (err) {
      setError(AUTH_ERRORS[(err as { code?: string }).code ?? ''] ?? (err as Error).message)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <img src={`${import.meta.env.BASE_URL}logo-ets.png`} alt="ETS – Epoxy Technologies Systems" />
        <h1>Cotizaciones</h1>
        <label>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <p className="warning">{error}</p> : null}
        {info ? <p className="ok">{info}</p> : null}
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
        <button type="button" className="link" onClick={reset}>
          Olvidé mi contraseña
        </button>
      </form>
    </div>
  )
}
