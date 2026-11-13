/**
 * Diseño Time & Material (ejemplo 348-26 REV II): fuente tipo Calibri, tablas con líneas.
 */
import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { brand } from '../domain/brand.ts'
import { areaQtyLabel, computeTm, positionHours } from '../domain/calc/tm.ts'
import { formatLongDate, quoteNumberOf } from '../domain/format.ts'
import { formatMoney } from '../domain/money.ts'
import type { TmQuote } from '../domain/types.ts'
import { FONT } from './fonts.ts'
import { ScopeList, SignatureBlock, TermsBlock, type PdfAssets } from './shared.tsx'

const C = brand.colors
const LINE = '#808080'
const M = 54
const W = 504
const TITLE = 'ETS CORP.  T & M   P R O P O S A L'
const base = { fontFamily: FONT.tm, fontSize: 10 }

// ───────────────────────── Encabezado y pie ─────────────────────────

function HeaderRow({ label, children, last }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 0.6, borderColor: LINE, minHeight: 17.2, ...(last ? {} : {}) }}>
      <View style={{ width: 100.6, paddingLeft: 4.5, justifyContent: 'center' }}>
        <Text style={base}>{label}</Text>
      </View>
      <View style={{ flex: 1, paddingLeft: 4.1, justifyContent: 'center', paddingVertical: 2 }}>{children}</View>
    </View>
  )
}

function TmHeader({ quote, assets }: { quote: TmQuote; assets: PdfAssets }) {
  const h = quote.header
  return (
    <View fixed style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180 }}>
      <View
        render={({ pageNumber }) =>
          pageNumber === 1 ? (
            <View style={{ position: 'absolute', left: M, top: 35.9, width: W, height: 32.6 }}>
              <View style={{ height: 4.5, backgroundColor: C.tmTopBar }} />
              <View style={{ height: 28.1, backgroundColor: '#a8a8a8', justifyContent: 'center' }}>
                <Text style={{ ...base, fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>{TITLE}</Text>
              </View>
            </View>
          ) : null
        }
      />
      {/* En las páginas 2+ no hay barra de título y el bloque sube 46 pt (como el original) */}
      <View
        render={(p) => {
          // react-pdf sí pasa totalPages a View.render, aunque sus tipos no lo declaran
          const { pageNumber, totalPages } = p as unknown as { pageNumber: number; totalPages: number }
          const dy = pageNumber === 1 ? 0 : -46
          return (
            <>
              <Image src={assets.logo} style={{ position: 'absolute', left: 54.5, top: 93 + dy, width: 159, height: 79.5 }} />
              <View style={{ position: 'absolute', left: 274, top: 83.7 + dy, width: 284.1, borderTopWidth: 0, borderColor: LINE }}>
                <HeaderRow label="Date:">
                  <Text style={base}>{formatLongDate(h.date)}</Text>
                </HeaderRow>
                <HeaderRow label="Quote No.:">
                  <Text style={{ ...base, fontWeight: 'bold' }}>{quoteNumberOf(quote)}</Text>
                </HeaderRow>
                <HeaderRow label="Contact:">
                  <Text style={base}>{h.contact}</Text>
                </HeaderRow>
                <HeaderRow label="Contractor:">
                  <Text style={base}>{h.contractor}</Text>
                </HeaderRow>
                <HeaderRow label="Proposal Type:" last>
                  <Text style={{ ...base, lineHeight: 1.22 }}>Time &amp; Material</Text>
                  <Text style={{ ...base, lineHeight: 1.22 }}>{`Page ${pageNumber} of ${totalPages}`}</Text>
                </HeaderRow>
              </View>
            </>
          )
        }}
      />
    </View>
  )
}

function TmFooter({ initials }: { initials: string }) {
  const t = { ...base, fontWeight: 'bold' as const, color: LINE }
  return (
    <View fixed style={{ position: 'absolute', left: 0, right: 0, top: 730.2 }}>
      <View style={{ marginLeft: 52.4, width: 507.2, height: 0.6, backgroundColor: '#a8a8a8' }} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 3.4, paddingLeft: 3 }}>
        <Text style={t}>PO Box 6810 Caguas, PR 00726-6810</Text>
        <Text style={{ ...t, marginLeft: 27 }}>Tel. 787.747.1690</Text>
        <Text style={{ ...t, marginLeft: 27 }}>Fax 787.747.3153</Text>
      </View>
      <Text style={{ ...base, fontSize: 8, fontWeight: 'bold', color: C.initials, position: 'absolute', right: 612 - 560.4, top: 14.9 }}>
        {initials}
      </Text>
    </View>
  )
}

function ProjectBox({ quote }: { quote: TmQuote }) {
  return (
    <View style={{ flexDirection: 'row', marginTop: 1.9, borderTopWidth: 0.6, borderBottomWidth: 0.6, borderColor: LINE, minHeight: 29.3 }}>
      <View style={{ width: 280, borderRightWidth: 0.6, borderColor: LINE, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 2 }}>
        <Text style={{ ...base, fontSize: 9.5, textAlign: 'center', lineHeight: 1.18 }}>
          Project/Area: <Text style={{ fontWeight: 'bold' }}>{quote.header.projectArea.toUpperCase()}</Text>
        </Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 6 }}>
        <Text style={{ ...base, textAlign: 'center' }}>
          Location: <Text style={{ fontWeight: 'bold' }}>{quote.header.location}</Text>
        </Text>
      </View>
    </View>
  )
}

