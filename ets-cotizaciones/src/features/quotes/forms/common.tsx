import { newScopeItem } from '../../../domain/factories.ts'
import { defaultPdfFileName, formatQuoteNumber } from '../../../domain/format.ts'
import { SEED_PROFILES } from '../../../domain/seed/profiles.ts'
import { SEED_SIGNERS } from '../../../domain/seed/signers.ts'
import { SEED_TERMS } from '../../../domain/seed/terms.ts'
import type { ProposalTitle, Quote, QuoteStatus, RichLine, ScopeItem, ScopeLevel } from '../../../domain/types.ts'
import { SCOPE_BULLETS } from '../../../domain/types.ts'
import { Button, Card, Field, NumberInput, RowActions, Select, TextInput } from '../../../ui/controls.tsx'
import { move } from '../../../ui/list.ts'
import type { Update } from '../editorTypes.ts'
import { STATUS_LABEL } from '../labels.ts'

// ───────────────────────── Datos generales ─────────────────────────

export function HeaderForm({ quote, update }: { quote: Quote; update: Update }) {
  const h = quote.header
  const setH = (k: keyof Quote['header']) => (v: string) => update((d) => void (d.header[k] = v))
  return (
    <Card title="Datos generales">
      <div className="grid">
        <Field label="Fecha">
          {(id) => <input id={id} type="date" value={h.date} onChange={(e) => e.target.value && setH('date')(e.target.value)} />}
        </Field>
        <Field label="Quote No. (secuencia – año – revisión)" span2 hint="Temporal: en la Fase 6 se asigna automáticamente">
          {() => (
            <div className="quote-no">
              <NumberInput
                ariaLabel="Secuencia"
                value={quote.number.seq ?? 0}
                onChange={(v) => update((d) => void (d.number.seq = v > 0 ? Math.round(v) : null))}
              />
              <span>-</span>
              <NumberInput ariaLabel="Año" value={quote.number.year} onChange={(v) => update((d) => void (d.number.year = Math.round(v) || d.number.year))} />
              <span>REV</span>
              <NumberInput ariaLabel="Revisión" value={quote.number.revision} onChange={(v) => update((d) => void (d.number.revision = Math.max(0, Math.round(v))))} />
              <output className="muted">{formatQuoteNumber(quote.number, quote.type === 'tm')}</output>
            </div>
          )}
        </Field>
        <Field label="Contact">{(id) => <TextInput id={id} value={h.contact} onChange={setH('contact')} placeholder="Eng. …" />}</Field>
        <Field label="Contractor">{(id) => <TextInput id={id} value={h.contractor} onChange={setH('contractor')} />}</Field>
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
              options={SEED_SIGNERS.map((s) => ({ value: s.id, label: `${s.name} – ${s.position}` }))}
            />
          )}
        </Field>
        <Field label="Términos y condiciones">
          {(id) => (
            <Select
              id={id}
              value={quote.terms.id}
              onChange={(v) =>
                update((d) => {
                  const t = SEED_TERMS.find((x) => x.id === v)
                  if (t) d.terms = structuredClone(t)
                })
              }
              options={SEED_TERMS.map((t) => ({ value: t.id, label: t.name }))}
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
