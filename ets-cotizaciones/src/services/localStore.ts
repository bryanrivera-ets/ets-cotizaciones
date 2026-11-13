/**
 * Guardado local (IndexedDB) de las cotizaciones.
 * En la Fase 6 se reemplaza por Firestore con caché offline, manteniendo esta misma interfaz.
 */
import { createStore, del, get, set, values } from 'idb-keyval'
import type { Quote } from '../domain/types.ts'

export interface StoredQuote {
  quote: Quote
  /** ISO de la última modificación */
  updatedAt: string
}

export interface QuoteStore {
  list(): Promise<StoredQuote[]>
  get(id: string): Promise<StoredQuote | undefined>
  save(quote: Quote): Promise<StoredQuote>
  remove(id: string): Promise<void>
}

const db = createStore('ets-cotizaciones', 'quotes')

export const localQuoteStore: QuoteStore = {
  async list() {
    const all = await values<StoredQuote>(db)
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  get: (id) => get<StoredQuote>(id, db),
  async save(quote) {
    const stored = { quote, updatedAt: new Date().toISOString() }
    await set(quote.id, stored, db)
    return stored
  },
  remove: (id) => del(id, db),
}

// ───────────────────────── Preferencias de este dispositivo ─────────────────────────

const PROFILE_KEY = 'ets.currentProfileId'

export function getCurrentProfileId(): string | null {
  try {
    return localStorage.getItem(PROFILE_KEY)
  } catch {
    return null
  }
}

export function setCurrentProfileId(id: string): void {
  try {
    localStorage.setItem(PROFILE_KEY, id)
  } catch {
    /* modo privado: se ignora */
  }
}
