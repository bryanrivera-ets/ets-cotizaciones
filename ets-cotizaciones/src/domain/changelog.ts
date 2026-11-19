/**
 * Resumen legible de un cambio en la biblioteca, para el registro de cambios
 * ("quién modificó qué y cuándo").
 */
import type { Library, LibraryKey } from './library.ts'

export const COLLECTION_LABEL: Record<string, string> = {
  systems: 'Sistemas',
  materials: 'Catálogo: materiales',
  positions: 'Catálogo: posiciones',
  terms: 'Términos',
  profiles: 'Perfiles',
  signers: 'Firmantes',
  clients: 'Clientes',
  users: 'Usuarios',
  counters: 'Numeración',
}

type Item = { id: string }

function labelOf(item: Item): string {
  const x = item as Record<string, unknown>
  const name = (x.name ?? x.email ?? '') as string
  const initials = x.initials ? ` (${x.initials})` : ''
  return `"${name || 'sin nombre'}${initials}"`
}

/** Compara la versión anterior y la nueva de una colección. Devuelve null si no cambió nada. */
export function diffSummary<K extends LibraryKey>(key: K, before: Library[K], after: Library[K]): string | null {
  const b = new Map((before as Item[]).map((i) => [i.id, i]))
  const a = new Map((after as Item[]).map((i) => [i.id, i]))
  const added = [...a.values()].filter((i) => !b.has(i.id))
  const removed = [...b.values()].filter((i) => !a.has(i.id))
  const changed = [...a.values()].filter((i) => b.has(i.id) && JSON.stringify(b.get(i.id)) !== JSON.stringify(i))
  const orderChanged =
    !added.length && !removed.length && !changed.length && JSON.stringify([...b.keys()]) !== JSON.stringify([...a.keys()])
  const parts: string[] = []
  // En cambios grandes (ej. importar 200 clientes) se nombran solo los primeros
  const names = (list: Item[]) =>
    list.length > 5 ? `${list.slice(0, 5).map(labelOf).join(', ')} y ${list.length - 5} más` : list.map(labelOf).join(', ')
  if (added.length) parts.push(`agregó ${names(added)}`)
  if (removed.length) parts.push(`eliminó ${names(removed)}`)
  if (changed.length) parts.push(`modificó ${names(changed)}`)
  if (orderChanged) parts.push('cambió el orden')
  return parts.length ? `${COLLECTION_LABEL[key]}: ${parts.join('; ')}` : null
}
