import { lazy, Suspense, useEffect, useState } from 'react'
import { AuthGate } from '../features/auth/AuthGate.tsx'
import { useAuth } from '../features/auth/context.ts'
import { LibraryProvider } from '../features/library/LibraryProvider.tsx'
import { QuoteListPage } from '../features/quotes/QuoteListPage.tsx'
import { SettingsPage } from '../features/settings/SettingsPage.tsx'
import { InstallPage } from '../features/pwa/InstallPage.tsx'
import { InstallButton, UpdatePrompt } from '../features/pwa/PwaUi.tsx'
import { SyncStatus } from '../features/sync/SyncStatus.tsx'

// El editor incluye el generador de PDF (pesado): se carga solo al abrir una cotización
const QuoteEditorPage = lazy(() => import('../features/quotes/QuoteEditorPage.tsx').then((m) => ({ default: m.QuoteEditorPage })))

/** Navegación por "hash" (#/…): funciona sin servidor y sin conexión. */
function useHashPath(): [string, (p: string) => void] {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [path, setPath] = useState(read)
  useEffect(() => {
    const on = () => setPath(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const navigate = (p: string) => {
    window.location.hash = p
    window.scrollTo(0, 0)
  }
  return [path, navigate]
}

function UserMenu() {
  const { email, signOut } = useAuth()
  if (email === 'local') return null
  return (
    <div className="user-menu">
      <span className="muted" title={email}>
        {email}
      </span>
      <button className="link" onClick={() => confirm('¿Cerrar sesión en este dispositivo?') && signOut()}>
        Salir
      </button>
    </div>
  )
}

export default function App() {
  const [path, navigate] = useHashPath()
  const edit = /^\/cotizacion\/([\w-]+)$/.exec(path)
  const settings = /^\/configuracion(?:\/([\w-]+))?$/.exec(path)

  // Las instrucciones de instalación se ven aunque no se haya iniciado sesión
  if (path === '/instalar')
    return (
      <div className="app">
        <header className="topbar">
          <a href="#/" className="brand">
            <img src={`${import.meta.env.BASE_URL}logo-ets.png`} alt="" />
            <span>Cotizaciones</span>
          </a>
          <nav className="nav">
            <a href="#/">← Volver</a>
          </nav>
        </header>
        <InstallPage />
        <UpdatePrompt />
      </div>
    )

  return (
    <>
    <UpdatePrompt />
    <AuthGate>
      <LibraryProvider>
        <div className="app">
          <header className="topbar">
            <a href="#/" className="brand">
              <img src={`${import.meta.env.BASE_URL}logo-ets.png`} alt="" />
              <span>Cotizaciones</span>
            </a>
            <SyncStatus />
            <nav className="nav">
              <a href="#/" aria-current={!settings ? 'page' : undefined}>
                Cotizaciones
              </a>
              <a href="#/configuracion" aria-current={settings ? 'page' : undefined}>
                Configuración
              </a>
            </nav>
            <InstallButton />
            <UserMenu />
          </header>
          <main>
            {settings ? (
              <SettingsPage tab={settings[1] ?? 'sistemas'} navigate={navigate} />
            ) : edit ? (
              <Suspense fallback={<p className="page muted">Abriendo…</p>}>
                <QuoteEditorPage key={edit[1]} id={edit[1]} navigate={navigate} />
              </Suspense>
            ) : (
              <QuoteListPage navigate={navigate} />
            )}
          </main>
        </div>
      </LibraryProvider>
    </AuthGate>
    </>
  )
}
