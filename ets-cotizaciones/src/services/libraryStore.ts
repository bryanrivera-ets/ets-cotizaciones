/**
 * Guardado local (IndexedDB) de la biblioteca.
 * En la Fase 6 se reemplaza por Firestore (compartido entre usuarios) con la misma interfaz.
 */
import { createStore, get, set } from 'idb-keyval'
import { LIBRARY_KEYS, withDefaults, type Library, type LibraryKey } from '../domain/library.ts'

export interface LibraryStore {
  load(): Promise<Library>
  save<K extends LibraryKey>(key: K, items: Library[K]): Promise<void>
}

const db = createStore('ets-cotizaciones-library', 'library')

export const localLibraryStore: LibraryStore = {
  async load() {
    const partial: Partial<Library> = {}
    for (const k of LIBRARY_KEYS) {
      const v = await get(k, db)
      if (v) (partial as Record<string, unknown>)[k] = v
    }
    return withDefaults(partial)
  },
  save: (key, items) => set(key, items, db),
}
