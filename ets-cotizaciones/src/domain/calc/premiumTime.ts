import { sumCents, type Cents } from '../money.ts'
import type { PremiumTimeQuote } from '../types.ts'

/** Premium Time: sin material/labor ni B2B; solo la suma de los montos. */
export function computePremiumTime(quote: Pick<PremiumTimeQuote, 'items'>): { totalCents: Cents } {
  return { totalCents: sumCents(quote.items.map((i) => i.amountCents)) }
}
