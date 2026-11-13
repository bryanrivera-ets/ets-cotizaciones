import { useState } from 'react'
import { brand } from '../../domain/brand.ts'
import { newId } from '../../domain/factories.ts'
import { SEED_TERMS } from '../../domain/seed/terms.ts'
import type { TermsLine, TextRun } from '../../domain/types.ts'
import { Button, Card, Field, RowActions, Select, TextArea, TextInput } from '../../ui/controls.tsx'
import { move } from '../../ui/list.ts'
import { useLibrary } from '../library/context.ts'

const COLORS = [
  { value: '', label: 'Negro' },
  { value: brand.colors.termsBlue, label: 'Azul' },
  { value: brand.colors.red, label: 'Rojo' },
]

export function TermsSettings() {
  const { library, update, replace } = useLibrary()
  const versions = library.terms
  const [selectedId, setSelectedId] = useState(versions[0]?.id ?? '')
  const vi = versions.findIndex((v) => v.id === selectedId)
  const version = vi >= 0 ? versions[vi] : undefined

  const upLines = (fn: (lines: TermsLine[]) => void) => update('terms', (d) => fn(d[vi].lines))
  const upRun = (li: number, ri: number, fn: (r: TextRun) => void) => upLines((ls) => fn(ls[li].runs[ri]))

  const duplicate = () => {
    if (!version) return
    const copy = { ...structuredClone(version), id: newId(), name: `${version.name} (copia)` }
    update('terms', (d) => void d.push(copy))
    setSelectedId(copy.id)
  }

  const remove = () => {
    if (!version) return
    const used = library.profiles.filter((p) => p.preferredTermsId === version.id)
    if (used.length) return alert(`No se puede eliminar: la usan los perfiles ${used.map((p) => p.initials).join(', ')}.`)
    if (!confirm(`¿Eliminar "${version.name}"? Las cotizaciones existentes no cambian.`)) return
    update('terms', (d) => void d.splice(vi, 1))
    setSelectedId(versions.find((v) => v.id !== version.id)?.id ?? '')
  }

  const restore = () => {
    if (!version) return
    const seed = SEED_TERMS.find((s) => s.id === version.id)
    if (!seed) return alert('Esta versión no es una de las originales.')
    if (confirm('¿Volver al texto original de esta versión? Se pierden los cambios hechos.'))
      replace('terms', versions.map((v) => (v.id === seed.id ? structuredClone(seed) : v)))
  }

  return (
    <div className="terms-settings">
      <div className="btn-row">
        <Select ariaLabel="Versión de términos" value={selectedId} onChange={setSelectedId} options={versions.map((v) => ({ value: v.id, label: v.name }))} />
        <Button onClick={duplicate}>Duplicar como versión nueva</Button>
        <Button variant="ghost" onClick={restore}>
          Restaurar original
        </Button>
        <Button variant="danger" onClick={remove}>
          Eliminar versión
        </Button>
      </div>

      {version ? (
        <div className="terms-layout">
          <Card title="Editar">
            <Field label="Nombre de la versión" wide>
              {(id) => <TextInput id={id} value={version.name} onChange={(v) => update('terms', (d) => void (d[vi].name = v))} />}
            </Field>
            <p className="muted small">
              Cada línea puede tener varias partes con formato distinto (ej. texto normal + un enlace). Los cambios se guardan solos; las
              cotizaciones existentes no cambian.
            </p>
            {version.lines.map((line, li) => (
              <div key={line.id} className="term-line">
                <div className="term-line__head">
                  <strong>{li + 1}</strong>
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
                    <input
                      type="checkbox"
                      checked={line.size === 'large'}
                      onChange={(e) => upLines((ls) => void (ls[li].size = e.target.checked ? 'large' : undefined))}
                    />
                    Letra más grande
                  </label>
                  <RowActions
                    label="línea"
                    index={li}
                    count={version.lines.length}
                    onMove={(a, b) => upLines((ls) => move(ls, a, b))}
                    onRemove={() => upLines((ls) => void ls.splice(li, 1))}
                  />
                </div>
                {line.runs.map((run, ri) => (
                  <div key={ri} className="term-run">
                    <TextArea ariaLabel={`Texto de la línea ${li + 1}, parte ${ri + 1}`} rows={1} value={run.text} onChange={(v) => upRun(li, ri, (r) => void (r.text = v))} />
                    <div className="term-run__tools">
                      <label className="check" title="Negrita">
                        <input type="checkbox" checked={!!run.bold} onChange={(e) => upRun(li, ri, (r) => void (r.bold = e.target.checked || undefined))} />
                        <b>N</b>
                      </label>
                      <label className="check" title="Itálica">
                        <input type="checkbox" checked={!!run.italic} onChange={(e) => upRun(li, ri, (r) => void (r.italic = e.target.checked || undefined))} />
                        <i>I</i>
                      </label>
                      <Select ariaLabel="Color del texto" value={run.color ?? ''} options={COLORS} onChange={(v) => upRun(li, ri, (r) => void (r.color = v || undefined))} />
                      <TextInput
                        className="term-run__link"
                        ariaLabel="Enlace (email)"
                        placeholder="Enlace: mailto:…"
                        value={run.href ?? ''}
                        onChange={(v) => upRun(li, ri, (r) => void (r.href = v.trim() || undefined))}
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
              </div>
            ))}
            <Button onClick={() => upLines((ls) => void ls.push({ id: newId(), bullet: true, runs: [{ text: '' }] }))}>+ Agregar línea</Button>
          </Card>

          <Card title="Así se verá">
            <div className="terms-preview">
              <strong>Terms &amp; Conditions</strong>
              {version.lines.map((line) => (
                <div key={line.id} className={`terms-preview__line${line.bullet ? '' : ' terms-preview__line--plain'}${line.size === 'large' ? ' large' : ''}`}>
                  {line.bullet ? <span className="terms-preview__bullet" style={{ background: line.bulletColor ?? '#000' }} /> : null}
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
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
