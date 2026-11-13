/**
 * Las 6 cotizaciones de referencia/ejemplos/ como datos de la app.
 * Se usan en las pruebas de cálculo (Fase 2) y para comparar el PDF generado (Fase 3).
 */
import { dollars } from '../money.ts'
import { TERMS_A, TERMS_B } from '../seed/terms.ts'
import { CARLOS_SOTO, ERIC_RIVERA } from '../seed/signers.ts'
import type {
  LumpSumQuote,
  PremiumTimeQuote,
  RichLine,
  ScopeItem,
  ScopeLevel,
  TmQuote,
} from '../types.ts'

let n = 0
const id = (p: string) => `${p}-${++n}`
const scope = (items: [ScopeLevel, string][]): ScopeItem[] =>
  items.map(([level, text]) => ({ id: id('sc'), level, text }))
const L = (text: string, extra: Partial<RichLine> = {}): RichLine => ({ text, ...extra })

const DMR = { name: 'Domardi Machin', initials: 'DMR' }
const CSN = { name: 'Carlos Soto Navarro', initials: 'CSN' }
const SIX_HIGH = '(6” high)'

// ───────────────────────── 049-26 REV I ─────────────────────────
export const Q049: LumpSumQuote = {
  id: 'q049',
  type: 'lumpSum',
  number: { seq: 49, year: 2026, revision: 1 },
  status: 'sent',
  header: {
    date: '2026-02-18',
    contact: 'Eng. Carlos Santiago',
    contractor: 'Johnson & Johnson',
    projectArea: 'JOHNSON & JOHNSON MECH ROOM 304',
    location: 'Gurabo, Puerto Rico',
  },
  title: 'P R O P O S A L',
  preparedBy: DMR,
  signer: ERIC_RIVERA,
  terms: TERMS_B,
  materialPercent: '60',
  sections: [
    {
      id: 's1',
      toBePerformed: 'Installation of Sikafloor System on the reference project which consist on the following:',
      scope: scope([
        [1, 'Removal of existing top coating'],
        [1, 'Surface preparation with diamond grinder'],
        [1, 'Installation of:'],
        [2, 'Sikafloor 264 (Color Traffic Gray) Base Coat'],
        [2, 'Sikafloor 264 (Color Traffic Gray) Top Coat'],
      ]),
      groups: [
        {
          id: 'g1',
          unitPriceLabel: 'LUMP SUM',
          split: { mode: 'total', totalCents: dollars(43631) },
          items: [{ id: 'i1', description: [L('Room 304')], qty: [L('4,475 sf')] }],
        },
      ],
    },
  ],
}

// ───────────────────────── 303-26 ─────────────────────────
export const Q303: LumpSumQuote = {
  id: 'q303',
  type: 'lumpSum',
  number: { seq: 303, year: 2026, revision: 0 },
  status: 'sent',
  header: {
    date: '2026-07-30',
    contact: 'Eng. Jorge Saliva',
    contractor: 'RC Professionals & Construction Services Corp',
    projectArea: 'HOSP DAMAS PONCE - STERILE PROCESSING UNIT',
    location: 'Ponce, Puerto Rico',
  },
  title: 'ETS CORP. P R O P O S A L',
  preparedBy: DMR,
  signer: CARLOS_SOTO,
  terms: TERMS_A,
  materialPercent: '60',
  sections: [
    {
      id: 's1',
      toBePerformed:
        'Installation of Sikagard Hygiene HD Wall Coating System on the reference project which consist on the following:',
      scope: scope([
        [1, 'Surface preparation with diamond grinder'],
        [1, 'Installation of:'],
        [2, 'Sikafloor 2570 WB Primer Coat'],
        [2, 'Sikagard-203W Body Coat'],
        [2, 'Sikagard-307W Topcoat'],
      ]),
      groups: [
        {
          id: 'g1',
          unitPriceLabel: 'LUMP SUM',
          split: { mode: 'total', totalCents: dollars(25500) },
          items: [
            {
              id: 'i1',
              bulleted: true,
              description: [L('Sterilization Work Area', { bold: true }), L('Sterile Supplies Storage', { bold: true })],
              qty: [L('3,000 sf'), L('(Aprox and up to 9’ high)', { small: true })],
            },
          ],
        },
      ],
      note: 'This quotation is based on wall heights of up to 9 feet.',
    },
  ],
}

