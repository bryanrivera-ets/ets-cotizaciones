/**
 * Gestión de cotizaciones: duplicar, revisiones, búsqueda y textos para el email.
 * Funciones puras (sin Firebase) para poder probarlas.
 */
import { newId } from './factories.ts'
import { formatLongDate, quoteNumberOf, todayIso } from './format.ts'
import type { Quote, QuoteStatus, QuoteType } from './types.ts'

/** Ids nuevos en todas las filas (para que la copia no comparta nada con el original). */
function reId(q: Quote): Quote {
  const c = structuredClone(q)
  if (c.type === 'lumpSum')
    for (const s of c.sections) {
      s.id = newId()
      for (const it of s.scope) it.id = newId()
      for (const g of s.groups) {
        g.id = newId()
        for (const it of g.items) it.id = newId()
      }
    }
  else if (c.type === 'premiumTime') for (const it of c.items) it.id = newId()
  else {
    for (const list of [c.scope, c.labor, c.schedule, c.materials, c.areas]) for (const it of list) it.id = newId()
  }
  return c
}

/**
 * Duplicar: cotización nueva (recibirá el próximo número) con la fecha de hoy,
 * en Borrador, copiando todo lo demás.
 */
export function duplicateQuote(q: Quote, today = todayIso()): Quote {
  const c = reId(q)
  c.id = newId()
  c.tempId = `TMP-${Date.now().toString(36).toUpperCase()}`
  c.number = { seq: null, year: Number(today.slice(0, 4)), revision: 0 }
  c.header.date = today
  c.status = 'draft'
  c.pdfFileName = undefined
  return c
}

/**
 * Crear revisión: mismo número con la revisión siguiente (REV I, REV II…),
 * fecha de hoy y en Borrador. La versión anterior queda guardada sin cambios.
 */
export function newRevision(q: Quote, today = todayIso()): Quote {
  if (q.number.seq === null) throw new Error('La cotización necesita su número oficial antes de crear una revisión.')
  const c = reId(q)
  c.id = newId()
  c.tempId = undefined
  c.number = { ...q.number, revision: q.number.revision + 1 }
  c.header.date = today
  c.status = 'draft'
  c.pdfFileName = undefined
  return c
}

// ───────────────────────── Búsqueda ─────────────────────────

export interface QuoteFilters {
  text: string
  status: QuoteStatus | ''
  type: QuoteType | ''
  /** Iniciales de quien la preparó */
  preparedBy: string
  /** Fechas ISO (inclusive) */
  from: string
  to: string
  /** Incluir versiones anteriores (revisiones reemplazadas) */
  includeOld: boolean
}

export const EMPTY_FILTERS: QuoteFilters = { text: '', status: '', type: '', preparedBy: '', from: '', to: '', includeOld: false }

/** Quita acentos y pasa a minúsculas para comparar ("José" = "jose"). */
export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Texto donde se busca: número, contractor, proyecto, contacto, location, fecha y quien la preparó. */
export function searchText(q: Quote): string {
  const h = q.header
  return normalize(
    [
      quoteNumberOf(q),
      q.tempId ?? '',
      h.contractor,
      h.projectArea,
      h.contact,
      h.contactEmail ?? '',
      h.location,
      h.date,
      formatLongDate(h.date),
      q.preparedBy.name,
      q.preparedBy.initials,
    ].join(' | '),
  )
}

export function matchesFilters(q: Quote, f: QuoteFilters, locked = false): boolean {
  if (locked && !f.includeOld) return false
  if (f.status && q.status !== f.status) return false
  if (f.type && q.type !== f.type) return false
  if (f.preparedBy && q.preparedBy.initials !== f.preparedBy) return false
  if (f.from && q.header.date < f.from) return false
  if (f.to && q.header.date > f.to) return false
  const words = normalize(f.text).split(/\s+/).filter(Boolean)
  if (words.length) {
    const hay = searchText(q)
    if (!words.every((w) => hay.includes(w))) return false
  }
  return true
}

/** Orden por número: primero las que no tienen número, luego año, secuencia y revisión (más nuevas arriba). */
export function compareByNumber(a: Quote, b: Quote): number {
  if (a.number.seq === null || b.number.seq === null) return a.number.seq === null ? (b.number.seq === null ? 0 : -1) : 1
  return b.number.year - a.number.year || b.number.seq - a.number.seq || b.number.revision - a.number.revision
}

// ───────────────────────── Email ─────────────────────────

/** "KENVUE BLENDER NO.1 REPLACEMENT" → "Kenvue Blender No.1 Replacement" */
export function titleCase(s: string): string {
  const keepUpper = new Set(['ETS', 'PR', 'JLL', 'AML1', 'PAD', 'T&M', 'HVAC', 'FMT', 'II', 'III', 'IV', 'USA'])
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((w) => {
      if (keepUpper.has(w.toUpperCase())) return w.toUpperCase()
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join('')
}

export function emailSubject(q: Quote): string {
  const project = titleCase(q.header.projectArea.trim())
  return `Proposal ${quoteNumberOf(q)}${project ? ` – ${project}` : ''}`
}

export function emailBody(q: Quote): string {
  const contact = q.header.contact.trim()
  const project = titleCase(q.header.projectArea.trim())
  return [
    contact ? `Dear ${contact},` : 'Good day,',
    '',
    `Attached please find our proposal ${quoteNumberOf(q)}${project ? ` for ${project}` : ''}.`,
    '',
    'Please do not hesitate to contact us if you have any questions.',
    '',
    'Best regards,',
    '',
    q.preparedBy.name,
    'ETS Corp. – Epoxy Technologies Systems',
    'Tel. 787.747.1690',
  ].join('\n')
}

export function mailtoUrl(to: string, subject: string, body: string): string {
  const to2 = to
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map((e) => encodeURIComponent(e).replace(/%40/g, '@'))
    .join(',')
  return `mailto:${to2}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
