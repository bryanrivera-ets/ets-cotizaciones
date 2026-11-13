import { Document, Text, View } from '@react-pdf/renderer'
import { brand } from '../domain/brand.ts'
import { computePremiumTime } from '../domain/calc/premiumTime.ts'
import { formatMoney } from '../domain/money.ts'
import type { PremiumTimeQuote } from '../domain/types.ts'
import { ClassicPage, ClassicTermsPage, OPENING, ProjectBar } from './classic.tsx'
import type { PdfAssets } from './shared.tsx'

const C = brand.colors
const BORDER = { borderColor: C.tableBorder }
const COLS = [292.4, 135]

export function PremiumTimeDocument({ quote, assets }: { quote: PremiumTimeQuote; assets: PdfAssets }) {
  const { totalCents } = computePremiumTime(quote)
  const single = quote.items.length === 1
  return (
    <Document title={quote.header.projectArea} author="ETS Corp." creator="ETS Cotizaciones">
      <ClassicPage quote={quote} assets={assets}>
        <ProjectBar quote={quote} />
        <Text style={{ marginTop: 57, fontSize: 11, lineHeight: 1.2 }}>{OPENING}</Text>
        <Text style={{ marginTop: 78, fontSize: 14, textAlign: 'center' }}>{quote.subtitle}</Text>
        <View style={{ marginTop: 47, marginLeft: 20.2, width: COLS[0] + COLS[1] }}>
          <View
            style={{ flexDirection: 'row', height: 34.8, backgroundColor: C.navy, borderWidth: 0.5, ...BORDER }}
          >
            {['DESCRIPTION', 'AMOUNT'].map((h, i) => (
              <View
                key={h}
                style={{ width: COLS[i] - 0.5, justifyContent: 'center', ...(i === 0 ? { borderRightWidth: 0.5, ...BORDER } : {}) }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' }}>{h}</Text>
              </View>
            ))}
          </View>
          {quote.items.map((item) => (
            <View
              key={item.id}
              wrap={false}
              style={{
                flexDirection: 'row',
                minHeight: 48,
                backgroundColor: C.tableFill,
                borderLeftWidth: 0.5,
                borderRightWidth: 0.5,
                borderBottomWidth: 0.5,
                ...BORDER,
              }}
            >
              <View style={{ width: COLS[0] - 0.5, justifyContent: 'center', padding: 4, borderRightWidth: 0.5, ...BORDER }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.1 }}>{item.title}</Text>
                {item.detail ? (
                  <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.15 }}>{item.detail}</Text>
                ) : null}
              </View>
              <View style={{ width: COLS[1] - 0.5, justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                  {single ? 'Total: ' : ''}
                  {formatMoney(item.amountCents)}
                </Text>
              </View>
            </View>
          ))}
          {single ? null : (
            <View
              wrap={false}
              style={{ flexDirection: 'row', minHeight: 30, borderLeftWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5, ...BORDER }}
            >
              <View style={{ width: COLS[0] - 0.5, justifyContent: 'center', borderRightWidth: 0.5, ...BORDER }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>Total</Text>
              </View>
              <View style={{ width: COLS[1] - 0.5, justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>{formatMoney(totalCents)}</Text>
              </View>
            </View>
          )}
        </View>
      </ClassicPage>
      <ClassicTermsPage quote={quote} assets={assets} />
    </Document>
  )
}
