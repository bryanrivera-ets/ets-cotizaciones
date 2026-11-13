import { Font } from '@react-pdf/renderer'

/**
 * Fuentes libres (licencia SIL OFL / Apache) incluidas en public/fonts/ para que el PDF
 * sea idéntico en iPad y desktop, con o sin internet.
 *
 * | Uso                         | Original (Microsoft)         | Reemplazo libre          |
 * |-----------------------------|------------------------------|--------------------------|
 * | Texto Lump Sum / Premium    | "Calibri" (se ve Bahnschrift)| Barlow Semi Condensed    |
 * | Título de la barra gris     | Arial Nova Bold              | Arimo Bold               |
 * | Pie de página               | Aharoni Bold                 | Montserrat Bold          |
 * | Texto T&M                   | Calibri                      | Carlito (mismas medidas) |
 * | Firma Eric Rivera           | Bradley Hand ITC             | Kalam                    |
 * | Firma Carlos A. Soto        | Dreaming Outloud Script Pro  | Dancing Script           |
 */
export const FONT = {
  body: 'Barlow Semi Condensed',
  title: 'Arimo',
  footer: 'Montserrat',
  tm: 'Carlito',
} as const

/** Clave guardada en cada firmante → familia manuscrita. */
export const SIGNATURE_FONTS: Record<string, { family: string; label: string; size: number }> = {
  'signature-1': { family: 'Kalam', label: 'Kalam', size: 14 },
  'signature-2': { family: 'Dancing Script', label: 'Dancing Script', size: 15 },
}

export const signatureFontOf = (key: string) => SIGNATURE_FONTS[key] ?? SIGNATURE_FONTS['signature-1']

const FILES: { family: string; fonts: { file: string; fontWeight?: 'normal' | 'bold'; fontStyle?: 'normal' | 'italic' }[] }[] = [
  {
    family: FONT.body,
    fonts: [
      { file: 'BarlowSemiCondensed-Regular.ttf' },
      { file: 'BarlowSemiCondensed-Bold.ttf', fontWeight: 'bold' },
      { file: 'BarlowSemiCondensed-Italic.ttf', fontStyle: 'italic' },
      { file: 'BarlowSemiCondensed-BoldItalic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
    ],
  },
  {
    family: FONT.tm,
    fonts: [
      { file: 'Carlito-Regular.ttf' },
      { file: 'Carlito-Bold.ttf', fontWeight: 'bold' },
      { file: 'Carlito-Italic.ttf', fontStyle: 'italic' },
      { file: 'Carlito-BoldItalic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
    ],
  },
  { family: FONT.title, fonts: [{ file: 'Arimo-Bold.ttf', fontWeight: 'bold' }] },
  { family: FONT.footer, fonts: [{ file: 'Montserrat-Bold.ttf', fontWeight: 'bold' }] },
  { family: 'Kalam', fonts: [{ file: 'Kalam-Regular.ttf' }] },
  { family: 'Dancing Script', fonts: [{ file: 'DancingScript-Regular.ttf' }] },
]

let registered = false

/**
 * Registra las fuentes. `resolve` convierte el nombre del archivo en una URL (navegador)
 * o una ruta de disco (scripts de Node).
 */
export function registerPdfFonts(resolve: (file: string) => string): void {
  if (registered) return
  registered = true
  for (const { family, fonts } of FILES) {
    Font.register({
      family,
      fonts: fonts.map(({ file, ...rest }) => ({ src: resolve(file), ...rest })),
    })
  }
  // Sin guiones automáticos: Word no divide palabras.
  Font.registerHyphenationCallback((word) => [word])
}
