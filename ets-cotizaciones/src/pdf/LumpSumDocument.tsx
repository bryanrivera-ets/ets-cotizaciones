import { Document, Text, View } from '@react-pdf/renderer'
import { brand } from '../domain/brand.ts'
import { computeLumpSum, type Split } from '../domain/calc/lumpSum.ts'
import { formatMoney } from '../domain/money.ts'
import type { LineItem, LumpSumQuote, LumpSumSection, PriceGroup, RichLine } from '../domain/types.ts'
import { ClassicPage, ClassicTermsPage, OPENING, ProjectBar } from './classic.tsx'
import { FONT } from './fonts.ts'
import { ScopeList, type PdfAssets } from './shared.tsx'

const C = brand.colors
const BORDER = { borderColor: C.tableBorder }
/** Anchos de columna (DESCRIPTION, QTY/UNIT, UNIT PRICE, AMOUNT) */
const COLS = [152.8, 117, 72.3, 128.6]
const TABLE_LEFT = -1.3

const SCOPE_LAYOUT = {
  fontFamily: FONT.body,
  fontSize: 11,
  lineHeight: 13.2,
  gap: 6.6,
  textIndent: 72,
  bulletGap: 18,
  levelIndent: 36,
}

// ───────────────────────── Tabla de precios ─────────────────────────

function Rich({ line, size, smallSize }: { line: RichLine; size: number; smallSize: number }) {
  const fontSize = line.small ? smallSize : size
  return (
    <Text style={{ fontSize, fontWeight: line.bold ? 'bold' : 'normal', textAlign: 'center', lineHeight: 1.15 }}>
      {line.text}
      {line.note ? <Text style={{ fontSize: smallSize }}> {line.note}</Text> : null}
    </Text>
  )
}

function DescriptionCell({ item }: { item: LineItem }) {
  if (item.bulleted) {
    return (
      <View style={{ alignSelf: 'center' }}>
        {item.description.map((l, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#000', marginRight: 9 }} />
            <Text style={{ fontSize: 12, fontWeight: l.bold ? 'bold' : 'normal', lineHeight: 1.3 }}>{l.text}</Text>
          </View>
        ))}
      </View>
    )
  }
  return (
    <View>
      {item.description.map((l, i) => (
        <Rich key={i} line={l} size={14} smallSize={11} />
      ))}
    </View>
  )
}

function ItemRow({ item, first }: { item: LineItem; first: boolean }) {
  const cell = { justifyContent: 'center' as const, paddingHorizontal: 5, paddingVertical: 3 }
  return (
    <View style={{ flexDirection: 'row', minHeight: 41.4, ...(first ? {} : { borderTopWidth: 0.5, ...BORDER }) }}>
      <View style={{ ...cell, width: COLS[0], borderRightWidth: 0.5, ...BORDER }}>
        <DescriptionCell item={item} />
      </View>
      <View style={{ ...cell, width: COLS[1] }}>
        {item.qty.map((l, i) => (
          <Rich key={i} line={l} size={14} smallSize={9} />
        ))}
      </View>
    </View>
  )
}

function GroupRow({ group, split }: { group: PriceGroup; split: Split }) {
  const amount = { fontSize: 12, textAlign: 'center' as const, lineHeight: 1.38 }
  return (
    <View
      wrap={false}
      style={{ flexDirection: 'row', backgroundColor: C.tableFill, borderBottomWidth: 0.5, ...BORDER }}
    >
      <View style={{ width: COLS[0] + COLS[1], borderRightWidth: 0.5, ...BORDER }}>
        {group.items.map((it, i) => (
          <ItemRow key={it.id} item={it} first={i === 0} />
        ))}
      </View>
      <View style={{ width: COLS[2], justifyContent: 'center', borderRightWidth: 0.5, ...BORDER }}>
        <Text style={{ fontSize: 14, textAlign: 'center' }}>{group.unitPriceLabel}</Text>
      </View>
      <View style={{ width: COLS[3], justifyContent: 'center', paddingVertical: 2 }}>
        <Text style={amount}>Material: {formatMoney(split.materialCents)}</Text>
        <Text style={amount}>Labor: {formatMoney(split.laborCents)}</Text>
        <Text style={{ ...amount, fontWeight: 'bold' }}>Total: {formatMoney(split.totalCents)}</Text>
      </View>
    </View>
  )
}

