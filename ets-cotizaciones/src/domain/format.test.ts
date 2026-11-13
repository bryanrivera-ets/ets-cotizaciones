import { describe, expect, it } from 'vitest'
import { EXAMPLES } from './fixtures/examples.ts'
import { formatMoney, parseMoney } from './money.ts'
import {
  defaultPdfFileName,
  formatLongDate,
  formatQuoteNumber,
  pdfFileNameOf,
  quoteNumberOf,
  sanitizeFileName,
  toRoman,
} from './format.ts'

describe('dinero', () => {
  it('formatea como $43,631.00', () => {
    expect(formatMoney(4363100)).toBe('$43,631.00')
    expect(formatMoney(69808)).toBe('$698.08')
    expect(formatMoney(780)).toBe('$7.80')
    expect(formatMoney(0)).toBe('$0.00')
  })

  it('lee lo que escribe el usuario', () => {
    expect(parseMoney('$43,631')).toBe(4363100)
    expect(parseMoney('7.8')).toBe(780)
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('abc')).toBeNull()
  })
})

describe('numeración', () => {
  it('formato NNN-AA con revisiones y T&M', () => {
    expect(formatQuoteNumber({ seq: 49, year: 2026, revision: 0 })).toBe('049-26')
    expect(formatQuoteNumber({ seq: 49, year: 2026, revision: 1 })).toBe('049-26 REV I')
    expect(formatQuoteNumber({ seq: 348, year: 2026, revision: 2 }, true)).toBe('348-26 REV II (T&M)')
    expect(formatQuoteNumber({ seq: 5, year: 2030, revision: 3 })).toBe('005-30 REV III')
    expect(formatQuoteNumber({ seq: null, year: 2026, revision: 0 })).toBe('DRAFT')
  })

  it('números romanos', () => {
    expect([1, 2, 3, 4, 9, 14, 40].map(toRoman)).toEqual(['I', 'II', 'III', 'IV', 'IX', 'XIV', 'XL'])
  })

  it('números de los ejemplos', () => {
    expect(quoteNumberOf(EXAMPLES.Q348)).toBe('348-26 REV II (T&M)')
    expect(quoteNumberOf(EXAMPLES.Q223)).toBe('223-26')
  })
})

describe('fechas', () => {
  it('formato en inglés', () => {
    expect(formatLongDate('2026-06-01')).toBe('June 1, 2026')
    expect(formatLongDate('2026-02-18')).toBe('February 18, 2026')
    expect(formatLongDate('2026-11-04')).toBe('November 4, 2026')
  })
})

describe('nombre del PDF', () => {
  it('por defecto: {Quote No.} - {PROJECT/AREA} - {CONTRACTOR}.pdf', () => {
    expect(defaultPdfFileName(EXAMPLES.Q223)).toBe('223-26 - KENVUE BLENDER NO.1 REPLACEMENT - Cruybelt Contractor.pdf')
    expect(defaultPdfFileName(EXAMPLES.Q387)).toBe('387-26 - SARTORIUS FMT AREA 7 (PATCH REPAIR) - Sartorius.pdf')
  })

  it('quita caracteres no válidos', () => {
    expect(sanitizeFileName('A/B: C*D? "E" <F>|')).toBe('AB CD E F')
    expect(pdfFileNameOf({ ...EXAMPLES.Q049, pdfFileName: 'Mi/archivo.pdf' })).toBe('Miarchivo.pdf')
  })
})
