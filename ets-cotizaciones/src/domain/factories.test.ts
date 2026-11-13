import { describe, expect, it } from 'vitest'
import { computeLumpSum } from './calc/lumpSum.ts'
import { computeTm } from './calc/tm.ts'
import { newQuote } from './factories.ts'
import { formatQuoteNumber } from './format.ts'
import { SEED_PROFILES } from './seed/profiles.ts'
import { CARLOS_SOTO } from './seed/signers.ts'
import { TERMS_B } from './seed/terms.ts'

const ctx = { profile: SEED_PROFILES[1], signer: CARLOS_SOTO, terms: TERMS_B, date: '2026-11-13' }

describe('newQuote', () => {
  it('crea cada tipo con los datos del perfil congelados', () => {
    for (const type of ['lumpSum', 'premiumTime', 'tm'] as const) {
      const q = newQuote(type, ctx)
      expect(q.type).toBe(type)
      expect(q.status).toBe('draft')
      expect(q.preparedBy).toEqual({ name: 'Carlos Soto Navarro', initials: 'CSN' })
      expect(q.header.date).toBe('2026-11-13')
      expect(q.number).toEqual({ seq: null, year: 2026, revision: 0 })
      expect(formatQuoteNumber(q.number, type === 'tm')).toMatch(/^DRAFT/)
      expect(q.tempId).toMatch(/^TMP-/)
    }
  })

  it('copia (no comparte) términos y firmante', () => {
    const q = newQuote('lumpSum', ctx)
    expect(q.terms).toEqual(TERMS_B)
    expect(q.terms).not.toBe(TERMS_B)
    q.terms.lines[0].runs[0].text = 'cambiado'
    expect(TERMS_B.lines[0].runs[0].text).toBe('Payment Terms: Net 30 days.')
  })

  it('usa el título preferido del perfil (T&M siempre ETS CORP.)', () => {
    expect(newQuote('lumpSum', ctx).title).toBe('P R O P O S A L')
    expect(newQuote('tm', ctx).title).toBe('ETS CORP. P R O P O S A L')
  })

  it('las cotizaciones nuevas se pueden calcular sin errores', () => {
    const ls = newQuote('lumpSum', ctx)
    expect(ls.type === 'lumpSum' && computeLumpSum(ls).totalCents).toBe(0)
    const tm = newQuote('tm', ctx)
    expect(tm.type === 'tm' && computeTm(tm).totalCents).toBe(0)
  })
})
