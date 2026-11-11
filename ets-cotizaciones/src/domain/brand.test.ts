import { brand } from './brand.ts'

describe('brand', () => {
  it('tiene todos los colores en formato hex', () => {
    for (const hex of Object.values(brand.colors)) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
