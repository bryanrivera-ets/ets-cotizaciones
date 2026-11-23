import { describe, expect, it } from 'vitest'
import { TERMS_A, TERMS_B } from './seed/terms.ts'
import { termsCustomized, termsLineText, visibleTermsLines } from './terms.ts'

describe('términos por cotización', () => {
  it('las líneas desactivadas no salen en el PDF', () => {
    const t = structuredClone(TERMS_A)
    t.lines[18].hidden = true // "Vapor barrier not included."
    const visible = visibleTermsLines(t.lines)
    expect(visible).toHaveLength(TERMS_A.lines.length - 1)
    expect(visible.map(termsLineText)).not.toContain('Vapor barrier not included.')
  })

  it('detecta si se modificaron respecto a la biblioteca', () => {
    const t = structuredClone(TERMS_A)
    expect(termsCustomized(t, TERMS_A)).toBe(false)
    t.lines[0].hidden = true
    expect(termsCustomized(t, TERMS_A)).toBe(true)
    t.lines[0].hidden = false
    expect(termsCustomized(t, TERMS_A)).toBe(false)
    t.lines[0].runs[0].text = 'Payment Terms: Net 45 days.'
    expect(termsCustomized(t, TERMS_A)).toBe(true)
    expect(termsCustomized(TERMS_A, TERMS_B)).toBe(true)
    expect(termsCustomized(TERMS_A, undefined)).toBe(true)
  })

  it('texto plano de una línea con varias partes (emails)', () => {
    expect(termsLineText(TERMS_A.lines[6])).toBe('If approved, please send purchase order to purchaseorder@etspr.com or estimados@etspr.com .')
  })
})
