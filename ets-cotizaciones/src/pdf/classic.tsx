/**
 * Diseño "clásico" (Lump Sum y Premium Time), copiado de las plantillas de Word.
 * Medidas en puntos, tomadas de referencia/ejemplos/*.pdf (carta 612 × 792).
 */
import { Image, Page, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { brand } from '../domain/brand.ts'
import { formatLongDate, quoteNumberOf } from '../domain/format.ts'
import type { Quote } from '../domain/types.ts'
import { FONT } from './fonts.ts'
import { FaxIcon, PhoneIcon, SignatureBlock, TermsBlock, type PdfAssets } from './shared.tsx'

const C = brand.colors
export const CLASSIC = {
  marginX: 72,
  contentBottom: 77,
  fontSize: 11,
}

// ───────────────────────── Encabezado ─────────────────────────

function DataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 4.6 }}>
      <Text style={{ width: 91.3, fontFamily: FONT.body, fontSize: 11, lineHeight: 1.22 }}>{label}</Text>
      <View style={{ width: 150 }}>{children}</View>
    </View>
  )
}

const value = { fontFamily: FONT.body, fontSize: 11, lineHeight: 1.22 }

/** Título blanco con contorno azul claro (efecto de Word). */
function TitleText({ title }: { title: string }) {
  const base = { fontFamily: FONT.title, fontWeight: 'bold' as const, fontSize: 24, textAlign: 'center' as const }
  const halo = '#b4c6e7'
  const offsets = [
    [-0.7, 0],
    [0.7, 0],
    [0, -0.7],
    [0, 0.7],
  ]
  return (
    <View style={{ position: 'absolute', left: 61.6, top: 21.8, width: 488.6, height: 33.8 }}>
      {offsets.map(([dx, dy], i) => (
        <Text key={i} style={{ ...base, color: halo, position: 'absolute', left: dx, top: 2.4 + dy, width: 488.6 }}>
          {title}
        </Text>
      ))}
      <Text style={{ ...base, color: '#fff', position: 'absolute', left: 0, top: 2.4, width: 488.6 }}>{title}</Text>
    </View>
  )
}

/**
 * Encabezado repetido en cada página. Va en el flujo (no absoluto) para que, si un dato
 * ocupa dos líneas (ej. un Contractor largo), todo lo de abajo baje igual que en Word.
 */
export function ClassicHeader({ quote, assets }: { quote: Quote; assets: PdfAssets }) {
  const h = quote.header
  return (
    <View fixed style={{ marginHorizontal: -CLASSIC.marginX }}>
      <View style={{ position: 'absolute', left: 70.6, top: 13.6, width: 470.9, height: 13.3, backgroundColor: C.navy }} />
      <View style={{ position: 'absolute', left: 61.6, top: 21.8, width: 488.6, height: 33.8, backgroundColor: C.titleBar }} />
      <TitleText title={quote.title} />
      <Image src={assets.logo} style={{ position: 'absolute', left: 72, top: 64, width: 150, height: 75 }} />
      <View style={{ marginLeft: 301.2, marginTop: 67.2 }}>
        <DataRow label="Date:">
          <Text style={value}>{formatLongDate(h.date)}</Text>
        </DataRow>
        <DataRow label="Quote No.:">
          <Text style={value}>{quoteNumberOf(quote)}</Text>
        </DataRow>
        <DataRow label="Contact:">
          <Text style={value}>{h.contact}</Text>
        </DataRow>
        <DataRow label="Contractor:">
          <Text style={value}>{h.contractor}</Text>
        </DataRow>
        <DataRow label="Page:">
          <View
            // react-pdf sí pasa totalPages a View.render, aunque sus tipos no lo declaran
            render={(p) => {
              const { pageNumber, totalPages } = p as unknown as { pageNumber: number; totalPages: number }
              return (
              <Text style={{ ...value, paddingLeft: 2.6 }}>
                <Text style={{ fontWeight: 'bold' }}>{pageNumber}</Text> of{' '}
                <Text style={{ fontWeight: 'bold' }}>{totalPages}</Text>
              </Text>
              )
            }}
          />
        </DataRow>
      </View>
      {/* Línea bajo el encabezado (en la página 1 la reemplaza la barra Project/Area) */}
      <View
        style={{ position: 'absolute', left: 70.6, bottom: -5.2, width: 470.9, height: 0.7 }}
        render={({ pageNumber }) =>
          pageNumber === 1 ? null : <View style={{ width: 470.9, height: 0.7, backgroundColor: '#000' }} />
        }
      />
    </View>
  )
}

