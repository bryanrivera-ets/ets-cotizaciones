import { produce } from 'immer'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { diffSummary } from '../../domain/changelog.ts'
import type { Library, LibraryKey } from '../../domain/library.ts'
import { backend } from '../../services/backend/index.ts'
import { LibraryContext, type LibraryApi } from './context.ts'

const SAVE_DELAY = 800

/**
 * Biblioteca en vivo (se actualiza sola si otra persona cambia algo) y guardado con una
 * pequeña espera, para no subir un cambio por cada letra. Cada guardado queda en el
 * registro de cambios con un resumen.
 */
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<Library | null>(null)
  const current = useRef<Library | null>(null)
  /** Última versión que llegó de la nube (base para el resumen de cambios) */
  const saved = useRef<Library | null>(null)
  const timers = useRef(new Map<LibraryKey, ReturnType<typeof setTimeout>>())

  useEffect(
    () =>
      backend.library.subscribe((remote) => {
        saved.current = remote
        // Las colecciones que se están editando aquí conservan la versión local
        const merged = { ...remote }
        if (current.current)
          for (const k of timers.current.keys()) (merged as Record<string, unknown>)[k] = current.current[k]
        current.current = merged
        setLibrary(merged)
      }),
    [],
  )

  // Si se cierra la pantalla con cambios esperando, se guardan ya
  useEffect(() => {
    const t = timers.current
    return () => {
      for (const [k, timer] of t) {
        clearTimeout(timer)
        if (current.current) void backend.library.save(k, current.current[k])
      }
    }
  }, [])

  const scheduleSave = useCallback((key: LibraryKey) => {
    const t = timers.current
    clearTimeout(t.get(key))
    t.set(
      key,
      setTimeout(() => {
        t.delete(key)
        const lib = current.current
        if (!lib) return
        const summary = saved.current ? diffSummary(key, saved.current[key], lib[key]) : null
        void backend.library.save(key, lib[key])
        if (summary) void backend.changelog.add(key, summary)
      }, SAVE_DELAY),
    )
  }, [])

  const replace = useCallback(
    <K extends LibraryKey>(key: K, items: Library[K]) => {
      if (!current.current) return
      current.current = { ...current.current, [key]: items }
      setLibrary(current.current)
      scheduleSave(key)
    },
    [scheduleSave],
  )

  const update = useCallback(
    <K extends LibraryKey>(key: K, recipe: (draft: Library[K]) => void) => {
      if (!current.current) return
      replace(key, produce(current.current[key], recipe) as Library[K])
    },
    [replace],
  )

  // Las refs solo se leen dentro de update/replace (al editar), no al dibujar
  const api = useMemo<LibraryApi | null>(() => (library ? { library, update, replace } : null), [library, update, replace])

  // oxlint-disable-next-line react/refs -- falso positivo: las refs solo se usan dentro de update/replace
  if (!api) return <p className="page muted">Cargando…</p>
  return <LibraryContext.Provider value={api}>{children}</LibraryContext.Provider>
}
