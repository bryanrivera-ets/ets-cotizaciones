import { produce } from 'immer'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Library, LibraryKey } from '../../domain/library.ts'
import { localLibraryStore } from '../../services/libraryStore.ts'
import { LibraryContext, type LibraryApi } from './context.ts'

/** Carga la biblioteca al abrir la app y guarda cada cambio. */
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<Library | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    localLibraryStore.load().then(setLibrary, (e) => setError(String(e)))
  }, [])

  const replace = useCallback(<K extends LibraryKey>(key: K, items: Library[K]) => {
    setLibrary((lib) => (lib ? { ...lib, [key]: items } : lib))
    void localLibraryStore.save(key, items)
  }, [])

  const update = useCallback(<K extends LibraryKey>(key: K, recipe: (draft: Library[K]) => void) => {
    setLibrary((lib) => {
      if (!lib) return lib
      const items = produce(lib[key], recipe) as Library[K]
      void localLibraryStore.save(key, items)
      return { ...lib, [key]: items }
    })
  }, [])

  const api = useMemo<LibraryApi | null>(() => (library ? { library, update, replace } : null), [library, update, replace])

  if (error) return <p className="page warning">No se pudo cargar la configuración: {error}</p>
  if (!api) return <p className="page muted">Cargando…</p>
  return <LibraryContext.Provider value={api}>{children}</LibraryContext.Provider>
}
