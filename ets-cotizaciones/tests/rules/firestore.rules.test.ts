/**
 * Pruebas de las reglas de seguridad de Firestore (firestore.rules) con el emulador.
 * Uso: npm run test:rules
 */
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, runTransaction, setDoc, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest'

let env: RulesTestEnvironment

const ALLOWED = 'dmr@etspr.com'
const OTHER_ALLOWED = 'csn@etspr.com'
const STRANGER = 'extrano@gmail.com'

const as = (email: string) => env.authenticatedContext(email.replace(/\W/g, ''), { email }).firestore()
const anon = () => env.unauthenticatedContext().firestore()

const quote = (id: string, by = ALLOWED) => ({ body: { id, type: 'lumpSum' }, number: { seq: null, year: 2026, revision: 0 }, updatedBy: by })

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-ets-rules',
    firestore: { rules: readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

afterAll(async () => {
  await env?.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'allowedUsers', ALLOWED), { email: ALLOWED })
    await setDoc(doc(db, 'allowedUsers', OTHER_ALLOWED), { email: OTHER_ALLOWED })
    await setDoc(doc(db, 'quotes', 'q1'), quote('q1'))
    await setDoc(doc(db, 'counters', '2026'), { next: 453 })
    await setDoc(doc(db, 'library', 'systems'), { items: [] })
  })
})

describe('sin sesión', () => {
  it('no puede leer ni escribir nada', async () => {
    await assertFails(getDoc(doc(anon(), 'quotes', 'q1')))
    await assertFails(getDocs(collection(anon(), 'quotes')))
    await assertFails(setDoc(doc(anon(), 'quotes', 'x'), quote('x')))
    await assertFails(getDoc(doc(anon(), 'library', 'systems')))
    await assertFails(getDoc(doc(anon(), 'allowedUsers', ALLOWED)))
  })
})

describe('con sesión pero NO autorizado', () => {
  it('no puede leer ni escribir cotizaciones, biblioteca ni contadores', async () => {
    const db = as(STRANGER)
    await assertFails(getDoc(doc(db, 'quotes', 'q1')))
    await assertFails(getDocs(collection(db, 'quotes')))
    await assertFails(setDoc(doc(db, 'quotes', 'x'), quote('x', STRANGER)))
    await assertFails(getDoc(doc(db, 'library', 'systems')))
    await assertFails(setDoc(doc(db, 'library', 'systems'), { items: [] }))
    await assertFails(setDoc(doc(db, 'counters', '2026'), { next: 1 }))
    await assertFails(getDocs(collection(db, 'changelog')))
  })

  it('no puede autorizarse a sí mismo', async () => {
    await assertFails(setDoc(doc(as(STRANGER), 'allowedUsers', STRANGER), { email: STRANGER }))
  })

  it('sí puede consultar su propio estado (para mostrar "Sin autorización")', async () => {
    const snap = await assertSucceeds(getDoc(doc(as(STRANGER), 'allowedUsers', STRANGER)))
    expect(snap.exists()).toBe(false)
    await assertFails(getDoc(doc(as(STRANGER), 'allowedUsers', ALLOWED)))
  })
})

