/**
 * Interfaz común del almacenamiento. Hay dos implementaciones:
 * - local.ts: IndexedDB en el navegador (desarrollo / sin Firebase configurado)
 * - firebase.ts: Firestore con caché offline + Authentication
 */
import type { Library, LibraryKey } from '../../domain/library.ts'
import type { Quote, QuoteNumber } from '../../domain/types.ts'

export interface StoredQuote {
  quote: Quote
  /** ISO de la última modificación */
  updatedAt: string
  updatedBy?: string
  createdBy?: string
  /** Hay cambios en este dispositivo que todavía no llegan a la nube */
  pending?: boolean
}

export type Unsubscribe = () => void

export interface AllowedUser {
  email: string
  name?: string
  /** Perfil (iniciales, título…) que usa esta persona por defecto */
  profileId?: string
  addedBy?: string
}

export interface ChangeLogEntry {
  id: string
  at: string
  by: string
  /** Colección modificada: systems, terms, profiles, users, counters… */
  collection: string
  summary: string
}

export interface Backend {
  mode: 'local' | 'firebase'

  quotes: {
    /** Lista en vivo (se actualiza sola cuando alguien cambia algo). */
    subscribe(cb: (items: StoredQuote[]) => void, onError?: (e: Error) => void): Unsubscribe
    /** Una cotización en vivo; `null` si no existe. */
    watch(id: string, cb: (item: StoredQuote | null) => void): Unsubscribe
    create(quote: Quote): Promise<void>
    /** Guarda el contenido. El número oficial NO se toca aquí (lo maneja `numbering`). */
    saveBody(quote: Quote): Promise<void>
    /** Cambia el número (revisiones). */
    setNumber(id: string, number: QuoteNumber): Promise<void>
    remove(id: string): Promise<void>
  }

  numbering: {
    /**
     * Asigna el próximo número oficial del año a la cotización (transacción: nunca se repite).
     * Si ya tenía número, lo devuelve sin gastar otro. Falla sin conexión.
     */
    reserve(quoteId: string, year: number): Promise<number>
    /** Próximo número que se asignará en ese año. */
    getNext(year: number): Promise<number>
    setNext(year: number, next: number): Promise<void>
  }

  library: {
    subscribe(cb: (lib: Library) => void): Unsubscribe
    save<K extends LibraryKey>(key: K, items: Library[K]): Promise<void>
  }

  users: {
    subscribe(cb: (users: AllowedUser[]) => void): Unsubscribe
    /** Autoriza un email; si se da contraseña, crea también la cuenta de acceso. */
    add(user: AllowedUser, password?: string): Promise<void>
    remove(email: string): Promise<void>
  }

  changelog: {
    add(collection: string, summary: string): Promise<void>
    subscribe(cb: (entries: ChangeLogEntry[]) => void, max?: number): Unsubscribe
  }

  /** Número de cambios de este dispositivo pendientes de subir a la nube. */
  onPendingChange(cb: (pending: number) => void): Unsubscribe
}
