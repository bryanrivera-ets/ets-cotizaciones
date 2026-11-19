import { useMemo, useRef, useState } from 'react'
import { clientsFromRows, mergeClients, type Client, type ImportResult, type MergeResult } from '../../domain/clients.ts'
import { newId } from '../../domain/factories.ts'
import { normalize } from '../../domain/management.ts'
import { backend } from '../../services/backend/index.ts'
import { Button, Card, Field, TextArea, TextInput } from '../../ui/controls.tsx'
import { useLibrary } from '../library/context.ts'

interface ImportPreview {
  fileName: string
  sheets: { name: string; rows: unknown[][] }[]
  sheet: string
  parsed: ImportResult | null
  merge: MergeResult | null
  error: string | null
}

/** Lee el Excel en el navegador (la librería se carga solo al importar). */
async function readWorkbook(file: File): Promise<{ name: string; rows: unknown[][] }[]> {
  if (/\.csv$/i.test(file.name)) {
    const text = await file.text()
    const sep = (text.split('\n')[0].match(/;/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ','
    const rows = text.split(/\r?\n/).map((line) => {
      const out: string[] = []
      let cur = ''
      let q = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (q && line[i + 1] === '"') {
            cur += '"'
            i++
          } else q = !q
        } else if (ch === sep && !q) {
          out.push(cur)
          cur = ''
        } else cur += ch
      }
      out.push(cur)
      return out
    })
    return [{ name: file.name, rows }]
  }
  const { default: readXlsxFile } = await import('read-excel-file/browser')
  const sheets = await readXlsxFile(file)
  return sheets.map((s) => ({ name: s.sheet, rows: s.data as unknown[][] }))
}

