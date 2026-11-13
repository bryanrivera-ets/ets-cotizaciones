/**
 * Creación de cotizaciones y filas nuevas con valores por defecto.
 */
import { todayIso } from './format.ts'
import { DEFAULT_MATERIAL_PERCENT } from './calc/lumpSum.ts'
import type {
  LaborPosition,
  LineItem,
  LumpSumQuote,
  LumpSumSection,
  MaterialLine,
  PremiumTimeItem,
  PremiumTimeQuote,
  PriceGroup,
  Quote,
  QuoteType,
  ScheduleRow,
  ScopeItem,
  ScopeLevel,
  Signer,
  TermsVersion,
  TmArea,
  TmQuote,
  UserProfile,
} from './types.ts'

export function newId(): string {
  const c = globalThis.crypto
  if (c && 'randomUUID' in c) return c.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Datos del contexto que se copian ("congelan") en cada cotización nueva. */
export interface QuoteContext {
  profile: UserProfile
  signer: Signer
  terms: TermsVersion
  /** Fecha ISO; por defecto, hoy */
  date?: string
}

export const newScopeItem = (text = '', level: ScopeLevel = 1): ScopeItem => ({ id: newId(), text, level })

export const newLineItem = (): LineItem => ({ id: newId(), description: [{ text: '' }], qty: [{ text: '' }] })

export const newPriceGroup = (): PriceGroup => ({
  id: newId(),
  items: [newLineItem()],
  unitPriceLabel: 'LUMP SUM',
  split: { mode: 'total', totalCents: 0 },
})

export const newSection = (): LumpSumSection => ({
  id: newId(),
  toBePerformed: 'Installation of ____ System on the reference project which consist on the following:',
  scope: [newScopeItem('Surface preparation with diamond grinder'), newScopeItem('Installation of:')],
  groups: [newPriceGroup()],
})

export const newPremiumItem = (): PremiumTimeItem => ({ id: newId(), title: 'Weekend', detail: '', amountCents: 0 })

export const newLaborPosition = (name = '', hoursSource: LaborPosition['hoursSource'] = 'manual'): LaborPosition => ({
  id: newId(),
  name,
  qty: 1,
  hoursSource,
  manualHours: 0,
  rateCents: 0,
})

export const newCrewDay = (n: number): ScheduleRow => ({
  id: newId(),
  kind: 'crew',
  day: `Day ${n}`,
  activity: '',
  crew: 'Supervisor + 2 Labor',
  supervisorHours: 8,
  laborHours: 16,
})

export const newPmRow = (): ScheduleRow => ({
  id: newId(),
  kind: 'pm',
  day: 'Day 1–5',
  activity: 'Project coordination, client meetings, inspection and closeout',
  crew: 'Project Manager',
  hours: 0,
})

export const newMaterialLine = (): MaterialLine => ({ id: newId(), description: '', qty: '1', unit: 'Ea', unitPriceCents: 0 })

export const newArea = (): TmArea => ({ id: newId(), name: '', sf: 0, allocation: { mode: 'auto' } })

function base(ctx: QuoteContext) {
  const date = ctx.date ?? todayIso()
  return {
    id: newId(),
    tempId: `TMP-${Date.now().toString(36).toUpperCase()}`,
    number: { seq: null, year: Number(date.slice(0, 4)), revision: 0 },
    status: 'draft' as const,
    header: { date, contact: '', contractor: '', projectArea: '', location: '' },
    title: ctx.profile.preferredTitle,
    preparedBy: { name: ctx.profile.name, initials: ctx.profile.initials },
    signer: structuredClone(ctx.signer),
    terms: structuredClone(ctx.terms),
  }
}

export function newQuote(type: QuoteType, ctx: QuoteContext): Quote {
  switch (type) {
    case 'lumpSum':
      return { ...base(ctx), type, materialPercent: DEFAULT_MATERIAL_PERCENT, sections: [newSection()] } satisfies LumpSumQuote
    case 'premiumTime':
      return { ...base(ctx), type, subtitle: 'PREMIUM TIME', items: [newPremiumItem()] } satisfies PremiumTimeQuote
    case 'tm':
      return {
        ...base(ctx),
        type,
        title: 'ETS CORP. P R O P O S A L',
        toBePerformed: '____ on the reference project, which consists of the following:',
        scope: [newScopeItem('Surface preparation with diamond grinder'), newScopeItem('Installation of:')],
        labor: [
          newLaborPosition('Project Manager', 'pm'),
          newLaborPosition('Supervisor', 'supervisor'),
          { ...newLaborPosition('Labor', 'labor'), qty: 2 },
        ],
        scheduleIntro:
          'Project duration: approximately __ working days. Hours shown as Supervisor / Labor.',
        schedule: [newCrewDay(1), newPmRow()],
        materials: [newMaterialLine()],
        areas: [newArea()],
      } satisfies TmQuote
  }
}

export const QUOTE_TYPE_LABEL: Record<QuoteType, string> = {
  lumpSum: 'Lump Sum',
  premiumTime: 'Premium Time',
  tm: 'Time & Material',
}
