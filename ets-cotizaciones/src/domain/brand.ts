/**
 * Constantes visuales extraídas de los PDF de referencia (referencia/ejemplos/).
 * Se usan tanto en la interfaz como en la generación del PDF.
 */
export const brand = {
  colors: {
    /** Barra superior y encabezado de tablas (Lump Sum / Premium Time) */
    navy: '#1f4e79',
    /** Borde de tablas Lump Sum */
    tableBorder: '#4471c4',
    /** Relleno de filas en tablas Lump Sum */
    tableFill: '#d9e1f3',
    /** Barra gris del título */
    titleBar: '#a5a6a5',
    /** Texto del pie de página */
    footerText: '#595959',
    /** Iniciales de quien preparó (pie de página) */
    initials: '#8eaadb',
    /** "Quotation valid for 15 days." */
    termsBlue: '#2f5496',
    /** Encabezado de tablas T&M */
    tmHeader: '#2d5497',
    /** Barra superior T&M */
    tmTopBar: '#1f3864',
    /** Filas de totales T&M */
    tmTotalFill: '#d8e2f2',
    /** Filas alternas T&M */
    tmZebra: '#f2f2f2',
    /** "Vapor barrier not included." e "Important Note" */
    red: '#ff0000',
  },
  footer: {
    address: 'PO Box 6810 Caguas, PR 00726-6810',
    phone: '787.747.1690',
    fax: '787.747.3153',
  },
} as const