// ───────────────────────── Tablas ─────────────────────────

type Align = 'left' | 'center' | 'right'
interface Col {
  w: number
  align: Align
}

function TRow({
  cols,
  cells,
  kind = 'body',
  zebra,
}: {
  cols: Col[]
  cells: ReactNode[]
  kind?: 'head' | 'body' | 'total' | 'grand'
  zebra?: boolean
}) {
  const bg =
    kind === 'head' || kind === 'grand' ? C.tmHeader : kind === 'total' ? C.tmTotalFill : zebra ? C.tmZebra : '#fff'
  const color = kind === 'head' || kind === 'grand' ? '#fff' : '#000'
  const bold = kind !== 'body'
  return (
    <View wrap={false} style={{ flexDirection: 'row', backgroundColor: bg, borderBottomWidth: 0.6, borderColor: LINE }}>
      {cols.map((c, i) => (
        <View
          key={i}
          style={{
            width: c.w,
            minHeight: 17.7,
            justifyContent: 'center',
            paddingHorizontal: 4.5,
            paddingVertical: 2.5,
            borderLeftWidth: i === 0 ? 0.6 : 0,
            borderRightWidth: 0.6,
            borderColor: LINE,
          }}
        >
          <Text
            style={{
              ...base,
              color,
              fontWeight: bold ? 'bold' : 'normal',
              textAlign: kind === 'head' ? 'center' : c.align,
              lineHeight: 1.2,
            }}
          >
            {cells[i]}
          </Text>
        </View>
      ))}
    </View>
  )
}

function Table({ cols, head, rows, children }: { cols: Col[]; head: string[]; rows?: ReactNode[][]; children?: ReactNode }) {
  return (
    <View style={{ borderTopWidth: 0.6, borderColor: LINE, width: cols.reduce((a, c) => a + c.w, 0) }}>
      <TRow cols={cols} cells={head} kind="head" />
      {rows?.map((r, i) => <TRow key={i} cols={cols} cells={r} zebra={i % 2 === 1} />)}
      {children}
    </View>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={{ ...base, fontSize: 10.6, fontWeight: 'bold', marginTop: 10.5, marginBottom: 5 }} minPresenceAhead={80}>
      {children}
    </Text>
  )
}

const fmtNum = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })

// ───────────────────────── Documento ─────────────────────────

