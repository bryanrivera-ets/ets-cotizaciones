import { defaultPdfFileName, formatQuoteNumber } from '../../../domain/format.ts'
import { findClient, findContact } from '../../../domain/clients.ts'
import { newId, newScopeItem } from '../../../domain/factories.ts'
import { systemFromSection } from '../../../domain/library.ts'
import { termsCustomized } from '../../../domain/terms.ts'
import type { ProposalTitle, Quote, QuoteStatus, RichLine, ScopeItem, ScopeLevel } from '../../../domain/types.ts'
import { SCOPE_BULLETS } from '../../../domain/types.ts'
import { Button, Card, Field, RowActions, Select, TextInput } from '../../../ui/controls.tsx'
import { move } from '../../../ui/list.ts'
import { useState } from 'react'
import { backend } from '../../../services/backend/index.ts'
import { useLibrary } from '../../library/context.ts'
import type { Update } from '../editorTypes.ts'
import { STATUS_LABEL } from '../labels.ts'

// ───────────────────────── Datos generales ─────────────────────────

export function HeaderForm({ quote, update }: { quote: Quote; update: Update }) {
  const { library } = useLibrary()
  const { profiles: SEED_PROFILES, signers: SEED_SIGNERS, terms: SEED_TERMS } = library
  const h = quote.header
  const setH = (k: keyof Quote['header']) => (v: string) => update((d) => void (d.header[k] = v))
  return (
    <Card title="Datos generales">
      <div className="grid">
        <Field label="Fecha">
          {(id) => <input id={id} type="date" value={h.date} onChange={(e) => e.target.value && setH('date')(e.target.value)} />}
        </Field>
        <Field label="Quote No." span2>
          {() => <QuoteNumberField quote={quote} />}
        </Field>
        <ClientFields quote={quote} update={update} />
        <Field label="Project/Area" wide hint="Se imprime en mayúsculas">
          {(id) => <TextInput id={id} value={h.projectArea} onChange={setH('projectArea')} />}
        </Field>
        <Field label="Location">{(id) => <TextInput id={id} value={h.location} placeholder="Ciudad, Puerto Rico" onChange={setH('location')} />}</Field>
        {quote.type !== 'tm' ? (
          <Field label="Título">
            {(id) => (
              <Select<ProposalTitle>
                id={id}
                value={quote.title}
                onChange={(v) => update((d) => void (d.title = v))}
                options={[
                  { value: 'ETS CORP. P R O P O S A L', label: 'ETS CORP. P R O P O S A L' },
                  { value: 'P R O P O S A L', label: 'P R O P O S A L' },
                ]}
              />
            )}
          </Field>
        ) : null}
        <Field label="Preparada por">
          {(id) => (
            <Select
              id={id}
              value={SEED_PROFILES.find((p) => p.initials === quote.preparedBy.initials)?.id ?? ''}
              onChange={(v) =>
                update((d) => {
                  const p = SEED_PROFILES.find((x) => x.id === v)
                  if (p) d.preparedBy = { name: p.name, initials: p.initials }
                })
              }
              options={[
                ...(SEED_PROFILES.some((p) => p.initials === quote.preparedBy.initials)
                  ? []
                  : [{ value: '', label: `${quote.preparedBy.name} (${quote.preparedBy.initials})` }]),
                ...SEED_PROFILES.map((p) => ({ value: p.id, label: `${p.name} (${p.initials})` })),
              ]}
            />
          )}
        </Field>
        <Field label="Firma (Acknowledge by)">
          {(id) => (
            <Select
              id={id}
              value={quote.signer.id}
              onChange={(v) =>
                update((d) => {
                  const s = SEED_SIGNERS.find((x) => x.id === v)
                  if (s) d.signer = structuredClone(s)
                })
              }
              options={[
                ...(SEED_SIGNERS.some((s) => s.id === quote.signer.id) ? [] : [{ value: quote.signer.id, label: `${quote.signer.name} (copia guardada)` }]),
                ...SEED_SIGNERS.map((s) => ({ value: s.id, label: `${s.name} – ${s.position}` })),
              ]}
            />
          )}
        </Field>
        <Field label="Términos y condiciones">
          {(id) => (
            <Select
              id={id}
              value={quote.terms.id}
              onChange={(v) => {
                const t = SEED_TERMS.find((x) => x.id === v)
                if (!t) return
                const changed = termsCustomized(quote.terms, SEED_TERMS.find((x) => x.id === quote.terms.id))
                if (changed && !confirm('Los términos de esta cotización tienen cambios. Al escoger otra versión se pierden. ¿Continuar?')) return
                update((d) => void (d.terms = structuredClone(t)))
              }}
              options={[
                ...(SEED_TERMS.some((t) => t.id === quote.terms.id) ? [] : [{ value: quote.terms.id, label: `${quote.terms.name} (copia guardada)` }]),
                ...SEED_TERMS.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          )}
        </Field>
        <Field label="Estado">
          {(id) => (
            <Select<QuoteStatus>
              id={id}
              value={quote.status}
              onChange={(v) => update((d) => void (d.status = v))}
              options={(Object.keys(STATUS_LABEL) as QuoteStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            />
          )}
        </Field>
        <Field label="Nombre del PDF" wide hint="Vacío = nombre por defecto">
          {(id) => (
            <TextInput
              id={id}
              value={quote.pdfFileName ?? ''}
              placeholder={defaultPdfFileName(quote)}
              onChange={(v) => update((d) => void (d.pdfFileName = v))}
            />
          )}
        </Field>
      </div>
    </Card>
  )
}

// ───────────────────────── Scope of Work ─────────────────────────

export function ScopeEditor({ items, update }: { items: ScopeItem[]; update: (recipe: (scope: ScopeItem[]) => void) => void }) {
  const setLevel = (i: number, level: ScopeLevel) => update((s) => void (s[i].level = level))
  return (
    <div className="scope">
      {items.map((item, i) => (
        <div key={item.id} className="scope__row" style={{ paddingLeft: (item.level - 1) * 24 }}>
          <div className="scope__level" role="group" aria-label="Nivel de viñeta">
            <button
              type="button"
              className="icon-btn"
              title="Menos sangría"
              aria-label="Menos sangría"
              disabled={item.level === 1}
              onClick={() => setLevel(i, (item.level - 1) as ScopeLevel)}
            >
              ←
            </button>
            <span className="scope__bullet" title={`Nivel ${item.level}`}>
              {SCOPE_BULLETS[item.level]}
            </span>
            <button
              type="button"
              className="icon-btn"
              title="Más sangría"
              aria-label="Más sangría"
              disabled={item.level === 3}
              onClick={() => setLevel(i, (item.level + 1) as ScopeLevel)}
            >
              →
            </button>
          </div>
          <TextInput
            className="grow"
            ariaLabel={`Línea ${i + 1} del scope`}
            value={item.text}
            onChange={(v) => update((s) => void (s[i].text = v))}
          />
          <RowActions
            label="línea"
            index={i}
            count={items.length}
            onMove={(a, b) => update((s) => move(s, a, b))}
            onRemove={() => update((s) => void s.splice(i, 1))}
          />
        </div>
      ))}
      <Button variant="ghost" onClick={() => update((s) => void s.push(newScopeItem('', items.at(-1)?.level ?? 1)))}>
        + Agregar línea
      </Button>
    </div>
  )
}

// ───────────────────────── Líneas con texto pequeño (descripción / cantidad) ─────────────────────────

export function RichLinesEditor({
  lines,
  update,
  label,
  placeholder,
  notePlaceholder,
}: {
  lines: RichLine[]
  update: (recipe: (lines: RichLine[]) => void) => void
  label: string
  placeholder?: string
  notePlaceholder?: string
}) {
  return (
    <div className="rich-lines">
      {lines.map((l, i) => (
        <div key={i} className="rich-lines__row">
          <TextInput className="grow" ariaLabel={`${label} ${i + 1}`} value={l.text} placeholder={placeholder} onChange={(v) => update((ls) => void (ls[i].text = v))} />
          <TextInput
            className="note"
            ariaLabel={`Texto pequeño ${i + 1}`}
            value={l.note ?? ''}
            placeholder={notePlaceholder ?? '(texto pequeño)'}
            onChange={(v) => update((ls) => void (ls[i].note = v || undefined))}
          />
          <label className="check" title="Negrita">
            <input type="checkbox" checked={!!l.bold} onChange={(e) => update((ls) => void (ls[i].bold = e.target.checked || undefined))} />
            <b>N</b>
          </label>
          <label className="check" title="Toda la línea en letra pequeña">
            <input type="checkbox" checked={!!l.small} onChange={(e) => update((ls) => void (ls[i].small = e.target.checked || undefined))} />
            <small>peq.</small>
          </label>
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            aria-label={`Eliminar ${label} ${i + 1}`}
            disabled={lines.length === 1}
            onClick={() => update((ls) => void ls.splice(i, 1))}
          >
            ✕
          </button>
        </div>
      ))}
      <Button variant="ghost" onClick={() => update((ls) => void ls.push({ text: '' }))}>
        + Línea
      </Button>
    </div>
  )
}

// ───────────────────────── Sistema de la biblioteca ─────────────────────────

/** Escoge un sistema (llena To Be Performed + Scope) o guarda lo escrito como sistema nuevo. */
export function SystemPicker({
  target,
  onApply,
}: {
  target: { toBePerformed: string; scope: ScopeItem[]; systemId?: string }
  onApply: (systemId: string) => void
}) {
  const { library, update } = useLibrary()
  const current = library.systems.find((s) => s.id === target.systemId)
  return (
    <div className="system-picker">
      <select
        aria-label="Sistema de la biblioteca"
        value=""
        onChange={(e) => {
          const id = e.target.value
          if (!id) return
          const hasText = target.scope.some((s) => s.text.trim())
          if (hasText && !confirm('¿Reemplazar el To Be Performed y el Scope por los del sistema escogido?')) return
          onApply(id)
        }}
      >
        <option value="">{current ? `Sistema: ${current.name} — cambiar…` : 'Cargar sistema de la biblioteca…'}</option>
        {library.systems.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <Button
        variant="ghost"
        title="Guarda el To Be Performed y el Scope de esta sección como un sistema nuevo"
        onClick={() => {
          const name = prompt('Nombre del sistema nuevo para la biblioteca:', current ? `${current.name} (variante)` : '')
          if (!name?.trim()) return
          update('systems', (d) => void d.push(systemFromSection(name.trim(), target)))
          alert(`Se guardó "${name.trim()}" en la biblioteca de sistemas.`)
        }}
      >
        Guardar en biblioteca
      </Button>
    </div>
  )
}

// ───────────────────────── Número oficial ─────────────────────────

/**
 * Muestra el número. Si todavía no tiene, se asigna solo al haber conexión;
 * "Reservar número" lo pide en ese momento. "Editar" permite escribirlo a mano
 * (avisa si ya existe y hace avanzar el contador para no repetirlo).
 */
function QuoteNumberField({ quote }: { quote: Quote }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [seq, setSeq] = useState('')
  const [year, setYear] = useState('')
  const dateYear = Number(quote.header.date.slice(0, 4))
  const offlineMsg = 'Sin conexión: el número se puede cambiar cuando vuelva el internet.'

  const reserve = async () => {
    setBusy(true)
    setError(null)
    try {
      await backend.numbering.reserve(quote.id, dateYear)
    } catch (e) {
      setError(navigator.onLine ? `No se pudo reservar: ${(e as Error).message}` : 'Sin conexión: el número se asignará solo cuando vuelva el internet.')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = () => {
    setSeq(quote.number.seq !== null ? String(quote.number.seq) : '')
    setYear(String(quote.number.seq !== null ? quote.number.year : dateYear))
    setError(null)
    setEditing(true)
  }

  const save = async () => {
    const n = Number(seq)
    const y = Number(year)
    if (!Number.isInteger(n) || n < 1 || n > 9999) return setError('Escribe un número de secuencia válido (por ejemplo 453).')
    if (!Number.isInteger(y) || y < 2000 || y > 2099) return setError('Escribe el año completo (por ejemplo 2026).')
    if (n === quote.number.seq && y === quote.number.year) return setEditing(false)
    const label = formatQuoteNumber({ seq: n, year: y, revision: 0 })
    setBusy(true)
    setError(null)
    try {
      const others = (await backend.numbering.findByNumber(n, y)).filter((s) => s.quote.id !== quote.id && !s.locked)
      if (others.length) {
        const list = others.map((s) => `• ${formatQuoteNumber(s.quote.number, s.quote.type === 'tm')} – ${s.quote.header.projectArea || 'sin proyecto'}`).join('\n')
        if (!confirm(`El número ${label} ya lo usa:\n${list}\n\n¿Usarlo de todas formas?`)) return
      }
      await backend.numbering.setManual(quote.id, n, y)
      void backend.changelog.add(
        'counters',
        `Numeración: cambió ${formatQuoteNumber(quote.number, quote.type === 'tm')} a ${formatQuoteNumber({ ...quote.number, seq: n, year: y }, quote.type === 'tm')} (${quote.header.projectArea || 'sin proyecto'})`,
      )
      setEditing(false)
    } catch (e) {
      setError(navigator.onLine ? `No se pudo cambiar el número: ${(e as Error).message}` : offlineMsg)
    } finally {
      setBusy(false)
    }
  }

  if (editing)
    return (
      <div className="quote-no">
        <div className="quote-no__edit">
          <input aria-label="Secuencia" inputMode="numeric" value={seq} placeholder="453" onChange={(e) => setSeq(e.target.value.replace(/\D/g, ''))} />
          <span>-</span>
          <input aria-label="Año" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))} />
          {quote.number.revision > 0 ? <span className="muted">REV {quote.number.revision}</span> : null}
        </div>
        <Button variant="primary" onClick={save} disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
          Cancelar
        </Button>
        <small className="hint">El contador avanza solo si el número es mayor, para que nunca se repita.</small>
        {error ? <small className="warning">{error}</small> : null}
      </div>
    )

  return (
    <div className="quote-no">
      <output className="quote-no__value">{formatQuoteNumber(quote.number, quote.type === 'tm')}</output>
      {quote.number.seq === null ? (
        <Button onClick={reserve} disabled={busy}>
          {busy ? 'Reservando…' : 'Reservar número'}
        </Button>
      ) : null}
      <Button variant="ghost" onClick={startEdit} disabled={busy} title="Escribir el número a mano">
        ✎ Editar
      </Button>
      {quote.number.seq === null ? <small className="hint">Sin número todavía: se asigna solo al haber conexión, o escríbelo con Editar.</small> : null}
      {error ? <small className="warning">{error}</small> : null}
    </div>
  )
}

// ───────────────────────── Contractor / contacto con la libreta de clientes ─────────────────────────

/**
 * Contractor con sugerencias de la libreta: al escoger un cliente se llenan el contacto y su email
 * (solo si están vacíos). Al escoger un contacto se pone su email.
 */
function ClientFields({ quote, update }: { quote: Quote; update: Update }) {
  const { library, update: updateLib } = useLibrary()
  const clients = library.clients
  const h = quote.header
  const client = findClient(clients, h.contractor)
  const contact = findContact(client, h.contact)

  const setContractor = (v: string) =>
    update((d) => {
      d.header.contractor = v
      const c = findClient(clients, v)
      const first = c?.contacts[0]
      if (c && first && !d.header.contact.trim()) {
        d.header.contact = first.name
        if (!d.header.contactEmail && first.email) d.header.contactEmail = first.email
      }
    })

  const setContact = (v: string) =>
    update((d) => {
      d.header.contact = v
      const ct = findContact(client, v)
      // Pone el email del contacto escogido (si estaba vacío o era el de otro contacto del mismo cliente)
      const wasOther = client?.contacts.some((x) => x.email && x.email === d.header.contactEmail)
      if (ct?.email && (!d.header.contactEmail || wasOther)) d.header.contactEmail = ct.email
    })

  const canSave = h.contractor.trim() && (!client || (h.contact.trim() && !contact) || (contact && h.contactEmail && !contact.email))
  const save = () => {
    const ct = { id: newId(), name: h.contact.trim(), email: h.contactEmail?.trim() || undefined }
    if (!client) {
      updateLib('clients', (d) => {
        d.push({ id: newId(), name: h.contractor.trim(), contacts: ct.name || ct.email ? [ct] : [] })
        d.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
      })
    } else
      updateLib('clients', (d) => {
        const c = d.find((x) => x.id === client.id)
        if (!c) return
        const ex = c.contacts.find((x) => x.id === contact?.id)
        if (ex) ex.email = ct.email
        else c.contacts.push(ct)
      })
  }

  return (
    <>
      <Field label="Contractor" hint={client ? `✓ En tu libreta de clientes${client.terms ? ` · ${client.terms}` : ''}` : 'Escribe para buscar en tus clientes'}>
        {(id) => (
          <>
            <input id={id} list="ets-clients" autoComplete="off" value={h.contractor} onChange={(e) => setContractor(e.target.value)} />
            <datalist id="ets-clients">
              {clients.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <Field label="Contact" hint={client && client.contacts.length > 1 ? `${client.contacts.length} contactos guardados: escoge uno` : undefined}>
        {(id) => (
          <>
            <input id={id} list="ets-client-contacts" autoComplete="off" value={h.contact} placeholder="Eng. …" onChange={(e) => setContact(e.target.value)} />
            <datalist id="ets-client-contacts">
              {(client?.contacts ?? []).map((c) => (
                <option key={c.id} value={c.name}>
                  {[c.title, c.email].filter(Boolean).join(' · ')}
                </option>
              ))}
            </datalist>
          </>
        )}
      </Field>
      <Field label="Email del contacto" hint="Para enviarle la cotización (no sale en el PDF)">
        {(id) => (
          <input
            id={id}
            type="email"
            inputMode="email"
            value={h.contactEmail ?? ''}
            placeholder="nombre@empresa.com"
            onChange={(e) => update((d) => void (d.header.contactEmail = e.target.value || undefined))}
          />
        )}
      </Field>
      {canSave ? (
        <div className="field field--wide contractor-hint">
          <span>{!client ? `"${h.contractor.trim()}" no está en tu libreta de clientes.` : contact ? 'Este email no está en la libreta.' : `"${h.contact.trim()}" no está entre los contactos de ${client.name}.`}</span>
          <button type="button" className="link" onClick={save}>
            + Guardar en clientes
          </button>
        </div>
      ) : null}
    </>
  )
}