describe('usuario autorizado', () => {
  it('lee y escribe cotizaciones', async () => {
    const db = as(ALLOWED)
    await assertSucceeds(getDocs(collection(db, 'quotes')))
    await assertSucceeds(setDoc(doc(db, 'quotes', 'q2'), quote('q2')))
    await assertSucceeds(updateDoc(doc(db, 'quotes', 'q2'), { body: { id: 'q2', type: 'tm' }, updatedBy: ALLOWED }))
    await assertSucceeds(deleteDoc(doc(db, 'quotes', 'q2')))
  })

  it('el email con mayúsculas también funciona', async () => {
    await assertSucceeds(getDoc(doc(as('DMR@ETSPR.com'), 'quotes', 'q1')))
  })

  it('no puede firmar cambios a nombre de otro ni guardar una cotización con id distinto', async () => {
    const db = as(ALLOWED)
    await assertFails(setDoc(doc(db, 'quotes', 'q3'), quote('q3', OTHER_ALLOWED)))
    await assertFails(setDoc(doc(db, 'quotes', 'q3'), quote('otro-id')))
  })

  it('biblioteca: solo colecciones conocidas y con lista de items', async () => {
    const db = as(ALLOWED)
    await assertSucceeds(setDoc(doc(db, 'library', 'terms'), { items: [] }))
    await assertFails(setDoc(doc(db, 'library', 'cualquiera'), { items: [] }))
    await assertFails(setDoc(doc(db, 'library', 'systems'), { items: 'no es lista' }))
  })

  it('contador: número entero positivo', async () => {
    const db = as(ALLOWED)
    await assertSucceeds(setDoc(doc(db, 'counters', '2026'), { next: 500 }))
    await assertFails(setDoc(doc(db, 'counters', '2026'), { next: 0 }))
    await assertFails(setDoc(doc(db, 'counters', '2026'), { next: 'cinco' }))
  })

  it('administra usuarios pero no puede quitarse a sí mismo', async () => {
    const db = as(ALLOWED)
    await assertSucceeds(setDoc(doc(db, 'allowedUsers', 'nuevo@etspr.com'), { email: 'nuevo@etspr.com' }))
    await assertFails(setDoc(doc(db, 'allowedUsers', 'Mayus@etspr.com'), { email: 'Mayus@etspr.com' }))
    await assertSucceeds(deleteDoc(doc(db, 'allowedUsers', OTHER_ALLOWED)))
    await assertFails(deleteDoc(doc(db, 'allowedUsers', ALLOWED)))
  })

  it('registro de cambios: se agrega a su nombre y no se puede editar ni borrar', async () => {
    const db = as(ALLOWED)
    const ref = await assertSucceeds(addDoc(collection(db, 'changelog'), { by: ALLOWED, collection: 'systems', summary: 'x' }))
    await assertFails(addDoc(collection(db, 'changelog'), { by: OTHER_ALLOWED, collection: 'systems', summary: 'x' }))
    await assertFails(updateDoc(ref, { summary: 'cambiado' }))
    await assertFails(deleteDoc(ref))
  })

  it('al perder la autorización pierde el acceso', async () => {
    await env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), 'allowedUsers', OTHER_ALLOWED)))
    await assertFails(getDoc(doc(as(OTHER_ALLOWED), 'quotes', 'q1')))
  })
})

describe('numeración con transacciones', () => {
  it('dos usuarios reservando al mismo tiempo nunca reciben el mismo número', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      for (let i = 0; i < 6; i++) await setDoc(doc(ctx.firestore(), 'quotes', `n${i}`), quote(`n${i}`))
    })
    const reserve = (email: string, id: string) => {
      const db = as(email)
      return runTransaction(db, async (tx) => {
        const qRef = doc(db, 'quotes', id)
        const cRef = doc(db, 'counters', '2026')
        const [qs, cs] = await Promise.all([tx.get(qRef), tx.get(cRef)])
        const cur = qs.data()!.number
        if (cur.seq !== null) return cur.seq as number
        const next = cs.exists() ? (cs.data().next as number) : 1
        tx.set(cRef, { next: next + 1 })
        tx.update(qRef, { number: { ...cur, seq: next }, updatedBy: email })
        return next
      })
    }
    const results = await Promise.all([0, 1, 2, 3, 4, 5].map((i) => reserve(i % 2 ? ALLOWED : OTHER_ALLOWED, `n${i}`)))
    expect(new Set(results).size).toBe(6)
    expect([...results].sort((a, b) => a - b)).toEqual([453, 454, 455, 456, 457, 458])
    // Reservar otra vez la misma cotización no gasta otro número
    expect(await reserve(ALLOWED, 'n0')).toBe(results[0])
  })
})
