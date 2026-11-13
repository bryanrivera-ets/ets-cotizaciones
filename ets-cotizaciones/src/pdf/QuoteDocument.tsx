import type { Quote } from '../domain/types.ts'
import { LumpSumDocument } from './LumpSumDocument.tsx'
import { PremiumTimeDocument } from './PremiumTimeDocument.tsx'
import type { PdfAssets } from './shared.tsx'
import { TmDocument } from './TmDocument.tsx'

/** Documento PDF de cualquier tipo de cotización. */
export function QuoteDocument({ quote, assets }: { quote: Quote; assets: PdfAssets }) {
  switch (quote.type) {
    case 'lumpSum':
      return <LumpSumDocument quote={quote} assets={assets} />
    case 'premiumTime':
      return <PremiumTimeDocument quote={quote} assets={assets} />
    case 'tm':
      return <TmDocument quote={quote} assets={assets} />
  }
}

export type { PdfAssets }
