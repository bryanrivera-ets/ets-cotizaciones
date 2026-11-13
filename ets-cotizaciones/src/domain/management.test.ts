import { describe, expect, it } from 'vitest'
import { Q223, Q348, Q387, Q452 } from './fixtures/examples.ts'
import { quoteNumberOf } from './format.ts'
import {
  compareByNumber,
  duplicateQuote,
  emailBody,
  emailSubject,
  EMPTY_FILTERS,
  mailtoUrl,
  matchesFilters,
  newRevision,
  titleCase,
} from './management.ts'

describe('duplicar', () => {
  it('cotización nueva: sin número, fecha de hoy, borrador, mismo contenido', () => {
    const d = duplicateQuote(Q223, '2026-12-01')
    expect(d.id).not.toBe(Q223.id)
    expect(d.number).toEqual({ seq: null, year: 2026, revision: 0 })
    expect(d.header.date).toBe('2026-12-01')
    expect(d.status).toBe('draft')
    expect(d.header.projectArea).toBe(Q223.header.projectArea)
    expect(d.type === 'lumpSum' && d.sections[0].groups[1].split).toEqual(Q223.sections[0].groups[1].split)
    expect(d.terms).toEqual(Q223.terms)
  })

  it('no comparte objetos ni ids con el original', () => {
    const d = duplicateQuote(Q348, '2026-12-01')
    expect(d.type === 'tm' && d.materials[0].id).not.toBe(Q348.materials[0].id)
    if (d.type === 'tm') d.materials[0].description = 'cambiado'
    expect(Q348.materials[0].description).toBe('Sikafloor 264 (Light Gray) – Base Coat')
  })

  it('el año del número nuevo sale de la fecha de hoy', () => {
    expect(duplicateQuote(Q452, '2027-01-03').number.year).toBe(2027)
  })
})

describe('revisiones', () => {
  it('mismo número con la revisión siguiente', () => {
    const r1 = newRevision(Q223, '2026-12-01')
    expect(quoteNumberOf(r1)).toBe('223-26 REV I')
    expect(r1.header.date).toBe('2026-12-01')
    expect(r1.status).toBe('draft')
    const r3 = newRevision(Q348)
    expect(quoteNumberOf(r3)).toBe('348-26 REV III (T&M)')
  })

  it('no se puede revisar una cotización sin número oficial', () => {
    expect(() => newRevision({ ...Q223, number: { seq: null, year: 2026, revision: 0 } })).toThrow()
  })
})

describe('búsqueda', () => {
  const f = (over: Partial<typeof EMPTY_FILTERS>) => ({ ...EMPTY_FILTERS, ...over })

  it('por número, contractor, proyecto, contacto y quien la preparó', () => {
    expect(matchesFilters(Q223, f({ text: '223-26' }))).toBe(true)
    expect(matchesFilters(Q223, f({ text: 'cruybelt' }))).toBe(true)
    expect(matchesFilters(Q223, f({ text: 'blender replacement' }))).toBe(true)
    expect(matchesFilters(Q223, f({ text: 'gabriel' }))).toBe(true)
    expect(matchesFilters(Q452, f({ text: 'csn' }))).toBe(true)
    expect(matchesFilters(Q223, f({ text: 'amgen' }))).toBe(false)
  })

  it('sin importar acentos ni mayúsculas', () => {
    expect(matchesFilters(Q387, f({ text: 'jose gonzalez' }))).toBe(true)
    expect(matchesFilters(Q348, f({ text: 'SANCHEZ' }))).toBe(true)
  })

  it('por fecha (texto o rango)', () => {
    expect(matchesFilters(Q223, f({ text: 'june' }))).toBe(true)
    expect(matchesFilters(Q223, f({ from: '2026-06-01', to: '2026-06-30' }))).toBe(true)
    expect(matchesFilters(Q223, f({ from: '2026-07-01' }))).toBe(false)
  })

  it('por estado, tipo y preparada por', () => {
    expect(matchesFilters(Q223, f({ status: 'sent' }))).toBe(true)
    expect(matchesFilters(Q223, f({ status: 'approved' }))).toBe(false)
    expect(matchesFilters(Q348, f({ type: 'tm' }))).toBe(true)
    expect(matchesFilters(Q452, f({ preparedBy: 'DMR' }))).toBe(false)
  })

  it('las versiones anteriores se ocultan salvo que se pidan', () => {
    expect(matchesFilters(Q223, f({}), true)).toBe(false)
    expect(matchesFilters(Q223, f({ includeOld: true }), true)).toBe(true)
  })

  it('orden por número: sin número arriba, luego más reciente', () => {
    const draft = { ...Q223, number: { seq: null, year: 2026, revision: 0 } }
    const sorted = [Q223, Q452, draft, Q348].sort(compareByNumber).map(quoteNumberOf)
    expect(sorted).toEqual(['DRAFT', '452-26', '348-26 REV II (T&M)', '223-26'])
  })
})

describe('email', () => {
  it('asunto como en la especificación', () => {
    expect(emailSubject(Q223)).toBe('Proposal 223-26 – Kenvue Blender No.1 Replacement')
    expect(titleCase('AMGEN - AML1 ROOM 4137 PACKING AREA')).toBe('Amgen - AML1 Room 4137 Packing Area')
  })

  it('mensaje con el contacto, el número y quien la preparó', () => {
    const b = emailBody(Q223)
    expect(b).toContain('Dear Eng. Gabriel Silva,')
    expect(b).toContain('proposal 223-26 for Kenvue Blender No.1 Replacement')
    expect(b).toContain('Domardi Machin')
  })

  it('mailto con asunto y mensaje codificados', () => {
    const url = mailtoUrl('gsilva@cruybelt.com', 'Proposal 223-26 – X & Y', 'Hola\nAdiós')
    expect(url.startsWith('mailto:gsilva@cruybelt.com?subject=Proposal%20223-26%20')).toBe(true)
    expect(url).toContain('%26')
    expect(url).toContain('body=Hola%0AAdi%C3%B3s')
  })
})
