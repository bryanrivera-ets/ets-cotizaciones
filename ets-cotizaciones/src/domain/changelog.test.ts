import { describe, expect, it } from 'vitest'
import { diffSummary } from './changelog.ts'
import { defaultLibrary } from './library.ts'

describe('diffSummary', () => {
  const lib = defaultLibrary()

  it('sin cambios devuelve null', () => {
    expect(diffSummary('systems', lib.systems, structuredClone(lib.systems))).toBeNull()
  })

  it('describe agregados, eliminados y modificados', () => {
    const after = structuredClone(lib.systems)
    after[0].toBePerformed = 'otro texto'
    after.splice(1, 1)
    after.push({ id: 'nuevo', name: 'Sistema X', toBePerformed: '', scope: [] })
    const s = diffSummary('systems', lib.systems, after)!
    expect(s).toContain('Sistemas:')
    expect(s).toContain('agregó "Sistema X"')
    expect(s).toContain(`eliminó "${lib.systems[1].name}"`)
    expect(s).toContain(`modificó "${lib.systems[0].name}"`)
  })

  it('perfiles muestran las iniciales', () => {
    const after = structuredClone(lib.profiles)
    after[0].name = 'Otro Nombre'
    expect(diffSummary('profiles', lib.profiles, after)).toBe('Perfiles: modificó "Otro Nombre (DMR)"')
  })

  it('detecta solo un cambio de orden', () => {
    const after = structuredClone(lib.positions).reverse()
    expect(diffSummary('positions', lib.positions, after)).toBe('Catálogo: posiciones: cambió el orden')
  })
})