// ───────────────────────── 223-26 ─────────────────────────
export const Q223: LumpSumQuote = {
  id: 'q223',
  type: 'lumpSum',
  number: { seq: 223, year: 2026, revision: 0 },
  status: 'sent',
  header: {
    date: '2026-06-01',
    contact: 'Eng. Gabriel Silva',
    contractor: 'Cruybelt Contractor',
    projectArea: 'KENVUE BLENDER NO.1 REPLACEMENT',
    location: 'Las Piedras, Puerto Rico',
  },
  title: 'ETS CORP. P R O P O S A L',
  preparedBy: DMR,
  signer: ERIC_RIVERA,
  terms: TERMS_A,
  materialPercent: '60',
  sections: [
    {
      id: 's1',
      toBePerformed: 'Installation of Epoxy Terrazzo System on the reference project which consist on the following:',
      scope: scope([
        [1, 'Removal of existing Terrazzo System'],
        [1, 'Installation of Sikafloor Purcem 22NA @ ½”'],
        [1, 'Surface preparation with diamond grinder'],
        [1, 'Euco 700 (For Joints as needed)'],
        [1, 'Installation of:'],
        [3, 'Epoxy Terrazzo System @ ¼”'],
        [1, 'Polish surface with diamond #30 & 80'],
        [1, 'Application of Epoxy terrazzo Grout'],
        [1, 'Polish surface with diamond #50, #100 & #200'],
        [1, 'Application of Non-Skid Urethane Sealer'],
      ]),
      groups: [
        {
          id: 'g1',
          unitPriceLabel: 'LUMP SUM',
          split: { mode: 'total', totalCents: dollars(20793) },
          items: [
            {
              id: 'i1',
              description: [L('Blender No.1', { note: '(Room 404)' })],
              qty: [L('235 sf'), L('62 lf', { note: SIX_HIGH })],
            },
            {
              id: 'i2',
              description: [L('Airlock Blender Control Panel (PAD)', { note: '(Room 400)' })],
              qty: [L('4 sf'), L('7 lf', { note: SIX_HIGH })],
            },
          ],
        },
        {
          id: 'g2',
          unitPriceLabel: 'LUMP SUM',
          split: { mode: 'total', totalCents: dollars(39202) },
          items: [
            {
              id: 'i3',
              description: [L('Airlock Blender', { note: '(Room 400)' })],
              qty: [L('490 sf'), L('70 lf', { note: SIX_HIGH })],
            },
          ],
        },
      ],
    },
  ],
}

// ───────────────────────── 387-26 (dos secciones) ─────────────────────────
export const Q387: LumpSumQuote = {
  id: 'q387',
  type: 'lumpSum',
  number: { seq: 387, year: 2026, revision: 0 },
  status: 'sent',
  header: {
    date: '2026-10-05',
    contact: 'Eng. José González',
    contractor: 'Sartorius',
    projectArea: 'SARTORIUS FMT AREA 7 (PATCH REPAIR)',
    location: 'Yauco, Puerto Rico',
  },
  title: 'ETS CORP. P R O P O S A L',
  preparedBy: DMR,
  signer: CARLOS_SOTO,
  terms: TERMS_A,
  materialPercent: '60',
  sections: [
    {
      id: 's1',
      toBePerformed:
        'Installation of Sikafloor and Joint Repair Systems on the reference project which consist on the following:',
      scope: scope([
        [1, 'Surface preparation with diamond grinder'],
        [2, 'Installation of:'],
        [3, 'Sikafloor TG System @ ¼”:'],
        [3, 'Sikafloor 265 Membrane Base Coat'],
        [3, 'Sikafloor 265 Membrane Grout Coat'],
        [3, 'Sikafloor 264 (Color Light Gray) Topcoat'],
        [3, 'Euco 700 for Joint Repair'],
      ]),
      groups: [
        {
          id: 'g1',
          unitPriceLabel: 'LUMP SUM',
          split: { mode: 'total', totalCents: dollars(6912) },
          items: [
            {
              id: 'i1',
              description: [L('FMT Area 7', { bold: true }), L('(6 Patchs – 6 sf ea)', { bold: true, small: true })],
              qty: [L('36 sf')],
            },
          ],
        },
      ],
    },
    {
      id: 's2',
      toBePerformed: 'Installation of Sikafloor System on the reference project which consist on the following:',
      scope: scope([
        [1, 'Surface preparation with diamond grinder'],
        [2, 'Installation of:'],
        [3, 'Sikafloor 264 (Color Light Gray) Base Coat'],
        [3, 'Sikafloor 264 (Color Light Gray) Topcoat'],
      ]),
      groups: [
        {
          id: 'g2',
          unitPriceLabel: 'LUMP SUM',
          split: { mode: 'total', totalCents: dollars(3978) },
          items: [
            {
              id: 'i2',
              description: [L('FMT Area 7', { bold: true })],
              qty: [L('7 Patchs', { small: true }), L('1” x 1” ea')],
            },
          ],
        },
      ],
    },
  ],
}

// ───────────────────────── 452-26 Premium Time ─────────────────────────
export const Q452: PremiumTimeQuote = {
  id: 'q452',
  type: 'premiumTime',
  number: { seq: 452, year: 2026, revision: 0 },
  status: 'sent',
  header: {
    date: '2026-11-04',
    contact: 'Eng. María Cruz',
    contractor: 'Cruybelt',
    projectArea: 'KENVUE BLENDER 1 AREA - PREMIUM TIME',
    location: 'Las Piedras, Puerto Rico',
  },
  title: 'P R O P O S A L',
  preparedBy: CSN,
  signer: CARLOS_SOTO,
  terms: TERMS_B,
  subtitle: 'PREMIUM TIME',
  items: [
    {
      id: 'p1',
      title: 'Weekend',
      detail: '(Saturday, November 7, 2026, and Sunday, November 8, 2026)',
      amountCents: dollars(2875),
    },
  ],
}

