import type { CatalogMaterial, CatalogPosition } from '../library.ts'

/** Catálogo T&M inicial (sin precios), tomado de 348-26. */
export const SEED_MATERIALS: CatalogMaterial[] = [
  ['Sikafloor 264 (Light Gray) – Base Coat', 'Kit'],
  ['Sikafloor 217 – Grout Coats & Topcoat', 'Kit'],
  ['Sikafloor 315 – 2nd Topcoat', 'Kit'],
  ['Sikafloor Flakes (Salt & Pepper)', 'Box'],
  ['Roller Covers 9"', 'Ea'],
  ['Roller Covers 4"', 'Ea'],
  ['Squeegees', 'Ea'],
  ['Brushes', 'Ea'],
  ['Mixing Drill', 'Ea'],
  ['Mixer', 'Ea'],
].map(([name, unit], i) => ({ id: `mat-${i + 1}`, name, unit }))

export const SEED_POSITIONS: CatalogPosition[] = [
  { id: 'pos-pm', name: 'Project Manager', hoursSource: 'pm' },
  { id: 'pos-sup', name: 'Supervisor', hoursSource: 'supervisor' },
  { id: 'pos-lab', name: 'Labor', hoursSource: 'labor' },
]