/** Barra "Project/Area | Location" (solo página 1, va en el flujo del contenido). */
export function ProjectBar({ quote }: { quote: Quote }) {
  const line = '#7e7f7e'
  const cell = { justifyContent: 'center' as const, alignItems: 'center' as const, paddingVertical: 4, paddingHorizontal: 5 }
  return (
    <View
      style={{
        flexDirection: 'row',
        marginTop: 0.5,
        marginLeft: 0,
        width: 486.7,
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: line,
      }}
    >
      <View style={{ ...cell, width: 247.4, borderRightWidth: 0.5, borderColor: line }}>
        <Text style={{ fontFamily: FONT.body, fontSize: 11, textAlign: 'center', lineHeight: 1.2 }}>
          Project/Area: <Text style={{ fontWeight: 'bold' }}>{quote.header.projectArea.toUpperCase()}</Text>
        </Text>
      </View>
      <View style={{ ...cell, flex: 1 }}>
        <Text style={{ fontFamily: FONT.body, fontSize: 11, textAlign: 'center', lineHeight: 1.2 }}>
          Location: <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{quote.header.location}</Text>
        </Text>
      </View>
    </View>
  )
}

// ───────────────────────── Pie de página ─────────────────────────

export function ClassicFooter({ initials }: { initials: string }) {
  const big = { fontFamily: FONT.footer, fontWeight: 'bold' as const, fontSize: 11, color: C.footerText }
  const small = { ...big, fontSize: 8.6, letterSpacing: 0.3 }
  return (
    <View fixed style={{ position: 'absolute', left: 0, right: 0, top: 724, height: 40 }}>
      <View style={{ position: 'absolute', left: 103, top: 3, flexDirection: 'row', alignItems: 'flex-end' }}>
        <Text style={big}>PO Box </Text>
        <Text style={small}>6810 </Text>
        <Text style={big}>Caguas</Text>
        <Text style={small}>, </Text>
        <Text style={big}>PR </Text>
        <Text style={small}>00726-6810</Text>
      </View>
      <View style={{ position: 'absolute', left: 316, top: -1.5, flexDirection: 'row', alignItems: 'flex-end' }}>
        <PhoneIcon size={21} />
        <Text style={{ ...small, marginLeft: 2, marginBottom: 1 }}>787.747.1690</Text>
      </View>
      <View style={{ position: 'absolute', left: 422, top: -2.5, flexDirection: 'row', alignItems: 'flex-end' }}>
        <FaxIcon size={20} />
        <Text style={{ ...small, marginLeft: 3, marginBottom: 1 }}>787.747.3153</Text>
      </View>
      <Text
        style={{
          position: 'absolute',
          right: 612 - 542.6,
          top: 20.8,
          fontFamily: FONT.body,
          fontWeight: 'bold',
          fontSize: 11,
          color: C.initials,
        }}
      >
        {initials}
      </Text>
    </View>
  )
}

// ───────────────────────── Página genérica y términos ─────────────────────────

export function ClassicPage({ quote, assets, children }: { quote: Quote; assets: PdfAssets; children: ReactNode }) {
  return (
    <Page
      size="LETTER"
      style={{
        paddingBottom: CLASSIC.contentBottom,
        paddingHorizontal: CLASSIC.marginX,
        fontFamily: FONT.body,
        fontSize: CLASSIC.fontSize,
      }}
    >
      <ClassicHeader quote={quote} assets={assets} />
      {children}
      <ClassicFooter initials={quote.preparedBy.initials} />
    </Page>
  )
}

export function ClassicTermsPage({ quote, assets }: { quote: Quote; assets: PdfAssets }) {
  return (
    <ClassicPage quote={quote} assets={assets}>
      <Text style={{ fontWeight: 'bold', fontSize: 12, marginTop: 16.7, marginBottom: 9 }}>Terms &amp; Conditions</Text>
      <TermsBlock
        lines={quote.terms.lines}
        layout={{ fontFamily: FONT.body, fontSize: 11, lineHeight: 15.2, bulletIndent: 18, textIndent: 36, noBulletIndent: 36 }}
      />
      <View style={{ marginTop: 8, marginRight: -3.7 }}>
        <SignatureBlock
          name={quote.signer.name}
          position={quote.signer.position}
          signatureFont={quote.signer.signatureFont}
          fontFamily={FONT.body}
        />
      </View>
    </ClassicPage>
  )
}

export const OPENING = 'We are pleased to present our proposal for the reference project.'