export function TmDocument({ quote, assets }: { quote: TmQuote; assets: PdfAssets }) {
  const r = computeTm(quote)
  const page = { paddingTop: 182, paddingBottom: 70, paddingHorizontal: M, ...base }
  const laborCols: Col[] = [
    { w: 174.2, align: 'left' },
    { w: 60, align: 'center' },
    { w: 75, align: 'center' },
    { w: 90, align: 'center' },
    { w: 104.8, align: 'right' },
  ]
  const schedCols: Col[] = [
    { w: 50.2, align: 'left' },
    { w: 269, align: 'center' },
    { w: 117.8, align: 'center' },
    { w: 67, align: 'center' },
  ]
  const matCols: Col[] = [
    { w: 214, align: 'left' },
    { w: 45, align: 'center' },
    { w: 45, align: 'center' },
    { w: 90, align: 'right' },
    { w: 110, align: 'right' },
  ]
  const areaCols: Col[] = [
    { w: 184, align: 'left' },
    { w: 70, align: 'center' },
    { w: 80, align: 'right' },
    { w: 80, align: 'right' },
    { w: 90, align: 'right' },
  ]
  const sumCols: Col[] = [
    { w: 190, align: 'left' },
    { w: 110, align: 'right' },
  ]
  const hours = r.hours

  return (
    <Document title={quote.header.projectArea} author="ETS Corp." creator="ETS Cotizaciones">
      <Page size="LETTER" style={page}>
        <TmHeader quote={quote} assets={assets} />
        <ProjectBox quote={quote} />
        <Text style={{ marginTop: 10, fontSize: 10, lineHeight: 1.2 }}>
          We are pleased to present our Time &amp; Material (T&amp;M) proposal for the reference project.
        </Text>
        <Text style={{ fontSize: 10.6, fontWeight: 'bold', marginTop: 9.5 }}>TO BE PERFORMED:</Text>
        <Text style={{ marginLeft: 13.6, marginTop: 4.5, fontSize: 10, lineHeight: 1.2 }}>{quote.toBePerformed}</Text>
        <Text style={{ fontSize: 10.6, fontWeight: 'bold', marginTop: 9.5, marginBottom: 3.3 }} minPresenceAhead={30}>
          SCOPE OF WORK:
        </Text>
        <ScopeList
          items={quote.scope}
          layout={{ fontFamily: FONT.tm, fontSize: 10, lineHeight: 12.2, gap: 2, textIndent: 17.2, bulletGap: 9, levelIndent: 34 }}
        />

        <View wrap={false}>
          <SectionTitle>1. ESTIMATED LABOR</SectionTitle>
          <Table
            cols={laborCols}
            head={['POSITION', 'QTY', 'EST. HOURS', 'RATE / HR', 'AMOUNT']}
            rows={quote.labor.map((p, i) => [
              p.name,
              fmtNum(p.qty),
              fmtNum(positionHours(p, hours)),
              formatMoney(p.rateCents),
              formatMoney(r.labor.rows[i].amountCents),
            ])}
          >
            <TRow
              cols={laborCols}
              kind="total"
              cells={['Total Estimated Labor', fmtNum(r.labor.totalQty), fmtNum(r.labor.totalHours), '', formatMoney(r.labor.totalCents)]}
            />
          </Table>
        </View>

        <View wrap={quote.schedule.length > 20}>
          <SectionTitle>2. ESTIMATED WORK SCHEDULE</SectionTitle>
          {quote.scheduleIntro ? (
            <Text style={{ fontSize: 9, fontStyle: 'italic', marginTop: -1.5, marginBottom: 5 }}>{quote.scheduleIntro}</Text>
          ) : null}
          <Table
            cols={schedCols}
            head={['DAY', 'ACTIVITY', 'CREW', 'HOURS']}
            rows={quote.schedule.map((s) => [
              s.day,
              s.activity,
              s.crew,
              s.kind === 'crew' ? `${fmtNum(s.supervisorHours)} / ${fmtNum(s.laborHours)}` : `${fmtNum(s.hours)} (PM)`,
            ])}
          />
        </View>

        <View wrap={quote.materials.length > 20} break={false}>
          <SectionTitle>3. ESTIMATED MATERIALS &amp; EQUIPMENT</SectionTitle>
          <Table
            cols={matCols}
            head={['DESCRIPTION', 'QTY', 'UNIT', 'UNIT PRICE', 'AMOUNT']}
            rows={quote.materials.map((m, i) => [m.description, m.qty, m.unit, formatMoney(m.unitPriceCents), formatMoney(r.materials.amounts[i])])}
          >
            <TRow
              cols={matCols}
              kind="total"
              cells={['Total Estimated Materials & Equipment', '', '', '', formatMoney(r.materials.totalCents)]}
            />
          </Table>
        </View>

        {quote.areas.length > 0 ? (
          <View wrap={false}>
            <SectionTitle>4. ALLOCATION BY AREA</SectionTitle>
            <Table
              cols={areaCols}
              head={['AREA', 'QTY/UNIT', 'MATERIAL', 'LABOR', 'TOTAL']}
              rows={quote.areas.map((a, i) => [
                a.name,
                areaQtyLabel(a),
                formatMoney(r.areas.rows[i].materialCents),
                formatMoney(r.areas.rows[i].laborCents),
                formatMoney(r.areas.rows[i].totalCents),
              ])}
            >
              <TRow
                cols={areaCols}
                kind="total"
                cells={['Total', '', formatMoney(r.materials.totalCents), formatMoney(r.labor.totalCents), formatMoney(r.subtotalCents)]}
              />
            </Table>
          </View>
        ) : null}

        <View wrap={false}>
          <SectionTitle>{`${quote.areas.length > 0 ? 5 : 4}. ESTIMATED T&M SUMMARY`}</SectionTitle>
          <View style={{ borderTopWidth: 0.6, borderColor: LINE, width: 300 }}>
            <TRow cols={sumCols} cells={['Estimated Labor', formatMoney(r.labor.totalCents)]} />
            <TRow cols={sumCols} cells={['Estimated Materials & Equipment', formatMoney(r.materials.totalCents)]} />
            <TRow cols={sumCols} kind="total" cells={['Subtotal', formatMoney(r.subtotalCents)]} />
            <TRow cols={sumCols} cells={[<Text key="b" style={{ fontWeight: 'bold' }}>B2B 4% (on labor)</Text>, <Text key="v" style={{ fontWeight: 'bold' }}>{formatMoney(r.b2bCents)}</Text>]} />
            <TRow cols={sumCols} kind="grand" cells={['ESTIMATED TOTAL', formatMoney(r.totalCents)]} />
          </View>
        </View>

        <TmFooter initials={quote.preparedBy.initials} />
      </Page>

      <Page size="LETTER" style={page}>
        <TmHeader quote={quote} assets={assets} />
        <Text style={{ fontFamily: FONT.body, fontWeight: 'bold', fontSize: 12, marginTop: 3, marginBottom: 2 }}>
          Terms &amp; Conditions
        </Text>
        <TermsBlock
          lines={quote.terms.lines}
          layout={{ fontFamily: FONT.body, fontSize: 10.5, lineHeight: 13.7, bulletIndent: 18, textIndent: 36, noBulletIndent: 0 }}
        />
        <View style={{ marginTop: 4 }}>
          <SignatureBlock
            name={quote.signer.name}
            position={quote.signer.position}
            signatureFont={quote.signer.signatureFont}
            fontFamily={FONT.body}
          />
        </View>
        <TmFooter initials={quote.preparedBy.initials} />
      </Page>
    </Document>
  )
}
