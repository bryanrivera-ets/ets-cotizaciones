/**
 * Genera los PDF de las 6 cotizaciones de ejemplo en out/pdf/ para compararlos con
 * referencia/ejemplos/. Uso: npm run pdf:examples
 */
import { renderToFile } from '@react-pdf/renderer'
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { EXAMPLES } from '../src/domain/fixtures/examples.ts'
import { pdfFileNameOf } from '../src/domain/format.ts'
import { registerPdfFonts } from '../src/pdf/fonts.ts'
import { QuoteDocument } from '../src/pdf/QuoteDocument.tsx'

const root = resolve(import.meta.dirname, '..')
const out = join(root, 'out', 'pdf')
mkdirSync(out, { recursive: true })

registerPdfFonts((file) => join(root, 'public', 'fonts', file))
const assets = { logo: join(root, 'public', 'logo-ets.png') }

for (const [key, quote] of Object.entries(EXAMPLES)) {
  const file = join(out, `${key.slice(1)}.pdf`)
  await renderToFile(<QuoteDocument quote={quote} assets={assets} />, file)
  console.log(`✓ ${file}   (nombre para el usuario: ${pdfFileNameOf(quote)})`)
}
