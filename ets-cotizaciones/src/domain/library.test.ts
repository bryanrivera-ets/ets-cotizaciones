import { describe, expect, it } from 'vitest'
import { newSection } from './factories.ts'
import { Q223, Q348, Q387 } from './fixtures/examples.ts'
import { applySystem, defaultLibrary, findMaterial, findPosition, systemFromSection, withDefaults } from './library.ts'
import { SEED_SYSTEMS } from './seed/systems.ts'

const strip = (scope: { level: number; text: string }[]) => scope.map(({ level, text }) => ({ level, text }))
const sys = (id: string) => SEED_SYSTEMS.find((s) => s.id === id)!

describe('biblioteca: carga inicial', () => {
  it('trae los sistemas de los ejemplos con el mismo scope', () => {
    expect(strip(sys('sys-epoxy-terrazzo').scope)).toEqual(strip(Q223.sections[0].scope))
    expect(strip(sys('sys-sikafloor-tg-joint').scope)).toEqual(strip(Q387.sections[0].scope))
    expect(strip(sys('sys-sikafloor-264-patch').scope)).toEqual(strip(Q387.sections[1].scope))
    expect(strip(sys('sys-re-flake').scope)).toEqual(strip(Q348.scope))
    expect(sys('sys-re-flake').toBePerformed).toBe(Q348.toBePerformed)
  })

  it('ids únicos en sistemas y catálogo', () => {
    const lib = defaultLibrary()
    for (const list of [lib.systems, lib.materials, lib.positions, lib.terms, lib.profiles, lib.signers]) {
      const ids = list.map((x) => x.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('withDefaults completa solo lo que falta', () => {
    const lib = withDefaults({ systems: [] })
    expect(lib.systems).toEqual([])
    expect(lib.profiles.map((p) => p.initials)).toEqual(['DMR', 'CSN'])
  })

  it('defaultLibrary devuelve copias independientes', () => {
    const a = defaultLibrary()
    a.systems[0].name = 'cambiado'
    expect(defaultLibrary().systems[0].name).not.toBe('cambiado')
  })
})

describe('aplicar y guardar sistemas', () => {
  it('applySystem copia texto y scope con ids nuevos (no comparte objetos)', () => {
    const section = newSection()
    const s = sys('sys-sikagard-hygiene')
    applySystem(section, s)
    expect(section.toBePerformed).toBe(s.toBePerformed)
    expect(strip(section.scope)).toEqual(strip(s.scope))
    expect(section.scope[0].id).not.toBe(s.scope[0].id)
    expect(section.systemId).toBe(s.id)
    section.scope[0].text = 'editado en la cotización'
    expect(s.scope[0].text).toBe('Surface preparation with diamond grinder')
  })

  it('systemFromSection crea un sistema nuevo desde una cotización', () => {
    const created = systemFromSection('Mi sistema', Q223.sections[0])
    expect(created.name).toBe('Mi sistema')
    expect(strip(created.scope)).toEqual(strip(Q223.sections[0].scope))
    expect(created.id).not.toBe(Q223.sections[0].id)
  })

  it('busca material y posición del catálogo sin distinguir mayúsculas', () => {
    const lib = defaultLibrary()
    expect(findMaterial(lib.materials, 'sikafloor flakes (salt & pepper)')?.unit).toBe('Box')
    expect(findMaterial(lib.materials, '')).toBeUndefined()
    expect(findPosition(lib.positions, 'supervisor')?.hoursSource).toBe('supervisor')
  })
})
