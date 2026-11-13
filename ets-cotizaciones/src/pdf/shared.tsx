import { Link, Path, Rect, Svg, Text, View } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/stylesheet'
import { brand } from '../domain/brand.ts'
import type { ScopeItem, TermsLine } from '../domain/types.ts'
import { signatureFontOf } from './signatureFonts.ts'

/** Recursos que dependen del entorno (URL en navegador, ruta en Node). */
export interface PdfAssets {
  logo: string
}

// ───────────────────────── Viñetas ─────────────────────────

/** ▪ dibujado como un cuadrado (las fuentes libres no traen el glifo de Wingdings). */
export function SquareBullet({ size = 3.6, color = '#000' }: { size?: number; color?: string }) {
  return <View style={{ width: size, height: size, backgroundColor: color }} />
}

/** Viñeta de lista: ocupa el alto de la primera línea y centra el símbolo. */
export function BulletBox({
  level,
  lineHeight,
  fontSize,
  fontFamily,
  color,
}: {
  level: 1 | 2 | 3
  lineHeight: number
  fontSize: number
  fontFamily: string
  color?: string
}) {
  return (
    <View style={{ height: lineHeight, justifyContent: 'center' }}>
      {level === 1 ? (
        <SquareBullet size={fontSize * 0.33} color={color} />
      ) : (
        <Text style={{ fontFamily: level === 2 ? 'Courier' : fontFamily, fontSize, lineHeight: 1 }}>
          {level === 2 ? 'o' : '-'}
        </Text>
      )}
    </View>
  )
}

// ───────────────────────── Scope of Work ─────────────────────────

export interface ScopeLayout {
  fontFamily: string
  fontSize: number
  lineHeight: number
  /** Separación entre líneas del scope */
  gap: number
  /** Sangría del texto de nivel 1 (desde el margen) */
  textIndent: number
  /** Distancia viñeta → texto */
  bulletGap: number
  /** Sangría adicional por nivel */
  levelIndent: number
}

export function ScopeList({ items, layout }: { items: ScopeItem[]; layout: ScopeLayout }) {
  const { fontFamily, fontSize, lineHeight, gap, textIndent, bulletGap, levelIndent } = layout
  return (
    <View>
      {items.map((item) => {
        const indent = textIndent + levelIndent * (item.level - 1)
        return (
          <View key={item.id} style={{ flexDirection: 'row', marginBottom: gap }} wrap={false}>
            <View style={{ width: indent, alignItems: 'flex-start', paddingLeft: indent - bulletGap }}>
              <BulletBox level={item.level} lineHeight={lineHeight} fontSize={fontSize} fontFamily={fontFamily} />
            </View>
            <Text style={{ flex: 1, fontFamily, fontSize, lineHeight: lineHeight / fontSize }}>{item.text}</Text>
          </View>
        )
      })}
    </View>
  )
}

// ───────────────────────── Términos y condiciones ─────────────────────────

export interface TermsLayout {
  fontFamily: string
  fontSize: number
  lineHeight: number
  bulletIndent: number
  textIndent: number
  /** Sangría de las líneas sin viñeta ("Important Note") */
  noBulletIndent: number
}

const LINK_COLOR = '#0462c1'

export function TermsBlock({ lines, layout }: { lines: TermsLine[]; layout: TermsLayout }) {
  const { fontFamily, fontSize, lineHeight, bulletIndent, textIndent, noBulletIndent } = layout
  return (
    <View>
      {lines.map((line) => {
        const size = line.size === 'large' ? fontSize + 1 : fontSize
        const lh = line.size === 'large' ? lineHeight * 1.1 : lineHeight
        const text = (
          <Text style={{ flex: 1, fontFamily, fontSize: size, lineHeight: lh / size, textAlign: 'justify' }}>
            {line.runs.map((r, i) => {
              const style: Style = {
                fontWeight: r.bold ? 'bold' : 'normal',
                fontStyle: r.italic ? 'italic' : 'normal',
                color: r.color ?? '#000',
              }
              return r.href ? (
                <Link key={i} src={r.href} style={{ ...style, color: LINK_COLOR, textDecoration: 'underline' }}>
                  {r.text}
                </Link>
              ) : (
                <Text key={i} style={style}>
                  {r.text}
                </Text>
              )
            })}
          </Text>
        )
        return line.bullet ? (
          <View key={line.id} style={{ flexDirection: 'row' }} wrap={false}>
            <View style={{ width: textIndent, paddingLeft: bulletIndent }}>
              <View style={{ height: lineHeight, justifyContent: 'center' }}>
                <SquareBullet size={fontSize * 0.33} color={line.bulletColor ?? '#000'} />
              </View>
            </View>
            {text}
          </View>
        ) : (
          <View key={line.id} style={{ flexDirection: 'row', paddingLeft: noBulletIndent }} wrap={false}>
            {text}
          </View>
        )
      })}
    </View>
  )
}

// ───────────────────────── Firma ─────────────────────────

export function SignatureBlock({
  name,
  position,
  signatureFont,
  fontFamily,
}: {
  name: string
  position: string
  signatureFont: string
  fontFamily: string
}) {
  const sig = signatureFontOf(signatureFont)
  return (
    <View style={{ alignItems: 'flex-end' }} wrap={false}>
      <Text style={{ fontFamily, fontSize: 10 }}>Acknowledge by:</Text>
      <Text style={{ fontFamily: sig.family, fontSize: sig.size, lineHeight: 1.25, marginVertical: 1 }}>{name}</Text>
      <Text style={{ fontFamily, fontSize: 10 }}>{position}</Text>
    </View>
  )
}

// ───────────────────────── Iconos del pie de página ─────────────────────────

/** Teléfono de escritorio (dibujado, sin fuentes de símbolos). */
export function PhoneIcon({ size = 20, color = brand.colors.footerText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * 0.82} viewBox="0 0 24 20">
      <Path
        d="M2 6.2 C2 3.5 7 1.8 12 1.8 C17 1.8 22 3.5 22 6.2 L22 8 C22 8.6 21.5 9 20.9 9 L17.6 9 C17 9 16.6 8.6 16.6 8 L16.6 6.6 C14 5.9 10 5.9 7.4 6.6 L7.4 8 C7.4 8.6 7 9 6.4 9 L3.1 9 C2.5 9 2 8.6 2 8 Z"
        fill={color}
      />
      <Path d="M8.5 7.5 L15.5 7.5 L19.5 12.5 L19.5 19.5 L4.5 19.5 L4.5 12.5 Z" fill={color} />
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((c) => <Rect key={`${r}${c}`} x={8.6 + c * 2.6} y={11 + r * 2.6} width={1.5} height={1.5} fill="#fff" />),
      )}
    </Svg>
  )
}

/** Fax (dibujado). */
export function FaxIcon({ size = 20, color = brand.colors.footerText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * 0.95} viewBox="0 0 24 23">
      <Path d="M6 1 L15 1 L18 4 L18 9 L6 9 Z" fill={color} />
      <Rect x={8} y={3.5} width={6} height={1} fill="#fff" />
      <Rect x={8} y={5.6} width={8} height={1} fill="#fff" />
      <Path d="M1 10 L23 10 L23 22 L1 22 Z" fill={color} />
      <Rect x={4} y={13} width={16} height={1.6} fill="#fff" />
      <Rect x={4} y={17} width={3} height={1.6} fill="#fff" />
      <Rect x={9} y={17} width={3} height={1.6} fill="#fff" />
    </Svg>
  )
}
