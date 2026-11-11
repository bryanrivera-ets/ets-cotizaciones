import type { Quote, QuoteNumber } from './types.ts'

// ───────────────────────── Numeración (sección 7) ─────────────────────────

const ROMAN: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`Número romano inválido: ${n}`)
  let out = ''
  for (const [v, s] of ROMAN) {
    while (n >= v) {
      out += s
      n -= v
    }
  }
  return out
}

/** Etiqueta para cotizaciones sin número oficial todavía. */
export const DRAFT_LABEL = 'DRAFT'

/** "049-26", "049-26 REV I", "348-26 REV II (T&M)" */
export function formatQuoteNumber(n: QuoteNumber, isTm = false): string {
  const base = n.seq === null ? DRAFT_LABEL : `${String(n.seq).padStart(3, '0')}-${String(n.year % 100).padStart(2, '0')}`
  const rev = n.revision > 0 ? ` REV ${toRoman(n.revision)}` : ''
  return `${base}${rev}${isTm ? ' (T&M)' : ''}`
}

export const quoteNumberOf = (q: Quote): string => formatQuoteNumber(q.number, q.type === 'tm')

// ───────────────────────── Fechas ─────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "2026-06-01" → "June 1, 2026" (sin depender de la zona horaria). */
export function formatLongDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new RangeError(`Fecha inválida: ${iso}`)
  const month = MONTHS[Number(m[2]) - 1]
  if (!month) throw new RangeError(`Mes inválido: ${iso}`)
  return `${month} ${Number(m[3])}, ${m[1]}`
}

/** Fecha local de hoy en formato ISO. */
export function todayIso(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ───────────────────────── Nombre del PDF ─────────────────────────

/** Quita caracteres no válidos en nombres de archivo (Windows/macOS/iPadOS). */
export function sanitizeFileName(name: string): string {
  return name
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/, '')
    .trim()
}

/** "{Quote No.} - {PROJECT/AREA} - {CONTRACTOR}.pdf" (editable por el usuario). */
export function defaultPdfFileName(q: Quote): string {
  const parts = [quoteNumberOf(q), q.header.projectArea.toUpperCase(), q.header.contractor]
    .map((s) => sanitizeFileName(s))
    .filter(Boolean)
  return `${parts.join(' - ')}.pdf`
}

export function pdfFileNameOf(q: Quote): string {
  const custom = q.pdfFileName?.trim()
  if (!custom) return defaultPdfFileName(q)
  const clean = sanitizeFileName(custom.replace(/\.pdf$/i, ''))
  return `${clean || sanitizeFileName(quoteNumberOf(q))}.pdf`
}
