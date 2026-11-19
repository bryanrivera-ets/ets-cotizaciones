/**
 * Libreta de clientes (contractors) para llenar rápido las cotizaciones,
 * e importación desde Excel (ej. la lista exportada de QuickBooks).
 */
import { newId } from './factories.ts'
import { normalize } from './management.ts'

export interface ClientContact {
  id: string
  name: string
  title?: string
  email?: string
  phone?: string
}

export interface Client {
  id: string
  /** Nombre que va en "Contractor" */
  name: string
  /** Nombre en QuickBooks si es distinto (columna Customer) */
  customerName?: string
  contacts: ClientContact[]
  phone?: string
  address?: string
  /** Términos de pago (Net 30, COD…) – solo referencia */
  terms?: string
  notes?: string
}

/** Clave para comparar nombres: sin acentos, mayúsculas, puntuación ni sufijos de compañía. */
export function clientKey(name: string): string {
  return normalize(name)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(inc|llc|corp|corporation|co|ltd|psc|lp|the)\b/g, ' ')
    .replace(/\s+/g, '')
}

export function findClient(clients: Client[], name: string): Client | undefined {
  const k = clientKey(name)
  return k ? clients.find((c) => clientKey(c.name) === k || (c.customerName && clientKey(c.customerName) === k)) : undefined
}

export function findContact(client: Client | undefined, name: string): ClientContact | undefined {
  const n = normalize(name).trim()
  return n ? client?.contacts.find((c) => normalize(c.name).trim() === n) : undefined
}

// ───────────────────────── Importar desde Excel ─────────────────────────

type Field = 'name' | 'customer' | 'contact' | 'title' | 'email' | 'phone' | 'altPhone' | 'address' | 'shipTo' | 'terms' | 'notes'

/** Títulos de columna reconocidos (inglés de QuickBooks y español). */
const HEADERS: Record<Field, string[]> = {
  name: ['company', 'compania', 'empresa', 'contractor', 'contratista', 'cliente', 'client', 'customer name', 'company name'],
  customer: ['customer', 'nombre quickbooks'],
  contact: ['contact', 'contacto', 'contact name', 'persona de contacto', 'primary contact'],
  title: ['contact title', 'title', 'titulo', 'puesto', 'cargo'],
  email: ['main email', 'email', 'e mail', 'correo', 'correo electronico'],
  phone: ['main phone', 'phone', 'telefono', 'tel'],
  altPhone: ['alt phone', 'alt. phone', 'mobile', 'celular', 'cell'],
  address: ['bill to', 'billing address', 'direccion', 'address'],
  shipTo: ['ship to'],
  terms: ['terms', 'payment terms', 'terminos'],
  notes: ['notes', 'notas', 'nota'],
}

const cleanHeader = (h: unknown) => normalize(String(h ?? '')).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

/** Busca la fila de títulos (entre las primeras 10) y qué columna corresponde a cada dato. */
export function detectColumns(rows: unknown[][]): { headerRow: number; cols: Partial<Record<Field, number>> } | null {
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const cells = (rows[r] ?? []).map(cleanHeader)
    const cols: Partial<Record<Field, number>> = {}
    for (const field of Object.keys(HEADERS) as Field[]) {
      const aliases = HEADERS[field].map(cleanHeader)
      const i = cells.findIndex((c, idx) => aliases.includes(c) && !Object.values(cols).includes(idx))
      if (i >= 0) cols[field] = i
    }
    if (cols.name !== undefined || cols.customer !== undefined) return { headerRow: r, cols }
  }
  return null
}

const cell = (row: unknown[], i: number | undefined) => {
  if (i === undefined) return ''
  const v = row[i]
  if (v === null || v === undefined) return ''
  return String(v).replace(/\s+/g, ' ').trim()
}

export interface ImportResult {
  clients: Client[]
  /** Filas sin nombre de compañía */
  skipped: number
  /** Filas que se juntaron con otra del mismo cliente */
  merged: number
}

/** Convierte las filas de una hoja en clientes (junta las filas del mismo cliente). */
export function clientsFromRows(rows: unknown[][]): ImportResult {
  const det = detectColumns(rows)
  if (!det) throw new Error('No encontré la columna con el nombre de la compañía (Company / Customer / Cliente).')
  const { headerRow, cols } = det
  const byKey = new Map<string, Client>()
  let skipped = 0
  let merged = 0
  for (const row of rows.slice(headerRow + 1)) {
    const company = cell(row, cols.name)
    const customer = cell(row, cols.customer)
    const name = company || customer
    if (!name) {
      if (row.some((v) => v !== null && v !== undefined && String(v).trim() !== '')) skipped++
      continue
    }
    const email = cell(row, cols.email)
      .split(/[;,]/)
      .map((e) => e.trim())
      .filter(Boolean)
      .join(', ')
    const phone = cell(row, cols.phone) || cell(row, cols.altPhone)
    const contactName = cell(row, cols.contact)
    const key = clientKey(name)
    let c = byKey.get(key)
    if (c) merged++
    else {
      c = { id: newId(), name, contacts: [] }
      byKey.set(key, c)
    }
    if (customer && company && clientKey(customer) !== clientKey(company)) c.customerName ||= customer
    c.phone ||= phone || undefined
    c.address ||= cell(row, cols.address) || cell(row, cols.shipTo) || undefined
    c.terms ||= cell(row, cols.terms) || undefined
    const note = cell(row, cols.notes)
    if (note) c.notes = c.notes ? `${c.notes}\n${note}` : note
    if (contactName || email) {
      const existing = findContact(c, contactName || email)
      if (!existing)
        c.contacts.push({
          id: newId(),
          name: contactName,
          title: cell(row, cols.title) || undefined,
          email: email || undefined,
          phone: phone || undefined,
        })
    }
  }
  return { clients: [...byKey.values()], skipped, merged }
}

export interface MergeResult {
  clients: Client[]
  added: number
  updated: number
  unchanged: number
}

/**
 * Junta lo importado con la libreta actual: agrega clientes nuevos, completa datos vacíos
 * y agrega contactos nuevos. Nunca borra ni pisa lo que ya se editó en la app.
 */
export function mergeClients(current: Client[], imported: Client[]): MergeResult {
  const out = structuredClone(current)
  let added = 0
  let updated = 0
  let unchanged = 0
  for (const imp of imported) {
    const ex = findClient(out, imp.name) ?? (imp.customerName ? findClient(out, imp.customerName) : undefined)
    if (!ex) {
      out.push(imp)
      added++
      continue
    }
    const before = JSON.stringify(ex)
    ex.customerName ||= imp.customerName
    ex.phone ||= imp.phone
    ex.address ||= imp.address
    ex.terms ||= imp.terms
    ex.notes ||= imp.notes
    for (const ct of imp.contacts) {
      const same = findContact(ex, ct.name) ?? (ct.email ? ex.contacts.find((x) => x.email && normalize(x.email) === normalize(ct.email!)) : undefined)
      if (!same) ex.contacts.push(ct)
      else {
        same.email ||= ct.email
        same.phone ||= ct.phone
        same.title ||= ct.title
      }
    }
    if (JSON.stringify(ex) === before) unchanged++
    else updated++
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
  return { clients: out, added, updated, unchanged }
}
