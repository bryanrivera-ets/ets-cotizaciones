import type { Cents } from './money.ts'

// ───────────────────────── Texto con formato ─────────────────────────

/** Fragmento de texto con formato (términos y condiciones). */
export interface TextRun {
  text: string
  bold?: boolean
  italic?: boolean
  /** Color hex, ej. "#ff0000" */
  color?: string
  /** Enlace (ej. "mailto:estimados@etspr.com") */
  href?: string
}

/** Una línea de términos y condiciones. */
export interface TermsLine {
  id: string
  runs: TextRun[]
  /** false = sin viñeta (ej. "Important Note…") */
  bullet: boolean
  /** Color de la viñeta (en los ejemplos la de "Quotation valid…" es azul) */
  bulletColor?: string
  /** "large" para "Important Note" */
  size?: 'normal' | 'large'
}

export interface TermsVersion {
  id: string
  name: string
  lines: TermsLine[]
}

// ───────────────────────── Perfiles y firmantes ─────────────────────────

export type ProposalTitle = 'ETS CORP. P R O P O S A L' | 'P R O P O S A L'
export const TM_TITLE = 'ETS CORP. T & M P R O P O S A L'

export interface Signer {
  id: string
  name: string
  position: string
  /** Fuente manuscrita de la firma (cada firmante tiene la suya) */
  signatureFont: string
}

export interface UserProfile {
  id: string
  name: string
  initials: string
  preferredTitle: ProposalTitle
  preferredTermsId: string
  defaultSignerId: string
}

// ───────────────────────── Scope / sistemas ─────────────────────────

/** Nivel 1 = ▪, nivel 2 = o, nivel 3 = - */
export type ScopeLevel = 1 | 2 | 3
export const SCOPE_BULLETS: Record<ScopeLevel, string> = { 1: '▪', 2: 'o', 3: '-' }

export interface ScopeItem {
  id: string
  text: string
  level: ScopeLevel
}

export interface SystemTemplate {
  id: string
  name: string
  toBePerformed: string
  scope: ScopeItem[]
}

// ───────────────────────── Numeración ─────────────────────────

export interface QuoteNumber {
  /** Secuencia del año (49 → "049"). null = borrador sin número oficial. */
  seq: number | null
  /** Año completo (2026 → "26") */
  year: number
  /** 0 = original, 1 = REV I, 2 = REV II… */
  revision: number
}

// ───────────────────────── Cotización: datos comunes ─────────────────────────

export type QuoteType = 'lumpSum' | 'premiumTime' | 'tm'
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected'

export interface QuoteHeader {
  /** Fecha ISO "2026-06-01" */
  date: string
  contact: string
  /** Email del contacto (para enviar la cotización; no sale en el PDF) */
  contactEmail?: string
  contractor: string
  projectArea: string
  location: string
}

interface QuoteBase {
  id: string
  type: QuoteType
  number: QuoteNumber
  /** Id temporal mientras no hay número oficial (offline) */
  tempId?: string
  status: QuoteStatus
  header: QuoteHeader
  /** Título de la barra gris (T&M siempre usa TM_TITLE) */
  title: ProposalTitle
  /** Copias congeladas al momento de crear la cotización */
  preparedBy: { name: string; initials: string }
  signer: Signer
  terms: TermsVersion
  /** Nombre del PDF; vacío = nombre por defecto */
  pdfFileName?: string
}

// ───────────────────────── Lump Sum ─────────────────────────

/** Línea con complemento opcional en letra pequeña: "62 lf" + "(6” high)" */
export interface RichLine {
  text: string
  note?: string
  /** Toda la línea en letra pequeña (ej. "7 Patchs") */
  small?: boolean
  bold?: boolean
}

export interface LineItem {
  id: string
  /** Descripción: una o varias líneas, o lista con viñetas */
  description: RichLine[]
  bulleted?: boolean
  qty: RichLine[]
}

/** Cómo se separa Material / Labor de un grupo de precio. */
export type PriceSplit =
  /** Se introduce el total; Material = % del total redondeado al dólar */
  | { mode: 'total'; totalCents: Cents }
  /** Se introducen Material y Labor directamente */
  | { mode: 'manual'; materialCents: Cents; laborCents: Cents }

/** Filas que comparten un mismo precio (celda combinada en 223-26). */
export interface PriceGroup {
  id: string
  items: LineItem[]
  unitPriceLabel: string
  split: PriceSplit
}

export interface LumpSumSection {
  id: string
  systemId?: string
  toBePerformed: string
  scope: ScopeItem[]
  groups: PriceGroup[]
  note?: string
}

export interface LumpSumQuote extends QuoteBase {
  type: 'lumpSum'
  /** Porcentaje de material por defecto ("60"). Texto decimal para no perder precisión. */
  materialPercent: string
  sections: LumpSumSection[]
}

// ───────────────────────── Premium Time ─────────────────────────

export interface PremiumTimeItem {
  id: string
  title: string
  detail?: string
  amountCents: Cents
}

export interface PremiumTimeQuote extends QuoteBase {
  type: 'premiumTime'
  subtitle: string
  items: PremiumTimeItem[]
}

// ───────────────────────── Time & Material ─────────────────────────

/** De dónde salen las horas de una posición. */
export type HoursSource = 'supervisor' | 'labor' | 'pm' | 'manual'

export interface LaborPosition {
  id: string
  name: string
  qty: number
  hoursSource: HoursSource
  /** Solo para hoursSource = 'manual' */
  manualHours?: number
  rateCents: Cents
}

export type ScheduleRow =
  | {
      id: string
      kind: 'crew'
      day: string
      activity: string
      crew: string
      supervisorHours: number
      laborHours: number
    }
  | { id: string; kind: 'pm'; day: string; activity: string; crew: string; hours: number }

export interface MaterialLine {
  id: string
  description: string
  /** Decimal en texto ("2", "1.5") */
  qty: string
  unit: string
  unitPriceCents: Cents
}

/** Cómo se fija la proporción de un área. */
export type AreaAllocation =
  /** Proporcional a sf + lf (entre las áreas en automático) */
  | { mode: 'auto' }
  | { mode: 'percent'; percent: string }
  /** Total deseado del área; % = total del área / subtotal */
  | { mode: 'total'; totalCents: Cents }

export interface TmArea {
  id: string
  name: string
  sf?: number
  lf?: number
  /** Texto de la columna QTY/UNIT; vacío = se genera de sf/lf ("45 sf / 2 lf") */
  qtyLabel?: string
  allocation: AreaAllocation
}

export interface TmQuote extends QuoteBase {
  type: 'tm'
  /** Sistema de la biblioteca usado para el scope (solo referencia) */
  systemId?: string
  toBePerformed: string
  scope: ScopeItem[]
  labor: LaborPosition[]
  scheduleIntro: string
  schedule: ScheduleRow[]
  materials: MaterialLine[]
  areas: TmArea[]
}

export type Quote = LumpSumQuote | PremiumTimeQuote | TmQuote
