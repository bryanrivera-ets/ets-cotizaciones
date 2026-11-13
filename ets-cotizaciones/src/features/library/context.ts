import { createContext, useContext } from 'react'
import type { Library, LibraryKey } from '../../domain/library.ts'

export interface LibraryApi {
  library: Library
  /** Modifica una colección con un "borrador" de immer y la guarda. */
  update: <K extends LibraryKey>(key: K, recipe: (draft: Library[K]) => void) => void
  /** Reemplaza una colección completa (ej. restaurar valores iniciales). */
  replace: <K extends LibraryKey>(key: K, items: Library[K]) => void
}

export const LibraryContext = createContext<LibraryApi | null>(null)

export function useLibrary(): LibraryApi {
  const api = useContext(LibraryContext)
  if (!api) throw new Error('useLibrary debe usarse dentro de <LibraryProvider>')
  return api
}