// ───────────────────────── 348-26 REV II (T&M) ─────────────────────────
export const Q348: TmQuote = {
  id: 'q348',
  type: 'tm',
  number: { seq: 348, year: 2026, revision: 2 },
  status: 'sent',
  header: {
    date: '2026-10-28',
    contact: 'Eng. Jorge Sánchez',
    contractor: 'Amgen',
    projectArea: 'AMGEN - AML1 ROOM 4137 PACKING AREA AND CORRIDOR 547 (RE-FLAKE - PATCH REPAIR)',
    location: 'Juncos, Puerto Rico',
  },
  title: 'ETS CORP. P R O P O S A L',
  preparedBy: DMR,
  signer: CARLOS_SOTO,
  terms: TERMS_A,
  toBePerformed: 'Re-Flake on the reference project, which consists of the following:',
  scope: scope([
    [1, 'Surface preparation with diamond grinder'],
    [1, 'Installation of:'],
    [2, 'Sikafloor 264 (Color Light Gray) Base Coat + Sikafloor Flake (Color Salt & Pepper)'],
    [2, 'Sikafloor 217 Grout Coat'],
    [2, 'Sikafloor 217 2nd Grout Coat'],
    [2, 'Sikafloor 217 Topcoat'],
    [2, 'Sikafloor 315 2nd Topcoat'],
  ]),
  labor: [
    { id: 'pm', name: 'Project Manager', qty: 1, hoursSource: 'pm', rateCents: dollars(90) },
    { id: 'sup', name: 'Supervisor', qty: 1, hoursSource: 'supervisor', rateCents: dollars(60) },
    { id: 'lab', name: 'Labor', qty: 4, hoursSource: 'labor', rateCents: dollars(40) },
  ],
  scheduleIntro:
    'Project duration: approximately 5 working days (one coat per day due to curing time between coats). Hours shown as Supervisor / Labor.',
  schedule: [
    {
      id: 'd1',
      kind: 'crew',
      day: 'Day 1',
      activity: 'Mobilization, area protection, diamond grinding, Sikafloor 264 base coat + Sikafloor Flake broadcast',
      crew: 'Supervisor + 4 Labor',
      supervisorHours: 8,
      laborHours: 32,
    },
    {
      id: 'd2',
      kind: 'crew',
      day: 'Day 2',
      activity: 'Remove excess flake, sand/vacuum, Sikafloor 217 grout coat',
      crew: 'Supervisor + 4 Labor',
      supervisorHours: 4,
      laborHours: 12,
    },
    {
      id: 'd3',
      kind: 'crew',
      day: 'Day 3',
      activity: 'Sikafloor 217 2nd grout coat',
      crew: 'Supervisor + 2 Labor',
      supervisorHours: 4,
      laborHours: 8,
    },
    {
      id: 'd4',
      kind: 'crew',
      day: 'Day 4',
      activity: 'Sikafloor 217 topcoat',
      crew: 'Supervisor + 2 Labor',
      supervisorHours: 4,
      laborHours: 8,
    },
    {
      id: 'd5',
      kind: 'crew',
      day: 'Day 5',
      activity: 'Sikafloor 315 2nd topcoat, cleanup, demobilization',
      crew: 'Supervisor + 2 Labor',
      supervisorHours: 4,
      laborHours: 8,
    },
    {
      id: 'dpm',
      kind: 'pm',
      day: 'Day 1–5',
      activity: 'Project coordination, client meetings, inspection and closeout',
      crew: 'Project Manager',
      hours: 5,
    },
  ],
  materials: [
    ['Sikafloor 264 (Light Gray) – Base Coat', '2', 'Kit', 550],
    ['Sikafloor 217 – Grout Coats & Topcoat', '5', 'Kit', 420],
    ['Sikafloor 315 – 2nd Topcoat', '2', 'Kit', 610],
    ['Sikafloor Flakes (Salt & Pepper)', '4', 'Box', 245],
    ['Roller Covers 9"', '8', 'Ea', 18],
    ['Roller Covers 4"', '12', 'Ea', 9],
    ['Squeegees', '3', 'Ea', 65],
    ['Brushes', '10', 'Ea', 7.8],
    ['Mixing Drill', '1', 'Ea', 595],
    ['Mixer', '1', 'Ea', 395],
  ].map(([description, qty, unit, price]) => ({
    id: id('m'),
    description: description as string,
    qty: qty as string,
    unit: unit as string,
    unitPriceCents: dollars(price as number),
  })),
  areas: [
    {
      id: 'a1',
      name: 'Room 4137 Packing Area (Patch Repair)',
      sf: 210,
      allocation: { mode: 'total', totalCents: dollars(6798) },
    },
    { id: 'a2', name: 'Corridor 547 Area (Patch Repair)', sf: 45, lf: 2, allocation: { mode: 'auto' } },
  ],
}

export const EXAMPLES = { Q049, Q303, Q223, Q387, Q452, Q348 }
