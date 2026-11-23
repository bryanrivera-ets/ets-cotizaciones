/**
 * Editor de las líneas de términos y condiciones. Se usa en:
 * - Configuración → Términos (versiones de la biblioteca): todas las líneas abiertas.
 * - El formulario de cada cotización: líneas compactas con "Incluir" y ✎ para editar.
 */
import { useState } from 'react'
import { brand } from '../../domain/brand.ts'
import { newId } from '../../domain/factories.ts'
import type { TermsLine, TextRun } from '../../domain/types.ts'
import { Button, RowActions, Select, TextArea, TextInput } from '../../ui/controls.tsx'
import { move } from '../../ui/list.ts'

const COLORS = [
  { value: '', label: 'Negro' },
  { value: brand.colors.termsBlue, label: 'Azul' },
  { value: brand.colors.red, label: 'Rojo' },
]

/** La línea con su formato, como se verá en el PDF. */
export function TermsLinePreview({ line }: { line: TermsLine }) {
  return (
    <span>
      {line.runs.map((r, i) => (
        <span
          key={i}
          style={{
            fontWeight: r.bold ? 700 : 400,
            fontStyle: r.italic ? 'italic' : 'normal',
            color: r.href ? '#0462c1' : (r.color ?? '#000'),
            textDecoration: r.href ? 'underline' : 'none',
          }}
        >
          {r.text}
        </span>
      ))}
    </span>
  )
}

function LineTools({ line, li, count, upLines }: { line: TermsLine; li: number; count: number; upLines: (fn: (ls: TermsLine[]) => void) => void }) {
  const upRun = (ri: number, fn: (r: TextRun) => void) => upLines((ls) => fn(ls[li].runs[ri]))
  return (
    <>
      <div className="term-line__head">
        <label className="check">
          <input type="checkbox" checked={line.bullet} onChange={(e) => upLines((ls) => void (ls[li].bullet = e.target.checked))} />
          Viñeta
        </label>
        {line.bullet ? (
          <Select
            ariaLabel="Color de la viñeta"
            value={line.bulletColor ?? ''}
            options={COLORS.map((c) => ({ ...c, label: `Viñeta: ${c.label}` }))}
            onChange={(v) => upLines((ls) => void (ls[li].bulletColor = v || undefined))}
          />
        ) : null}
        <label className="check">
          <input type="checkbox" checked={line.size === 'large'} onChange={(e) => upLines((ls) => void (ls[li].size = e.target.checked ? 'large' : undefined))} />
          Letra más grande
        </label>
        <RowActions
          label="línea"
          index={li}
          count={count}
          onMove={(a, b) => upLines((ls) => move(ls, a, b))}
          onRemove={() => upLines((ls) => void ls.splice(li, 1))}
        />
      </div>
      {line.runs.map((run, ri) => (
        <div key={ri} className="term-run">
          <TextArea ariaLabel={`Texto de la línea ${li + 1}, parte ${ri + 1}`} rows={1} value={run.text} onChange={(v) => upRun(ri, (r) => void (r.text = v))} />
          <div className="term-run__tools">
            <label className="check" title="Negrita">
              <input type="checkbox" checked={!!run.bold} onChange={(e) => upRun(ri, (r) => void (r.bold = e.target.checked || undefined))} />
              <b>N</b>
            </label>
            <label className="check" title="Itálica">
              <input type="checkbox" checked={!!run.italic} onChange={(e) => upRun(ri, (r) => void (r.italic = e.target.checked || undefined))} />
              <i>I</i>
            </label>
            <Select ariaLabel="Color del texto" value={run.color ?? ''} options={COLORS} onChange={(v) => upRun(ri, (r) => void (r.color = v || undefined))} />
            <TextInput
              className="term-run__link"
              ariaLabel="Enlace (email)"
              placeholder="Enlace: mailto:…"
              value={run.href ?? ''}
              onChange={(v) => upRun(ri, (r) => void (r.href = v.trim() || undefined))}
            />
            <button
              type="button"
              className="icon-btn icon-btn--danger"
              aria-label="Eliminar esta parte"
              disabled={line.runs.length === 1}
              onClick={() => upLines((ls) => void ls[li].runs.splice(ri, 1))}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <Button variant="ghost" onClick={() => upLines((ls) => void ls[li].runs.push({ text: '' }))}>
        + Parte con otro formato
      </Button>
    </>
  )
}

export function TermsLinesEditor({
  lines,
  update,
  compact = false,
}: {
  lines: TermsLine[]
  update: (fn: (lines: TermsLine[]) => void) => void
  /** Modo cotización: casilla "Incluir", texto resumido y ✎ para abrir el editor de la línea */
  compact?: boolean
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const addLine = () => {
    const line: TermsLine = { id: newId(), bullet: true, runs: [{ text: '' }] }
    update((ls) => void ls.push(line))
    if (compact) setOpen((s) => new Set(s).add(line.id))
  }

  return (
    <div className={compact ? 'terms-editor terms-editor--compact' : 'terms-editor'}>
      {lines.map((line, li) =>
        compact ? (
          <div key={line.id} className={`term-row${line.hidden ? ' term-row--off' : ''}`}>
            <div className="term-row__main">
              <label className="check term-row__include" title={line.hidden ? 'No sale en el PDF' : 'Sale en el PDF'}>
                <input type="checkbox" checked={!line.hidden} onChange={(e) => update((ls) => void (ls[li].hidden = e.target.checked ? undefined : true))} />
              </label>
              <div className="term-row__text">
                {line.bullet ? <span className="terms-preview__bullet" style={{ background: line.bulletColor ?? '#000' }} /> : null}
                <TermsLinePreview line={line} />
                {!line.runs.some((r) => r.text.trim()) ? <em className="muted">(línea vacía)</em> : null}
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-expanded={open.has(line.id)}
                aria-label={`Editar línea ${li + 1}`}
                title="Editar el texto y el formato de esta línea"
                onClick={() => toggle(line.id)}
              >
                {open.has(line.id) ? '▴' : '✎'}
              </button>
            </div>
            {open.has(line.id) ? (
              <div className="term-line">
                <LineTools line={line} li={li} count={lines.length} upLines={update} />
              </div>
            ) : null}
          </div>
        ) : (
          <div key={line.id} className="term-line">
            <strong className="term-line__num">{li + 1}</strong>
            <LineTools line={line} li={li} count={lines.length} upLines={update} />
          </div>
        ),
      )}
      <Button onClick={addLine}>+ Agregar línea</Button>
    </div>
  )
}
