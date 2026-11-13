/**
 * Almacenamiento en Firebase (Firestore con caché offline).
 *
 * Estructura en Firestore:
 *   quotes/{id}          { body: Quote sin número, number, createdAt, createdBy, updatedAt, updatedBy }
 *   library/{clave}      { items: [...], updatedAt, updatedBy }   clave = systems, materials, positions, terms, profiles, signers
 *   counters/{año}       { next: número }                          próximo número oficial del año
 *   allowedUsers/{email} { email, name, profileId, addedBy, addedAt }
 *   changelog/{auto}     { at, by, collection, summary }
 *
 * El número oficial va en un campo aparte del contenido, para que el guardado automático
 * del formulario nunca pueda borrar un número asignado.
 */
import { deleteApp, initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  deleteField,
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore'
import { withDefaults, type Library } from '../../domain/library.ts'
import type { Quote, QuoteNumber } from '../../domain/types.ts'
import { firebaseConfig, useEmulators } from '../firebase/config.ts'
import { getFirebase } from '../firebase/app.ts'
import type { AllowedUser, Backend, ChangeLogEntry, StoredQuote } from './types.ts'

const fb = () => getFirebase()
const me = () => fb().auth.currentUser?.email?.toLowerCase() ?? 'desconocido'
const iso = (t: Timestamp | null | undefined) => (t ? t.toDate().toISOString() : new Date().toISOString())

type QuoteDoc = {
  body: Omit<Quote, 'number'>
  number: QuoteNumber
  locked?: boolean
  supersededBy?: string
  revisionOf?: string
  createdBy?: string
  updatedAt?: Timestamp
  updatedBy?: string
}

function splitQuote(q: Quote): { body: Omit<Quote, 'number'>; number: QuoteNumber } {
  const { number, ...body } = q
  return { body, number }
}

function toStored(snap: DocumentSnapshot): StoredQuote | null {
  if (!snap.exists()) return null
  const d = snap.data({ serverTimestamps: 'estimate' }) as QuoteDoc
  return {
    quote: { ...(d.body as Quote), number: d.number },
    updatedAt: iso(d.updatedAt),
    updatedBy: d.updatedBy,
    createdBy: d.createdBy,
    pending: snap.metadata.hasPendingWrites,
    locked: d.locked === true,
    supersededBy: d.supersededBy,
    revisionOf: d.revisionOf,
  }
}

// ───────────────────────── Cambios pendientes de subir ─────────────────────────

const pendingBySource = new Map<string, number>()
const pendingSubs = new Set<(n: number) => void>()
function setPending(source: string, n: number) {
  pendingBySource.set(source, n)
  const total = [...pendingBySource.values()].reduce((a, b) => a + b, 0)
  pendingSubs.forEach((cb) => cb(total))
}

export const firebaseBackend: Backend = {
  mode: 'firebase',

  quotes: {
    subscribe(cb, onError) {
      const q = query(collection(fb().db, 'quotes'), orderBy('updatedAt', 'desc'))
      return onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snap) => {
          setPending('quotes', snap.docs.filter((d) => d.metadata.hasPendingWrites).length)
          cb(snap.docs.map((d) => toStored(d)!).filter(Boolean))
        },
        (e) => onError?.(e),
      )
    },
    watch(id, cb) {
      return onSnapshot(doc(fb().db, 'quotes', id), { includeMetadataChanges: true }, (snap) => cb(toStored(snap)))
    },
    async create(quote) {
      const { body, number } = splitQuote(quote)
      // Sin "await": con o sin internet se guarda al instante en el dispositivo y se sube después
      void setDoc(doc(fb().db, 'quotes', quote.id), {
        body,
        number,
        createdAt: serverTimestamp(),
        createdBy: me(),
        updatedAt: serverTimestamp(),
        updatedBy: me(),
      })
    },
    async saveBody(quote) {
      const { body } = splitQuote(quote)
      void updateDoc(doc(fb().db, 'quotes', quote.id), { body, updatedAt: serverTimestamp(), updatedBy: me() })
    },
    async setNumber(id, number) {
      void updateDoc(doc(fb().db, 'quotes', id), { number, updatedAt: serverTimestamp(), updatedBy: me() })
    },
    async createRevision(prevId, rev) {
      const { db } = fb()
      const { body, number } = splitQuote(rev)
      await runTransaction(db, async (tx) => {
        const prevRef = doc(db, 'quotes', prevId)
        const prev = await tx.get(prevRef)
        if (!prev.exists()) throw new Error('La cotización no existe')
        if ((prev.data() as QuoteDoc).locked) throw new Error('Ya existe una revisión más nueva de esta cotización.')
        tx.set(doc(db, 'quotes', rev.id), {
          body,
          number,
          revisionOf: prevId,
          createdAt: serverTimestamp(),
          createdBy: me(),
          updatedAt: serverTimestamp(),
          updatedBy: me(),
        })
        tx.update(prevRef, { locked: true, supersededBy: rev.id, updatedAt: serverTimestamp(), updatedBy: me() })
      })
    },
    async remove(id) {
      const { db } = fb()
      const snap = await getDoc(doc(db, 'quotes', id))
      const d = snap.exists() ? (snap.data() as QuoteDoc) : null
      if (d?.locked) throw new Error('No se puede eliminar una versión anterior; elimina primero la revisión más nueva.')
      const batch = writeBatch(db)
      batch.delete(doc(db, 'quotes', id))
      // Si era una revisión, la versión anterior vuelve a ser editable
      if (d?.revisionOf)
        batch.update(doc(db, 'quotes', d.revisionOf), {
          locked: false,
          supersededBy: deleteField(),
          updatedAt: serverTimestamp(),
          updatedBy: me(),
        })
      void batch.commit()
    },
  },

  numbering: {
    async reserve(quoteId, year) {
      const { db } = fb()
      return runTransaction(db, async (tx) => {
        const quoteRef = doc(db, 'quotes', quoteId)
        const counterRef = doc(db, 'counters', String(year))
        const [qs, cs] = await Promise.all([tx.get(quoteRef), tx.get(counterRef)])
        if (!qs.exists()) throw new Error('La cotización todavía no está en la nube')
        const current = (qs.data() as QuoteDoc).number
        if (current.seq !== null) return current.seq
        const next = cs.exists() ? (cs.data().next as number) : 1
        tx.set(counterRef, { next: next + 1, updatedAt: serverTimestamp(), updatedBy: me() })
        tx.update(quoteRef, { number: { ...current, seq: next, year }, updatedAt: serverTimestamp(), updatedBy: me() })
        return next
      })
    },
    async getNext(year) {
      const s = await getDoc(doc(fb().db, 'counters', String(year)))
      return s.exists() ? (s.data().next as number) : 1
    },
    async setNext(year, next) {
      await setDoc(doc(fb().db, 'counters', String(year)), { next, updatedAt: serverTimestamp(), updatedBy: me() })
    },
  },

  library: {
    subscribe(cb) {
      return onSnapshot(collection(fb().db, 'library'), { includeMetadataChanges: true }, (snap) => {
        setPending('library', snap.docs.filter((d) => d.metadata.hasPendingWrites).length)
        const partial: Partial<Library> = {}
        snap.docs.forEach((d) => ((partial as Record<string, unknown>)[d.id] = d.data().items))
        cb(withDefaults(partial))
      })
    },
    async save(key, items) {
      void setDoc(doc(fb().db, 'library', key), { items, updatedAt: serverTimestamp(), updatedBy: me() })
    },
  },

  users: {
    subscribe(cb) {
      return onSnapshot(collection(fb().db, 'allowedUsers'), (snap) => cb(snap.docs.map((d) => d.data() as AllowedUser)))
    },
    async add(user, password) {
      const email = user.email.trim().toLowerCase()
      if (password) {
        // Se usa una segunda instancia para crear la cuenta sin cerrar la sesión actual
        const secondary = initializeApp(firebaseConfig!, `crear-usuario-${Date.now()}`)
        try {
          const auth2 = getAuth(secondary)
          if (useEmulators) connectAuthEmulator(auth2, 'http://127.0.0.1:9099', { disableWarnings: true })
          await createUserWithEmailAndPassword(auth2, email, password).catch((e) => {
            if ((e as { code?: string }).code !== 'auth/email-already-in-use') throw e
          })
          await signOut(auth2)
        } finally {
          await deleteApp(secondary)
        }
      }
      await setDoc(doc(fb().db, 'allowedUsers', email), {
        email,
        name: user.name ?? '',
        profileId: user.profileId ?? '',
        addedBy: me(),
        addedAt: serverTimestamp(),
      })
    },
    async remove(email) {
      await deleteDoc(doc(fb().db, 'allowedUsers', email.toLowerCase()))
    },
  },

  changelog: {
    async add(col, summary) {
      void addDoc(collection(fb().db, 'changelog'), { at: serverTimestamp(), by: me(), collection: col, summary })
    },
    subscribe(cb, max = 200) {
      const q = query(collection(fb().db, 'changelog'), orderBy('at', 'desc'), limit(max))
      return onSnapshot(q, (snap) =>
        cb(
          snap.docs.map((d) => {
            const x = d.data({ serverTimestamps: 'estimate' })
            return { id: d.id, at: iso(x.at), by: x.by, collection: x.collection, summary: x.summary } satisfies ChangeLogEntry
          }),
        ),
      )
    },
  },

  onPendingChange(cb) {
    pendingSubs.add(cb)
    cb([...pendingBySource.values()].reduce((a, b) => a + b, 0))
    return () => void pendingSubs.delete(cb)
  },
}
