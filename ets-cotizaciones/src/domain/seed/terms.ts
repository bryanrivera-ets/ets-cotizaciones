import { brand } from '../brand.ts'
import type { TermsLine, TermsVersion, TextRun } from '../types.ts'

/**
 * Términos y condiciones extraídos de los PDF de referencia.
 * Versión A: 223-26, 303-26, 387-26, 348-26. Versión B: 049-26, 452-26.
 * La única diferencia es el tercer punto. La línea "Additional requirements…" aparece
 * dos veces en los originales y se mantiene así a propósito.
 */

const t = (text: string, extra: Omit<TextRun, 'text'> = {}): TextRun => ({ text, ...extra })
const line = (id: string, runs: TextRun[], extra: Partial<TermsLine> = {}): TermsLine => ({
  id,
  runs,
  bullet: true,
  ...extra,
})

const THIRD_A = line('t03', [
  t(
    'Upon approval of the proposal, all costs shall be separated into labor and materials in the Work Order or Purchase Order and must be in the name of ETS Corp.',
    { bold: true, italic: true },
  ),
])

const THIRD_B = line('t03', [
  t('Upon approval of the proposal, all costs shall be separated into labor and materials in the Work Order or Purchase Order.', {
    bold: true,
  }),
])

function buildLines(third: TermsLine): TermsLine[] {
  return [
    line('t01', [t('Payment Terms: Net 30 days.')]),
    line('t02', [t('Quotation valid for 15 days.', { bold: true, color: brand.colors.termsBlue })], {
      bulletColor: brand.colors.termsBlue,
    }),
    third,
    line('t04', [t('NEW CUSTOMERS ARE REQUIRED TO SUBMIT A DEPOSIT OF 50% OF THE REFERENCE QUOTE.', { bold: true })]),
    line('t05', [t('Cost is based on regular hours (8 hours daily, Monday to Friday) Overtime not included.')]),
    line('t06', [t('Prices may fluctuate due to variation in raw material and freight cost in the market.')]),
    line('t07', [
      t('If approved, please send purchase order to '),
      t('purchaseorder@etspr.com', { href: 'mailto:purchaseorder@etspr.com' }),
      t(' or '),
      t('estimados@etspr.com', { href: 'mailto:estimados@etspr.com' }),
      t(' .'),
    ]),
    line('t08', [t('Purchase orders must reference the corresponding quote.')]),
    line('t09', [t('Customer will provide water source & electrical power, including 120, 240 & 480V 3 phase.')]),
    line('t10', [t('Client is responsible for maintaining all areas free of heavy equipment in order to proceed as scheduled.')]),
    line('t11', [t('Once installation has begun, there should not be interruption as this may cause system contamination.')]),
    line('t12', [
      t(
        'Price based on one mobilization, areas must be ready and available to start working as planned. Additional mobilization cost will range between $2,000.00 and $2,500.00 each.',
      ),
    ]),
    line('t13', [
      t(
        'Time delays in area clearance procedure or any other situation under the customer’s responsibility and control which cause lost in time of ETS personnel, will be charged separately.',
      ),
    ]),
    line('t14', [
      t(
        'Additional requirements not specified in this proposal will be quoted separately. Changes in floor slope or any patching area not considered in prices. The installation shall follow existing floor levels and application of system is not intended to correct drainage problems.',
      ),
    ]),
    line('t15', [t('Changes in scope, square feet, thickness or material will not be performed without written consent from client.')]),
    line('t16', [t('One-year warranty after the date of installation.')]),
    line('t17', [t('Additional requirements not specified in this proposal will be quoted separately.')]),
    line('t18', [t('A certain number of hours are required for product to cure, before continuing with the installation process.')]),
    line('t19', [t('Vapor barrier not included.', { color: brand.colors.red })]),
    line(
      't20',
      [
        t(
          'Important Note: Quote is to be considered for all areas for the established price. If all areas are not to be considered, pricing to given quote could change. This quote is based on it being a continuous job, without interruptions.',
          { color: brand.colors.red },
        ),
      ],
      { bullet: false, size: 'large' },
    ),
  ]
}

export const TERMS_A: TermsVersion = { id: 'terms-a', name: 'Versión A (…in the name of ETS Corp.)', lines: buildLines(THIRD_A) }
export const TERMS_B: TermsVersion = { id: 'terms-b', name: 'Versión B', lines: buildLines(THIRD_B) }

export const SEED_TERMS: TermsVersion[] = [TERMS_A, TERMS_B]