function PriceTable({ section, splits }: { section: LumpSumSection; splits: Split[] }) {
  const head = ['DESCRIPTION', 'QTY/UNIT', 'UNIT PRICE', 'AMOUNT']
  return (
    <View style={{ marginLeft: TABLE_LEFT, width: COLS.reduce((a, b) => a + b, 0) }}>
      <View
        wrap={false}
        style={{ flexDirection: 'row', height: 34.6, backgroundColor: C.navy, borderWidth: 0.5, ...BORDER }}
        minPresenceAhead={60}
      >
        {head.map((h, i) => (
          <View
            key={h}
            style={{
              width: COLS[i] - (i === 0 ? 0.5 : 0) - (i === 3 ? 0.5 : 0),
              justifyContent: 'center',
              ...(i < 3 ? { borderRightWidth: 0.5, ...BORDER } : {}),
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' }}>{h}</Text>
          </View>
        ))}
      </View>
      {section.groups.map((g, i) => (
        <GroupRow key={g.id} group={g} split={splits[i]} />
      ))}
    </View>
  )
}

// ───────────────────────── B2B y nota ─────────────────────────

function B2BLine({ cents }: { cents: number }) {
  return (
    <View
      wrap={false}
      style={{
        marginTop: 18.4,
        width: 467.6,
        height: 34.2,
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ flexDirection: 'row', width: 342, alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>B2B 4% </Text>
        <View style={{ flex: 1, height: 11, overflow: 'hidden' }}>
          <Text style={{ fontSize: 7, letterSpacing: 0.2, lineHeight: 1 }}>{'.'.repeat(260)}</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: 'bold' }}> {formatMoney(cents)}</Text>
      </View>
    </View>
  )
}

// ───────────────────────── Sección ─────────────────────────

function Section({
  section,
  splits,
  b2bCents,
  first,
}: {
  section: LumpSumSection
  splits: Split[]
  b2bCents: number
  first: boolean
}) {
  return (
    <View>
      <Text style={{ fontWeight: 'bold', marginLeft: 22.6, marginTop: first ? 7.8 : 65, fontSize: 11, lineHeight: 1.2 }}>
        TO BE PERFORMED:
      </Text>
      <Text style={{ marginLeft: 36, marginTop: 6.9, fontSize: 11, lineHeight: 1.45 }}>{section.toBePerformed}</Text>
      <Text
        style={{ fontWeight: 'bold', marginLeft: 22.6, marginTop: first ? 12.7 : 30, marginBottom: 8.4, fontSize: 11, lineHeight: 1.2 }}
        minPresenceAhead={40}
      >
        SCOPE OF WORK:
      </Text>
      <ScopeList items={section.scope} layout={SCOPE_LAYOUT} />
      <View style={{ height: 0.5 }} />
      <PriceTable section={section} splits={splits} />
      <B2BLine cents={b2bCents} />
      {section.note ? (
        <Text style={{ marginTop: 38, fontSize: 11, lineHeight: 1.2 }} wrap={false}>
          <Text style={{ fontWeight: 'bold' }}>Note:</Text> {section.note}
        </Text>
      ) : null}
    </View>
  )
}

export function LumpSumDocument({ quote, assets }: { quote: LumpSumQuote; assets: PdfAssets }) {
  const result = computeLumpSum(quote)
  return (
    <Document title={quote.header.projectArea} author="ETS Corp." creator="ETS Cotizaciones">
      {quote.sections.map((section, i) => (
        <ClassicPage key={section.id} quote={quote} assets={assets}>
          {i === 0 ? (
            <>
              <ProjectBar quote={quote} />
              <Text style={{ marginTop: 11.5, fontSize: 11, lineHeight: 1.2 }}>{OPENING}</Text>
            </>
          ) : null}
          <Section section={section} splits={result.sections[i].groups} b2bCents={result.sections[i].b2bCents} first={i === 0} />
        </ClassicPage>
      ))}
      <ClassicTermsPage quote={quote} assets={assets} />
    </Document>
  )
}
