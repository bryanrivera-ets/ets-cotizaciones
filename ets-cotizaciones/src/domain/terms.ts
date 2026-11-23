import type { TermsLine, TermsVersion } from './types.ts'

/** Líneas que salen en el PDF (las desactivadas en la cotización no). */
export const visibleTermsLines = (lines: TermsLine[]): TermsLine[] => lines.filter((l) => !l.hidden)

/** Texto plano de una línea (para mostrarla resumida). */
export const termsLineText = (l: TermsLine): string => l.runs.map((r) => r.text).join('')

/**
 * ¿Los términos de la cotización son distintos de la versión guardada en la biblioteca?
 * (líneas editadas, agregadas, quitadas o desactivadas)
 */
export function termsCustomized(quoteTerms: TermsVersion, libraryVersion: TermsVersion | undefined): boolean {
  if (!libraryVersion) return true
  const strip = (lines: TermsLine[]) => lines.map(({ hidden, ...l }) => ({ ...l, hidden: hidden === true }))
  return JSON.stringify(strip(quoteTerms.lines)) !== JSON.stringify(strip(libraryVersion.lines))
}
