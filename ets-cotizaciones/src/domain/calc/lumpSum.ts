import { sumCents, type Cents } from '../money.ts'
import { mulRound, percent, ratio } from '../ratio.ts'
import type { LumpSumQuote, LumpSumSection, PriceGroup } from '../types.ts'

export const DEFAULT_MATERIAL_PERCENT = '60'
export const B2B_RATE = ratio(4, 100)

export interface Split {
  materialCents: Cents
  laborCents: Cents
  totalCents: Cents
}

/**
 * Regla 6.1: Material = % del total redondeado al dólar entero (0.5 hacia arriba);
 * Labor = Total − Material.
 */
export function splitTotal(totalCents: Cents, materialPercent: string = DEFAULT_MATERIAL_PERCENT): Split {
  const materialCents = mulRound(totalCents, percent(materialPercent), 100)
  return { materialCents, laborCents: totalCents - materialCents, totalCents }
}

/** Regla 6.2: B2B = 4 % de la labor, redondeado al centavo. */
export const b2b = (laborCents: Cents): Cents => mulRound(laborCents, B2B_RATE)

export function computeGroup(group: PriceGroup, materialPercent: string): Split {
  const s = group.split
  if (s.mode === 'total') return splitTotal(s.totalCents, materialPercent)
  return {
    materialCents: s.materialCents,
    laborCents: s.laborCents,
    totalCents: s.materialCents + s.laborCents,
  }
}

export interface SectionResult extends Split {
  groups: Split[]
  /** Se muestra aparte; NO se suma al total. */
  b2bCents: Cents
}

export function computeSection(section: LumpSumSection, materialPercent: string): SectionResult {
  const groups = section.groups.map((g) => computeGroup(g, materialPercent))
  const laborCents = sumCents(groups.map((g) => g.laborCents))
  return {
    groups,
    materialCents: sumCents(groups.map((g) => g.materialCents)),
    laborCents,
    totalCents: sumCents(groups.map((g) => g.totalCents)),
    b2bCents: b2b(laborCents),
  }
}

export interface LumpSumResult {
  sections: SectionResult[]
  totalCents: Cents
}

export function computeLumpSum(quote: Pick<LumpSumQuote, 'sections' | 'materialPercent'>): LumpSumResult {
  const sections = quote.sections.map((s) => computeSection(s, quote.materialPercent))
  return { sections, totalCents: sumCents(sections.map((s) => s.totalCents)) }
}
