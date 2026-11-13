import { describe, expect, it } from 'vitest'
import { dollars as $ } from '../money.ts'
import type { TmArea } from '../types.ts'
import { allocateAreas, areaQtyLabel, computeLabor, materialAmount } from './tm.ts'

const area = (id: string, extra: Partial<TmArea> = {}): TmArea => ({
  id,
  name: id,
  allocation: { mode: 'auto' },
  ...extra,
})

describe('allocateAreas', () => {
  it('reparte automáticamente por sf', () => {
    const { rows } = allocateAreas([area('a', { sf: 300 }), area('b', { sf: 100 })], $(1000), $(600))
    expect(rows[0]).toMatchObject({ materialCents: $(750), laborCents: $(450) })
    expect(rows[1]).toMatchObject({ materialCents: $(250), laborCents: $(150) })
    expect(rows[0].percent).toBe(75)
  })

  it('usa sf + lf cuando el área tiene ambos, o solo lf', () => {
    const { rows } = allocateAreas([area('a', { sf: 45, lf: 5 }), area('b', { lf: 50 })], $(1000), $(1000))
    expect(rows[0].percent).toBe(50)
    expect(rows[0].materialCents).toBe($(500))
  })

  it('la última área recibe el resto y todo suma exacto', () => {
    const areas = [area('a', { sf: 1 }), area('b', { sf: 1 }), area('c', { sf: 1 })]
    const { rows } = allocateAreas(areas, $(1000), $(500.55))
    expect(rows.map((r) => r.materialCents)).toEqual([$(333), $(333), $(334)])
    expect(rows.map((r) => r.laborCents)).toEqual([$(167), $(167), $(166.55)])
    expect(rows.reduce((a, r) => a + r.totalCents, 0)).toBe($(1500.55))
  })

  it('porcentaje fijo y las áreas automáticas se reparten el resto', () => {
    const { rows } = allocateAreas(
      [area('a', { sf: 10, allocation: { mode: 'percent', percent: '40' } }), area('b', { sf: 30 }), area('c', { sf: 10 })],
      $(1000),
      $(1000),
    )
    // b = 60 % × 30/40 = 45 %
    expect(rows.map((r) => Math.round(r.percent * 100) / 100)).toEqual([40, 45, 15])
    expect(rows.map((r) => r.materialCents)).toEqual([$(400), $(450), $(150)])
  })

  it('avisa si los porcentajes pasan de 100 %', () => {
    const { warnings } = allocateAreas(
      [area('a', { allocation: { mode: 'percent', percent: '80' } }), area('b', { allocation: { mode: 'percent', percent: '30' } })],
      $(100),
      $(100),
    )
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('sin sf ni lf reparte por partes iguales', () => {
    const { rows } = allocateAreas([area('a'), area('b')], $(100), $(100))
    expect(rows[0].materialCents).toBe($(50))
  })

  it('una sola área recibe todo', () => {
    const { rows } = allocateAreas([area('a', { sf: 5 })], $(123.45), $(10))
    expect(rows[0]).toMatchObject({ materialCents: $(123.45), laborCents: $(10), percent: 100 })
  })
})

describe('areaQtyLabel', () => {
  it('genera la etiqueta desde sf / lf', () => {
    expect(areaQtyLabel(area('a', { sf: 210 }))).toBe('210 sf')
    expect(areaQtyLabel(area('a', { sf: 45, lf: 2 }))).toBe('45 sf / 2 lf')
    expect(areaQtyLabel(area('a', { sf: 1500, lf: 2, qtyLabel: 'custom' }))).toBe('custom')
  })
})

describe('labor y materiales', () => {
  it('posición con horas manuales y decimales', () => {
    const r = computeLabor(
      [{ id: 'x', name: 'Operator', qty: 1, hoursSource: 'manual', manualHours: 2.5, rateCents: $(45) }],
      [],
    )
    expect(r.rows[0]).toEqual({ hours: 2.5, amountCents: $(112.5) })
  })

  it('cantidad decimal en materiales', () => {
    expect(materialAmount({ id: 'm', description: '', qty: '1.5', unit: 'Kit', unitPriceCents: $(7.8) })).toBe($(11.7))
    expect(materialAmount({ id: 'm', description: '', qty: '', unit: 'Kit', unitPriceCents: $(7.8) })).toBe(0)
  })
})