export function ClientsSettings() {
  const { library, update, replace } = useLibrary()
  const clients = library.clients
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const visible = useMemo(() => {
    const words = normalize(filter).split(/\s+/).filter(Boolean)
    if (!words.length) return clients
    return clients.filter((c) => {
      const hay = normalize([c.name, c.customerName, c.phone, ...c.contacts.flatMap((x) => [x.name, x.email])].join(' '))
      return words.every((w) => hay.includes(w))
    })
  }, [clients, filter])

  const index = clients.findIndex((c) => c.id === selectedId)
  const client = index >= 0 ? clients[index] : undefined
  const upClient = (fn: (c: Client) => void) => update('clients', (d) => fn(d[index]))

  const add = () => {
    const c: Client = { id: newId(), name: 'Cliente nuevo', contacts: [] }
    update('clients', (d) => void d.unshift(c))
    setSelectedId(c.id)
    setFilter('')
  }

  const remove = () => {
    if (!client || !confirm(`¿Eliminar el cliente "${client.name}" de la libreta? Las cotizaciones no cambian.`)) return
    update('clients', (d) => void d.splice(index, 1))
    setSelectedId(null)
  }

  const analyze = (p: ImportPreview, sheet: string): ImportPreview => {
    const s = p.sheets.find((x) => x.name === sheet)
    try {
      const parsed = clientsFromRows(s?.rows ?? [])
      return { ...p, sheet, parsed, merge: mergeClients(clients, parsed.clients), error: null }
    } catch (e) {
      return { ...p, sheet, parsed: null, merge: null, error: (e as Error).message }
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setMsg(null)
    try {
      const sheets = await readWorkbook(file)
      // Por defecto, la hoja "Clients"/"Clientes" o la que tenga más filas
      const main =
        sheets.find((s) => /^(clients?|clientes?)$/i.test(s.name.trim())) ?? [...sheets].sort((a, b) => b.rows.length - a.rows.length)[0]
      setPreview(analyze({ fileName: file.name, sheets, sheet: main.name, parsed: null, merge: null, error: null }, main.name))
    } catch (e) {
      setPreview({ fileName: file.name, sheets: [], sheet: '', parsed: null, merge: null, error: `No se pudo leer el archivo: ${(e as Error).message}` })
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const apply = () => {
    if (!preview?.merge || !preview.parsed) return
    replace('clients', preview.merge.clients)
    void backend.changelog.add(
      'clients',
      `Clientes: importó "${preview.fileName}" (hoja ${preview.sheet}): ${preview.merge.added} nuevos, ${preview.merge.updated} actualizados`,
    )
    setMsg(`Listo: ${preview.merge.added} clientes nuevos y ${preview.merge.updated} actualizados. Ya aparecen al escribir el Contractor en las cotizaciones.`)
    setPreview(null)
  }

  return (
    <>
      <Card
        title={`Clientes (${clients.length})`}
        actions={
          <div className="btn-row">
            <input ref={fileInput} type="file" accept=".xlsx,.csv" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
            <Button onClick={() => fileInput.current?.click()}>⤒ Importar desde Excel</Button>
            <Button variant="primary" onClick={add}>
              + Cliente
            </Button>
          </div>
        }
      >
        <p className="muted small">
          Al escribir el <b>Contractor</b> en una cotización, la app sugiere estos clientes y llena el contacto y su email. Importar de nuevo
          el Excel agrega los clientes y contactos nuevos sin duplicar ni borrar lo que hayas editado aquí.
        </p>
        {msg ? <p className="ok">{msg}</p> : null}

        {preview ? (
          <div className="import-preview">
            <h4>Importar "{preview.fileName}"</h4>
            {preview.sheets.length > 1 ? (
              <label className="check">
                Hoja:
                <select value={preview.sheet} onChange={(e) => setPreview(analyze(preview, e.target.value))}>
                  {preview.sheets.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({Math.max(0, s.rows.length - 1)} filas)
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {preview.error ? <p className="warning">{preview.error}</p> : null}
            {preview.parsed && preview.merge ? (
              <>
                <ul className="import-preview__stats">
                  <li>
                    <b>{preview.parsed.clients.length}</b> clientes con{' '}
                    <b>{preview.parsed.clients.reduce((a, c) => a + c.contacts.length, 0)}</b> contactos en el archivo
                  </li>
                  <li>
                    <b>{preview.merge.added}</b> nuevos · <b>{preview.merge.updated}</b> se completan · {preview.merge.unchanged} ya estaban
                    igual
                  </li>
                  {preview.parsed.merged ? <li>{preview.parsed.merged} filas repetidas se juntaron con su cliente</li> : null}
                  {preview.parsed.skipped ? <li className="muted">{preview.parsed.skipped} filas sin nombre de compañía se omiten</li> : null}
                  <li className="muted">No se importan saldos ni datos de impuestos.</li>
                </ul>
                <div className="btn-row">
                  <Button variant="primary" onClick={apply} disabled={!preview.merge.added && !preview.merge.updated}>
                    Importar
                  </Button>
                  <Button variant="ghost" onClick={() => setPreview(null)}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setPreview(null)}>
                Cerrar
              </Button>
            )}
          </div>
        ) : null}
      </Card>

      <div className="master-detail">
        <div className="master">
          <TextInput ariaLabel="Buscar cliente" placeholder="Buscar cliente, contacto o email…" value={filter} onChange={setFilter} />
          <ul className="master__list master__list--tall">
            {visible.slice(0, 300).map((c) => (
              <li key={c.id}>
                <button aria-current={c.id === selectedId} onClick={() => setSelectedId(c.id)}>
                  {c.name || <em>Sin nombre</em>}
                  <small className="muted">
                    {c.contacts.length ? c.contacts.map((x) => x.name || x.email).join(', ') : 'Sin contacto'}
                  </small>
                </button>
              </li>
            ))}
            {clients.length === 0 ? <li className="muted small">Todavía no hay clientes. Importa tu Excel o agrega uno.</li> : null}
          </ul>
        </div>

        <div className="detail">
          {client ? (
            <Card
              title="Editar cliente"
              actions={
                <Button variant="danger" onClick={remove}>
                  Eliminar
                </Button>
              }
            >
              <div className="grid">
                <Field label="Nombre (Contractor)" wide>
                  {(id) => <TextInput id={id} value={client.name} onChange={(v) => upClient((c) => void (c.name = v))} />}
                </Field>
                <Field label="Teléfono">{(id) => <TextInput id={id} value={client.phone ?? ''} onChange={(v) => upClient((c) => void (c.phone = v || undefined))} />}</Field>
                <Field label="Términos de pago">{(id) => <TextInput id={id} value={client.terms ?? ''} onChange={(v) => upClient((c) => void (c.terms = v || undefined))} />}</Field>
                <Field label="Dirección (Bill To)" wide>
                  {(id) => <TextInput id={id} value={client.address ?? ''} onChange={(v) => upClient((c) => void (c.address = v || undefined))} />}
                </Field>
                <Field label="Notas" wide>
                  {(id) => <TextArea id={id} value={client.notes ?? ''} onChange={(v) => upClient((c) => void (c.notes = v || undefined))} />}
                </Field>
              </div>
              <h4>Contactos</h4>
              {client.contacts.map((ct, i) => (
                <div key={ct.id} className="contact-row">
                  <TextInput ariaLabel="Nombre del contacto" placeholder="Eng. Nombre Apellido" value={ct.name} onChange={(v) => upClient((c) => void (c.contacts[i].name = v))} />
                  <TextInput ariaLabel="Puesto" placeholder="Puesto" value={ct.title ?? ''} onChange={(v) => upClient((c) => void (c.contacts[i].title = v || undefined))} />
                  <TextInput ariaLabel="Email del contacto" placeholder="email@empresa.com" value={ct.email ?? ''} onChange={(v) => upClient((c) => void (c.contacts[i].email = v || undefined))} />
                  <TextInput ariaLabel="Teléfono del contacto" placeholder="Teléfono" value={ct.phone ?? ''} onChange={(v) => upClient((c) => void (c.contacts[i].phone = v || undefined))} />
                  <button type="button" className="icon-btn icon-btn--danger" aria-label="Eliminar contacto" onClick={() => upClient((c) => void c.contacts.splice(i, 1))}>
                    ✕
                  </button>
                </div>
              ))}
              <Button variant="ghost" onClick={() => upClient((c) => void c.contacts.push({ id: newId(), name: '' }))}>
                + Contacto
              </Button>
            </Card>
          ) : (
            <p className="empty">Escoge un cliente de la lista, o importa tu Excel.</p>
          )}
        </div>
      </div>
    </>
  )
}
