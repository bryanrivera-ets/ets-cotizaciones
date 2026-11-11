/**
 * Fracciones exactas (BigInt) para porcentajes y proporciones.
 * Evitan errores de punto flotante: 58.98 % se guarda como 5898/10000,
 * y "total del área / subtotal" se guarda como 679800/1152500 sin perder precisión.
 */
export interface Ratio {
  readonly num: bigint
  readonly den: bigint
}

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a
  b = b < 0n ? -b : b
  while (b) [a, b] = [b, a % b]
  return a || 1n
}

export function ratio(num: bigint | number, den: bigint | number = 1n): Ratio {
  let n = BigInt(num)
  let d = BigInt(den)
  if (d === 0n) throw new RangeError('Denominador cero')
  if (d < 0n) {
    n = -n
    d = -d
  }
  const g = gcd(n, d)
  return { num: n / g, den: d / g }
}

/** Convierte un decimal ("58.98", 60, "0.5") a fracción exacta. */
export function parseDecimal(value: string | number): Ratio {
  const s = String(value).trim().replace(/,/g, '')
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s)
  if (!m || (m[2] === '' && (m[3] ?? '') === '')) throw new RangeError(`Número inválido: "${value}"`)
  const frac = m[3] ?? ''
  const digits = BigInt((m[2] || '0') + frac)
  return ratio(m[1] === '-' ? -digits : digits, 10n ** BigInt(frac.length))
}

export const ONE = ratio(1)
export const ZERO = ratio(0)

export const add = (a: Ratio, b: Ratio): Ratio => ratio(a.num * b.den + b.num * a.den, a.den * b.den)
export const sub = (a: Ratio, b: Ratio): Ratio => ratio(a.num * b.den - b.num * a.den, a.den * b.den)
export const mul = (a: Ratio, b: Ratio): Ratio => ratio(a.num * b.num, a.den * b.den)
export const div = (a: Ratio, b: Ratio): Ratio => ratio(a.num * b.den, a.den * b.num)
export const isNegative = (a: Ratio): boolean => a.num < 0n
export const toNumber = (a: Ratio): number => Number(a.num) / Number(a.den)

/** Porcentaje escrito por el usuario (60 → 60/100). */
export const percent = (value: string | number): Ratio => div(parseDecimal(value), ratio(100))

/** División entera redondeando 0.5 hacia arriba (lejos de cero). */
export function divRoundHalfUp(a: bigint, b: bigint): bigint {
  if (b < 0n) return divRoundHalfUp(-a, -b)
  if (a < 0n) return -divRoundHalfUp(-a, b)
  return (2n * a + b) / (2n * b)
}

/**
 * Multiplica una cantidad entera (centavos) por una fracción y redondea al múltiplo de `unit`.
 * unit = 1 → al centavo; unit = 100 → al dólar entero.
 */
export function mulRound(cents: number, r: Ratio, unit = 1): number {
  assertInt(cents)
  const q = divRoundHalfUp(BigInt(cents) * r.num, r.den * BigInt(unit))
  return Number(q) * unit
}

export function assertInt(n: number): void {
  if (!Number.isSafeInteger(n)) throw new RangeError(`Se esperaba un entero (centavos): ${n}`)
}
