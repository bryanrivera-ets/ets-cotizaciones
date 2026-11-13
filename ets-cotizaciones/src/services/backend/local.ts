/**
 * Almacenamiento local (IndexedDB). Se usa cuando Firebase no está configurado.
 * Mismo comportamiento que la nube, pero solo en este navegador.
 */
import { createStore, del, get, set, values } from 'idb-keyval'
import { LIBRARY_KEYS, withDefaults, type Library } from '../../domain/library.ts'
import type { Quote } from '../../domain/types.ts'
import type { AllowedUser, Backend, ChangeLogEntry, StoredQuote } from './types.ts'

const quotesDb = createStore('ets-cotizaciones', 'quotes')
const libDb = createStore('ets-cotizaciones-library', 'library')
const metaDb = createStore('ets-cotizaciones-meta', 'meta')

/** Avisos simples para que las suscripciones se actualicen después de guardar. */
function emitter<T>() {
  const subs = new Set<(v: T) => void>()
  return {
    on(cb: (v: T) => void) {
      subs.add(cb)
      return () => void subs.delete(cb)
    },
    emit(v: T) {
      subs.forEach((cb) => cb(v))
    },
  }
}

const quotesChanged = emitter<void>()
const libraryChanged = emitter<void>()
const changelogChanged = emitter<void>()

async function listQuotes(): Promise<StoredQuote[]> {
  const all = await values<StoredQuote>(quotesDb)
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

async function putQuote(quote: Quote, extra: Partial<StoredQuote> = {}): Promise<void> {
  const cur = await get<StoredQuote>(quote.id, quotesDb)
  const meta = { locked: cur?.locked, supersededBy: cur?.supersededBy, revisionOf: cur?.revisionOf, ...extra }
  await set(quote.id, { quote, updatedAt: new Date().toISOString(), updatedBy: 'local', ...meta } satisfies StoredQuote, quotesDb)
  quotesChanged.emit()
}

const LOCKED_MSG = 'Esta versión fue reemplazada por una revisión y no se puede modificar.'

async function loadLibrary(): Promise<Library> {
  const partial: Partial<Library> = {}
  for (const k of LIBRARY_KEYS) {
    const v = await get(k, libDb)
    if (v) (partial as Record<string, unknown>)[k] = v
  }
  return withDefaults(partial)
}

const counterKey = (year: number) => `counter-${year}`

export const localBackend: Backend = {
  mode: 'local',

  quotes: {
    subscribe(cb, onError) {
      const load = () => listQuotes().then(cb, (e) => onError?.(e))
      void load()
      return quotesChanged.on(load)
    },
    watch(id, cb) {
      const load = () => get<StoredQuote>(id, quotesDb).then((s) => cb(s ?? null))
      void load()
      return quotesChanged.on(load)
    },
    create: (quote) => putQuote(quote),
    async saveBody(quote) {
      // Igual que en la nube: el número guardado manda sobre el del formulario.
      const cur = await get<StoredQuote>(quote.id, quotesDb)
      if (cur?.locked) throw new Error(LOCKED_MSG)
      await putQuote(cur ? { ...quote, number: cur.quote.number } : quote)
    },
    async setNumber(id, number) {
      const cur = await get<StoredQuote>(id, quotesDb)
      if (cur?.locked) throw new Error(LOCKED_MSG)
      if (cur) await putQuote({ ...cur.quote, number })
    },
    async createRevision(prevId, rev) {
      const prev = await get<StoredQuote>(prevId, quotesDb)
      if (!prev) throw new Error('La cotización no existe')
      if (prev.locked) throw new Error('Ya existe una revisión más nueva de esta cotización.')
      await putQuote(rev, { revisionOf: prevId, locked: false })
      await putQuote(prev.quote, { locked: true, supersededBy: rev.id })
    },
    async remove(id) {
      const cur = await get<StoredQuote>(id, quotesDb)
      if (cur?.locked) throw new Error('No se puede eliminar una versión anterior; elimina primero la revisión más nueva.')
      await del(id, quotesDb)
      if (cur?.revisionOf) {
        const prev = await get<StoredQuote>(cur.revisionOf, quotesDb)
        if (prev) await putQuote(prev.quote, { locked: false, supersededBy: undefined })
      }
      quotesChanged.emit()
    },
  },

  numbering: {
    async reserve(quoteId, year) {
      const cur = await get<StoredQuote>(quoteId, quotesDb)
      if (!cur) throw new Error('La cotización no existe')
      if (cur.quote.number.seq !== null) return cur.quote.number.seq
      const next = (await get<number>(counterKey(year), metaDb)) ?? 1
      await set(counterKey(year), next + 1, metaDb)
      await putQuote({ ...cur.quote, number: { ...cur.quote.number, seq: next, year } })
      return next
    },
    async getNext(year) {
      return (await get<number>(counterKey(year), metaDb)) ?? 1
    },
    async setNext(year, next) {
      await set(counterKey(year), next, metaDb)
    },
  },

  library: {
    subscribe(cb) {
      const load = () => loadLibrary().then(cb)
      void load()
      return libraryChanged.on(load)
    },
    async save(key, items) {
      await set(key, items, libDb)
      libraryChanged.emit()
    },
  },

  users: {
    subscribe(cb) {
      cb([{ email: 'local', name: 'Este dispositivo' }])
      return () => {}
    },
    async add() {
      throw new Error('Los usuarios solo se pueden administrar con Firebase configurado.')
    },
    async remove() {
      throw new Error('Los usuarios solo se pueden administrar con Firebase configurado.')
    },
  },

  changelog: {
    async add(collection, summary) {
      const list = (await get<ChangeLogEntry[]>('changelog', metaDb)) ?? []
      list.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), by: 'local', collection, summary })
      await set('changelog', list.slice(0, 500), metaDb)
      changelogChanged.emit()
    },
    subscribe(cb, max = 200) {
      const load = () => get<ChangeLogEntry[]>('changelog', metaDb).then((l) => cb((l ?? []).slice(0, max)))
      void load()
      return changelogChanged.on(load)
    },
  },

  onPendingChange(cb) {
    cb(0)
    return () => {}
  },
}

export type { AllowedUser }
