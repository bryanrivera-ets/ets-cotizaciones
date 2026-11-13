/**
 * Biblioteca compartida: sistemas, catálogo T&M, términos, perfiles y firmantes.
 * Las cotizaciones guardan COPIAS de lo que usan, así que editar la biblioteca
 * nunca cambia una cotización existente.
 */
import { newId } from './factories.ts'
import { SEED_MATERIALS, SEED_POSITIONS } from './seed/catalog.ts'
import { SEED_PROFILES } from './seed/profiles.ts'
import { SEED_SIGNERS } from './seed/signers.ts'
import { SEED_SYSTEMS } from './seed/systems.ts'
import { SEED_TERMS } from './seed/terms.ts'
import type { HoursSource, ScopeItem, Signer, SystemTemplate, TermsVersion, UserProfile } from './types.ts'

export interface CatalogMaterial {
  id: string
  name: string
  unit: string
}

export interface CatalogPosition {
  id: string
  name: string
  /** De dónde salen las horas al usar esta posición en un T&M */
  hoursSource: HoursSource
}

export interface Library {
  systems: SystemTemplate[]
  materials: CatalogMaterial[]
  positions: CatalogPosition[]
  terms: TermsVersion[]
  profiles: UserProfile[]
  signers: Signer[]
}

export type LibraryKey = keyof Library

export const LIBRARY_KEYS: LibraryKey[] = ['systems', 'materials', 'positions', 'terms', 'profiles', 'signers']

export function defaultLibrary(): Library {
  return structuredClone({
    systems: SEED_SYSTEMS,
    materials: SEED_MATERIALS,
    positions: SEED_POSITIONS,
    terms: SEED_TERMS,
    profiles: SEED_PROFILES,
    signers: SEED_SIGNERS,
  })
}

/** Completa con la carga inicial cualquier colección que todavía no exista. */
export function withDefaults(partial: Partial<Library>): Library {
  const d = defaultLibrary()
  const out = {} as Library
  for (const k of LIBRARY_KEYS) (out as unknown as Record<LibraryKey, unknown>)[k] = partial[k] ?? d[k]
  return out
}

/** Copia del scope con ids nuevos (para que la cotización no comparta objetos con la biblioteca). */
export const cloneScope = (scope: ScopeItem[]): ScopeItem[] => scope.map((s) => ({ ...s, id: newId() }))

/** Aplica un sistema a una sección (o a un T&M): copia el texto y el scope. */
export function applySystem<T extends { toBePerformed: string; scope: ScopeItem[]; systemId?: string }>(target: T, system: SystemTemplate): void {
  target.toBePerformed = system.toBePerformed
  target.scope = cloneScope(system.scope)
  target.systemId = system.id
}

/** Crea un sistema nuevo a partir de lo escrito en una cotización. */
export function systemFromSection(name: string, section: { toBePerformed: string; scope: ScopeItem[] }): SystemTemplate {
  return { id: newId(), name, toBePerformed: section.toBePerformed, scope: cloneScope(section.scope) }
}

/** Busca un material del catálogo por nombre (sin distinguir mayúsculas). */
export function findMaterial(materials: CatalogMaterial[], name: string): CatalogMaterial | undefined {
  const n = name.trim().toLowerCase()
  return n ? materials.find((m) => m.name.trim().toLowerCase() === n) : undefined
}

export function findPosition(positions: CatalogPosition[], name: string): CatalogPosition | undefined {
  const n = name.trim().toLowerCase()
  return n ? positions.find((p) => p.name.trim().toLowerCase() === n) : undefined
}
