import { describe, expect, it } from 'vitest'
import { clientKey, clientsFromRows, detectColumns, findClient, findContact, mergeClients } from './clients.ts'

/** Mismas columnas que la lista exportada de QuickBooks (datos inventados). */
const HEAD = ['Customer', 'Company', 'Contact', 'Contact Title', 'Main Phone', 'Alt. Phone', 'Fax', 'Main Email', 'Bill To', 'Ship To', 'Terms', 'Sales Tax Code', 'Tax Item', 'Resale Num', 'Balance Total', 'Notes']
const row = (o: Partial<Record<string, string | number>>) => HEAD.map((h) => o[h] ?? null)

const ROWS = [
  HEAD,
  row({ Customer: 'Acme Builders, I', Company: 'Acme Builders, Inc.', Contact: 'Eng. Ana Pérez', 'Main Phone': '(787) 555-0101', 'Main Email': 'ana@acme.test', 'Bill To': 'PO Box 1, Caguas, PR', Terms: 'Net 30', 'Balance Total': 1200 }),
  row({ Customer: 'BETA CORP JAYUYA', 'Bill To': 'PO Box 2, Jayuya, PR', 'Balance Total': 0 }),
  row({ Customer: 'Gamma LLC', Company: 'Gamma LLC', Contact: 'Mr Luis Rivera', 'Main Email': 'luis@gamma.test; ventas@gamma.test', Notes: 'Possible duplicate of "Gamma"' }),
  row({ Customer: 'Gamma', Company: 'GAMMA, LLC.', Contact: 'Carmen Ortiz', 'Main Email': 'carmen@gamma.test' }),
  row({ 'Sales Tax Code': 'Tax', 'Balance Total': 0 }),
  row({}),
]

describe('importar clientes', () => {
  it('reconoce las columnas de QuickBooks', () => {
    const d = detectColumns(ROWS)!
    expect(d.headerRow).toBe(0)
    expect(d.cols).toMatchObject({ name: 1, customer: 0, contact: 2, title: 3, email: 7, phone: 4, address: 8, terms: 10, notes: 15 })
  })

  it('reconoce títulos en español y una fila de título que no es la primera', () => {
    const d = detectColumns([['Lista de clientes'], [], ['Compañía', 'Contacto', 'Correo', 'Teléfono']])!
    expect(d.headerRow).toBe(2)
    expect(d.cols).toMatchObject({ name: 0, contact: 1, email: 2, phone: 3 })
  })

  it('convierte filas en clientes, usa Customer si Company está vacía y no importa el balance', () => {
    const { clients, skipped } = clientsFromRows(ROWS)
    expect(clients.map((c) => c.name)).toEqual(['Acme Builders, Inc.', 'BETA CORP JAYUYA', 'Gamma LLC'])
    const acme = clients[0]
    expect(acme).toMatchObject({ phone: '(787) 555-0101', address: 'PO Box 1, Caguas, PR', terms: 'Net 30' })
    expect(acme.contacts).toMatchObject([{ name: 'Eng. Ana Pérez', email: 'ana@acme.test' }])
    expect(JSON.stringify(clients)).not.toContain('1200')
    expect(skipped).toBe(1)
  })

  it('junta filas del mismo cliente (nombre con sufijos distintos) y separa correos múltiples', () => {
    const { clients, merged } = clientsFromRows(ROWS)
    const gamma = clients[2]
    expect(merged).toBe(1)
    expect(gamma.contacts.map((c) => c.name)).toEqual(['Mr Luis Rivera', 'Carmen Ortiz'])
    expect(gamma.contacts[0].email).toBe('luis@gamma.test, ventas@gamma.test')
    expect(gamma.notes).toContain('Possible duplicate')
  })

  it('falla con un mensaje claro si no hay columna de compañía', () => {
    expect(() => clientsFromRows([['Fecha', 'Monto'], ['2026-01-01', 5]])).toThrow(/Company/)
  })
})

describe('buscar y juntar', () => {
  it('clientKey ignora puntuación, acentos y sufijos (Inc, LLC, Corp)', () => {
    expect(clientKey('Gamma, LLC.')).toBe(clientKey('GAMMA llc'))
    expect(clientKey('A&A Steri-Tec Contractors, Inc')).toBe(clientKey('A and A Steri Tec Contractors'))
    expect(clientKey('Compañía José')).toBe(clientKey('compania jose'))
  })

  it('encuentra cliente y contacto', () => {
    const { clients } = clientsFromRows(ROWS)
    const c = findClient(clients, 'gamma llc')
    expect(c?.name).toBe('Gamma LLC')
    expect(findContact(c, 'carmen ortiz')?.email).toBe('carmen@gamma.test')
    expect(findClient(clients, 'Acme Builders, I')?.name).toBe('Acme Builders, Inc.')
  })

  it('volver a importar no duplica y no pisa lo editado en la app', () => {
    const first = clientsFromRows(ROWS).clients
    first[0].phone = '787-000-0000 (editado)'
    first[0].contacts[0].email = 'nuevo@acme.test'
    const again = mergeClients(first, clientsFromRows(ROWS).clients)
    expect(again.added).toBe(0)
    expect(again.clients).toHaveLength(3)
    expect(again.clients[0].phone).toBe('787-000-0000 (editado)')
    expect(again.clients[0].contacts).toHaveLength(1)
    expect(again.clients[0].contacts[0].email).toBe('nuevo@acme.test')
  })

  it('agrega clientes y contactos nuevos al volver a importar', () => {
    const base = clientsFromRows(ROWS.slice(0, 3)).clients
    const r = mergeClients(base, clientsFromRows(ROWS).clients)
    expect(r.added).toBe(1)
    expect(r.clients.map((c) => c.name)).toEqual(['Acme Builders, Inc.', 'BETA CORP JAYUYA', 'Gamma LLC'])
  })
})
