/**
 * Generación del PDF en el navegador (funciona sin internet: fuentes y logo vienen de la app).
 */
import { pdf, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { Quote } from '../domain/types.ts'
import { registerPdfFonts } from './fonts.ts'
import { QuoteDocument } from './QuoteDocument.tsx'

const base = import.meta.env.BASE_URL
registerPdfFonts((file) => `${base}fonts/${file}`)
const assets = { logo: `${base}logo-ets.png` }

export async function generatePdfBlob(quote: Quote): Promise<Blob> {
  // QuoteDocument devuelve un <Document>, aunque su tipo de props sea otro
  const doc = createElement(QuoteDocument, { quote, assets }) as unknown as ReactElement<DocumentProps>
  return pdf(doc).toBlob()
}
