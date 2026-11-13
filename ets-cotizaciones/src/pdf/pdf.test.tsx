import { renderToBuffer } from '@react-pdf/renderer'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXAMPLES } from '../domain/fixtures/examples.ts'
import { registerPdfFonts } from './fonts.ts'
import { QuoteDocument } from './QuoteDocument.tsx'

registerPdfFonts((file) => join(process.cwd(), 'public', 'fonts', file))
const assets = { logo: join(process.cwd(), 'public', 'logo-ets.png') }

/** Páginas de los PDF originales en referencia/ejemplos/ */
const EXPECTED_PAGES: Record<keyof typeof EXAMPLES, number> = {
  Q049: 2,
  Q303: 2,
  Q223: 2,
  Q387: 3,
  Q452: 2,
  Q348: 3,
}

describe('PDF de los ejemplos', () => {
  for (const [key, quote] of Object.entries(EXAMPLES) as [keyof typeof EXAMPLES, (typeof EXAMPLES)[keyof typeof EXAMPLES]][]) {
    it(`${key.slice(1)} genera un PDF con ${EXPECTED_PAGES[key]} páginas`, async () => {
      const buf = await renderToBuffer(<QuoteDocument quote={quote} assets={assets} />)
      const text = buf.toString('latin1')
      expect(text.startsWith('%PDF')).toBe(true)
      const pages = text.match(/\/Type \/Page\b(?!s)/g)?.length
      expect(pages).toBe(EXPECTED_PAGES[key])
    }, 30_000)
  }
})
