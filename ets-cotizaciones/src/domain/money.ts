import { assertInt, mulRound, parseDecimal } from './ratio.ts'

/** Todo el dinero se maneja como centavos enteros. */
export type Cents = number

/** 43631 → 4363100 */
export const dollars = (d: number | string): Cents => mulRound(100, parseDecimal(d))

/** Lee lo que escribe el usuario ("$43,631", "7.80") y lo convierte a centavos. null si no es válido. */
export function parseMoney(input: string): Cents | null {
  const clean = input.replace(/[$\s,]/g, '')
  if (clean === '') return null
  try {
    return mulRound(100, parseDecimal(clean))
  } catch {
    return null
  }
}

const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 4363100 → "$43,631.00" */
export function formatMoney(cents: Cents): string {
  assertInt(cents)
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${fmt.format(Math.abs(cents) / 100)}`
}

export const sumCents = (values: readonly Cents[]): Cents => values.reduce((a, b) => a + b, 0)
