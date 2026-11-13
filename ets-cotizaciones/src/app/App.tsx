import { lazy, Suspense, useEffect, useState } from 'react'
import { QuoteListPage } from '../features/quotes/QuoteListPage.tsx'

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

export default function App() {
  const [path, navigate] = useHashPath()
  const edit = /^\/cotizacion\/([\w-]+)$/.exec(path)

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          <img src={`${import.meta.env.BASE_URL}logo-ets.png`} alt="" />
          <span>Cotizaciones</span>
        </a>
      </header>
      <main>
        {edit ? (
          <Suspense fallback={<p className="page muted">Abriendo…</p>}>
            <QuoteEditorPage key={edit[1]} id={edit[1]} navigate={navigate} />
          </Suspense>
        ) : (
          <QuoteListPage navigate={navigate} />
        )}
      </main>
    </div>
  )
}
