import { useState } from 'react'
import { newId } from '../../domain/factories.ts'
import { SEED_TERMS } from '../../domain/seed/terms.ts'
import type { TermsLine } from '../../domain/types.ts'
import { Button, Card, Field, Select, TextInput } from '../../ui/controls.tsx'
import { TermsLinePreview, TermsLinesEditor } from '../terms/TermsLinesEditor.tsx'
import { useLibrary } from '../library/context.ts'

export function TermsSettings() {
  const { library, update, replace } = useLibrary()
  const versions = library.terms
  const [selectedId, setSelectedId] = useState(versions[0]?.id ?? '')
  const vi = versions.findIndex((v) => v.id === selectedId)
  const version = vi >= 0 ? versions[vi] : undefined

  const upLines = (fn: (lines: TermsLine[]) => void) => update('terms', (d) => fn(d[vi].lines))

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
            <TermsLinesEditor lines={version.lines} update={upLines} />
          </Card>

          <Card title="Así se verá">
            <div className="terms-preview">
              <strong>Terms &amp; Conditions</strong>
              {version.lines.map((line) => (
                <div key={line.id} className={`terms-preview__line${line.bullet ? '' : ' terms-preview__line--plain'}${line.size === 'large' ? ' large' : ''}`}>
                  {line.bullet ? <span className="terms-preview__bullet" style={{ background: line.bulletColor ?? '#000' }} /> : null}
                  <TermsLinePreview line={line} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
