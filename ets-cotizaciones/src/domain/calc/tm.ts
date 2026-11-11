import { sumCents, type Cents } from '../money.ts'
import {
  add,
  div,
  isNegative,
  mul,
  mulRound,
  ONE,
  parseDecimal,
  percent,
  ratio,
  sub,
  toNumber,
  ZERO,
  type Ratio,
} from '../ratio.ts'
import type { LaborPosition, MaterialLine, ScheduleRow, TmArea, TmQuote } from '../types.ts'
import { b2b } from './lumpSum.ts'

// ───────────────────────── Horas del calendario ─────────────────────────

export interface ScheduleHours {
  supervisor: number
  labor: number
  pm: number
}

/** Regla 6.3: horas de Supervisor y Labor = suma del calendario; PM = sus filas. */
export function scheduleHours(schedule: readonly ScheduleRow[]): ScheduleHours {
  const h: ScheduleHours = { supervisor: 0, labor: 0, pm: 0 }
  for (const row of schedule) {
    if (row.kind === 'crew') {
      h.supervisor += row.supervisorHours
      h.labor += row.laborHours
    } else {
      h.pm += row.hours
    }
  }
  return h
}

export function positionHours(p: LaborPosition, hours: ScheduleHours): number {
  return p.hoursSource === 'manual' ? (p.manualHours ?? 0) : hours[p.hoursSource]
}

// ───────────────────────── Labor ─────────────────────────

export interface LaborRow {
  hours: number
  amountCents: Cents
}

export interface LaborResult {
  rows: LaborRow[]
  totalQty: number
  totalHours: number
  totalCents: Cents
}

export function computeLabor(positions: readonly LaborPosition[], schedule: readonly ScheduleRow[]): LaborResult {
  const sched = scheduleHours(schedule)
  const rows = positions.map((p) => {
    const hours = positionHours(p, sched)
    return { hours, amountCents: mulRound(p.rateCents, parseDecimal(hours)) }
  })
  return {
    rows,
    totalQty: positions.reduce((a, p) => a + p.qty, 0),
    totalHours: rows.reduce((a, r) => a + r.hours, 0),
    totalCents: sumCents(rows.map((r) => r.amountCents)),
  }
}

// ───────────────────────── Materiales ─────────────────────────

/** AMOUNT = QTY × UNIT PRICE, redondeado al centavo. */
export const materialAmount = (m: MaterialLine): Cents => mulRound(m.unitPriceCents, parseDecimal(m.qty || '0'))

export function computeMaterials(lines: readonly MaterialLine[]): { amounts: Cents[]; totalCents: Cents } {
  const amounts = lines.map(materialAmount)
  return { amounts, totalCents: sumCents(amounts) }
}

// ───────────────────────── Distribución por área ─────────────────────────

export interface AreaRow {
  /** Proporción exacta usada (la última área recibe el resto) */
  share: Ratio
  /** Porcentaje para mostrar (ej. 58.98) */
  percent: number
  materialCents: Cents
  laborCents: Cents
  totalCents: Cents
}

export interface AreaResult {
  rows: AreaRow[]
  warnings: string[]
}

/** Peso de un área para el porcentaje automático: sf + lf (pueden venir uno o ambos). */
export const areaWeight = (a: TmArea): number => (a.sf ?? 0) + (a.lf ?? 0)

/** "210 sf", "45 sf / 2 lf", "12 lf" */
export function areaQtyLabel(a: TmArea): string {
  if (a.qtyLabel?.trim()) return a.qtyLabel
  const fmt = (n: number) => n.toLocaleString('en-US')
  const parts: string[] = []
  if (a.sf) parts.push(`${fmt(a.sf)} sf`)
  if (a.lf) parts.push(`${fmt(a.lf)} lf`)
  return parts.join(' / ')
}

/**
 * Regla 6.4:
 * - Cada área tiene una proporción: fija (porcentaje o total deseado / subtotal) o automática.
 * - Las automáticas se reparten lo que queda (100 % − fijas) según sf + lf.
 * - Material y Labor del área = total × proporción, redondeado al dólar.
 * - La última área recibe el resto, para que todo sume exacto.
 */
export function allocateAreas(areas: readonly TmArea[], materialCents: Cents, laborCents: Cents): AreaResult {
  const warnings: string[] = []
  if (areas.length === 0) return { rows: [], warnings }
  const subtotal = materialCents + laborCents

  const fixed: (Ratio | null)[] = areas.map((a) => {
    const al = a.allocation
    if (al.mode === 'percent') return percent(al.percent)
    if (al.mode === 'total') return subtotal === 0 ? ZERO : ratio(al.totalCents, subtotal)
    return null
  })

  const fixedSum = fixed.reduce<Ratio>((acc, r) => (r ? add(acc, r) : acc), ZERO)
  let remaining = sub(ONE, fixedSum)
  if (isNegative(remaining)) {
    warnings.push('Los porcentajes de las áreas suman más de 100 %.')
    remaining = ZERO
  }

  const autoIdx = areas.map((_, i) => i).filter((i) => fixed[i] === null)
  const autoWeight = autoIdx.reduce((acc, i) => acc + areaWeight(areas[i]), 0)
  const shares: Ratio[] = areas.map((a, i) => {
    const f = fixed[i]
    if (f) return f
    if (autoWeight > 0) return mul(remaining, div(parseDecimal(areaWeight(a)), parseDecimal(autoWeight)))
    return div(remaining, ratio(autoIdx.length))
  })

  const rows: AreaRow[] = []
  let matLeft = materialCents
  let labLeft = laborCents
  let shareLeft = ONE
  areas.forEach((_, i) => {
    const last = i === areas.length - 1
    const share = last ? shareLeft : shares[i]
    const m = last ? matLeft : mulRound(materialCents, share, 100)
    const l = last ? labLeft : mulRound(laborCents, share, 100)
    matLeft -= m
    labLeft -= l
    shareLeft = sub(shareLeft, share)
    rows.push({ share, percent: toNumber(share) * 100, materialCents: m, laborCents: l, totalCents: m + l })
  })

  const lastRow = rows[rows.length - 1]
  if (lastRow.materialCents < 0 || lastRow.laborCents < 0) {
    warnings.push('La última área quedó con un monto negativo; revisa los porcentajes.')
  }
  return { rows, warnings }
}

// ───────────────────────── Resumen T&M ─────────────────────────

export interface TmResult {
  hours: ScheduleHours
  labor: LaborResult
  materials: { amounts: Cents[]; totalCents: Cents }
  areas: AreaResult
  subtotalCents: Cents
  /** 4 % de la labor; en T&M SÍ se suma al total. */
  b2bCents: Cents
  totalCents: Cents
}

export function computeTm(quote: Pick<TmQuote, 'labor' | 'schedule' | 'materials' | 'areas'>): TmResult {
  const labor = computeLabor(quote.labor, quote.schedule)
  const materials = computeMaterials(quote.materials)
  const subtotalCents = labor.totalCents + materials.totalCents
  const b2bCents = b2b(labor.totalCents)
  return {
    hours: scheduleHours(quote.schedule),
    labor,
    materials,
    areas: allocateAreas(quote.areas, materials.totalCents, labor.totalCents),
    subtotalCents,
    b2bCents,
    totalCents: subtotalCents + b2bCents,
  }
}
