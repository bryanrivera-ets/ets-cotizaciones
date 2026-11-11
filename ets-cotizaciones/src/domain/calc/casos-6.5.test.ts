/**
 * Casos de prueba obligatorios de la sección 6.5 de ESPECIFICACION.md.
 * Cada caso usa los datos reales de referencia/ejemplos/ (src/domain/fixtures/examples.ts).
 */
import { dollars } from '../money.ts'
import { Q049, Q223, Q303, Q348, Q387, Q452 } from '../fixtures/examples.ts'
import { computeLumpSum, splitTotal } from './lumpSum.ts'
import { computePremiumTime } from './premiumTime.ts'
import { computeLabor, computeMaterials, computeTm, scheduleHours } from './tm.ts'

const $ = dollars

describe('6.5 Lump Sum', () => {
  it('049-26: Total 43,631 → Material 26,179 · Labor 17,452 · B2B 698.08', () => {
    const r = computeLumpSum(Q049)
    expect(r.sections[0].groups[0]).toEqual({ materialCents: $(26179), laborCents: $(17452), totalCents: $(43631) })
    expect(r.sections[0].b2bCents).toBe($(698.08))
  })

  it('303-26: Total 25,500 → Material 15,300 · Labor 10,200 · B2B 408.00', () => {
    const r = computeLumpSum(Q303)
    expect(r.sections[0].groups[0]).toEqual({ materialCents: $(15300), laborCents: $(10200), totalCents: $(25500) })
    expect(r.sections[0].b2bCents).toBe($(408))
  })

  it('387-26 sección 1: Total 6,912 → Material 4,147 · Labor 2,765 · B2B 110.60', () => {
    const s = computeLumpSum(Q387).sections[0]
    expect(s.groups[0]).toEqual({ materialCents: $(4147), laborCents: $(2765), totalCents: $(6912) })
    expect(s.b2bCents).toBe($(110.6))
  })

  it('387-26 sección 2: Total 3,978 → Material 2,387 · Labor 1,591 · B2B 63.64', () => {
    const s = computeLumpSum(Q387).sections[1]
    expect(s.groups[0]).toEqual({ materialCents: $(2387), laborCents: $(1591), totalCents: $(3978) })
    expect(s.b2bCents).toBe($(63.64))
  })

  it('223-26: grupos 20,793 y 39,202 → 12,476/8,317 y 23,521/15,681 · B2B 959.92', () => {
    const s = computeLumpSum(Q223).sections[0]
    expect(s.groups[0]).toEqual({ materialCents: $(12476), laborCents: $(8317), totalCents: $(20793) })
    expect(s.groups[1]).toEqual({ materialCents: $(23521), laborCents: $(15681), totalCents: $(39202) })
    expect(s.b2bCents).toBe($(959.92))
  })

  it('B2B no se suma al total en Lump Sum', () => {
    expect(computeLumpSum(Q223).totalCents).toBe($(59995))
  })
})

describe('6.5 T&M (348-26)', () => {
  it('calendario: Supervisor 24 h · Labor 68 h · PM 5 h · Total 97 h', () => {
    expect(scheduleHours(Q348.schedule)).toEqual({ supervisor: 24, labor: 68, pm: 5 })
    expect(computeLabor(Q348.labor, Q348.schedule).totalHours).toBe(97)
  })

  it('labor: PM 5×90 · Sup 24×60 · Labor 68×40 → 450 · 1,440 · 2,720 · Total 4,610', () => {
    const l = computeLabor(Q348.labor, Q348.schedule)
    expect(l.rows.map((r) => r.amountCents)).toEqual([$(450), $(1440), $(2720)])
    expect(l.totalCents).toBe($(4610))
    expect(l.totalQty).toBe(6)
  })

  it('materiales: las 10 líneas → Total 6,915.00', () => {
    const m = computeMaterials(Q348.materials)
    expect(m.amounts).toEqual([1100, 2100, 1220, 980, 144, 108, 195, 78, 595, 395].map((d) => $(d)))
    expect(m.totalCents).toBe($(6915))
  })

  it('resumen: Subtotal 11,525.00 · B2B 184.40 · Total 11,709.40', () => {
    const r = computeTm(Q348)
    expect(r.subtotalCents).toBe($(11525))
    expect(r.b2bCents).toBe($(184.4))
    expect(r.totalCents).toBe($(11709.4))
  })

  it('áreas: Room 4137 con total 6,798 → 4,079 / 2,719 · Corridor 547 → 2,836 / 1,891 / 4,727', () => {
    const { rows, warnings } = computeTm(Q348).areas
    expect(warnings).toEqual([])
    expect(rows[0]).toMatchObject({ materialCents: $(4079), laborCents: $(2719), totalCents: $(6798) })
    expect(rows[1]).toMatchObject({ materialCents: $(2836), laborCents: $(1891), totalCents: $(4727) })
    expect(rows[0].percent).toBeCloseTo(58.985, 3)
  })
})

describe('Premium Time (452-26)', () => {
  it('Total $2,875.00', () => {
    expect(computePremiumTime(Q452).totalCents).toBe($(2875))
  })
})

describe('splitTotal', () => {
  it('redondea 0.5 hacia arriba al dólar', () => {
    // 60 % de 1,001 = 600.60 → 601 ; 60 % de 1,000.75 = 600.45 → 600
    expect(splitTotal($(1001)).materialCents).toBe($(601))
    expect(splitTotal($(1000.75)).materialCents).toBe($(600))
    // caso exacto de .5: 60 % de 2.50 = 1.50 → 2
    expect(splitTotal($(2.5)).materialCents).toBe($(2))
  })

  it('acepta un porcentaje distinto y decimales', () => {
    expect(splitTotal($(10000), '55')).toEqual({ materialCents: $(5500), laborCents: $(4500), totalCents: $(10000) })
    expect(splitTotal($(10000), '58.5').materialCents).toBe($(5850))
  })

  it('Material + Labor siempre suman el total', () => {
    for (const total of [1, 99, 12345, 4363100, 999999]) {
      const s = splitTotal(total)
      expect(s.materialCents + s.laborCents).toBe(total)
    }
  })
})
