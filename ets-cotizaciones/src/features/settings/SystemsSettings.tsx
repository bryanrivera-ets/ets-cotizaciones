import { useState } from 'react'
import { newId, newScopeItem } from '../../domain/factories.ts'
import { cloneScope } from '../../domain/library.ts'
import { SEED_SYSTEMS } from '../../domain/seed/systems.ts'
import { SCOPE_BULLETS } from '../../domain/types.ts'
import { Button, Card, Field, TextArea, TextInput } from '../../ui/controls.tsx'
import { ScopeEditor } from '../quotes/forms/common.tsx'
import { useLibrary } from '../library/context.ts'

export function SystemsSettings() {
  const { library, update } = useLibrary()
  const systems = library.systems
  const [selectedId, setSelectedId] = useState<string | null>(systems[0]?.id ?? null)
  const [filter, setFilter] = useState('')
  const index = systems.findIndex((s) => s.id === selectedId)
  const system = index >= 0 ? systems[index] : undefined
  const visible = systems.filter((s) => s.name.toLowerCase().includes(filter.trim().toLowerCase()))

  const add = () => {
    const s = {
      id: newId(),
      name: 'Sistema nuevo',
      toBePerformed: 'Installation of ____ System on the reference project which consist on the following:',
      scope: [newScopeItem('Surface preparation with diamond grinder'), newScopeItem('Installation of:')],
    }
    update('systems', (d) => void d.push(s))
    setSelectedId(s.id)
  }

  const duplicate = () => {
    if (!system) return
    const s = { ...structuredClone(system), id: newId(), name: `${system.name} (copia)`, scope: cloneScope(system.scope) }
    update('systems', (d) => void d.splice(index + 1, 0, s))
    setSelectedId(s.id)
  }

  const remove = () => {
    if (!system || !confirm(`¿Eliminar el sistema "${system.name}"? Las cotizaciones que ya lo usan no cambian.`)) return
    update('systems', (d) => void d.splice(index, 1))
    setSelectedId(systems[index + 1]?.id ?? systems[index - 1]?.id ?? null)
  }

  const restoreMissing = () => {
    const missing = SEED_SYSTEMS.filter((s) => !systems.some((x) => x.id === s.id))
    if (missing.length === 0) return alert('Todos los sistemas iniciales ya están en la biblioteca.')
    update('systems', (d) => void d.push(...structuredClone(missing)))
  }

  return (
    <div className="master-detail">
      <div className="master">
        <TextInput ariaLabel="Buscar sistema" placeholder="Buscar…" value={filter} onChange={setFilter} />
        <ul className="master__list">
          {visible.map((s) => (
            <li key={s.id}>
              <button aria-current={s.id === selectedId} onClick={() => setSelectedId(s.id)}>
                {s.name || <em>Sin nombre</em>}
                <small className="muted">{s.scope.length} líneas</small>
              </button>
            </li>
          ))}
        </ul>
        <div className="btn-row">
          <Button variant="primary" onClick={add}>
            + Nuevo sistema
          </Button>
          <Button variant="ghost" onClick={restoreMissing} title="Vuelve a agregar los sistemas de los ejemplos que se hayan borrado">
            Restaurar iniciales
          </Button>
        </div>
      </div>

      <div className="detail">
        {system ? (
          <Card
            title="Editar sistema"
            actions={
              <div className="btn-row">
                <Button onClick={duplicate}>Duplicar</Button>
                <Button variant="danger" onClick={remove}>
                  Eliminar
                </Button>
              </div>
            }
          >
            <Field label="Nombre (solo para la lista)" wide>
              {(id) => <TextInput id={id} value={system.name} onChange={(v) => update('systems', (d) => void (d[index].name = v))} />}
            </Field>
            <Field label="TO BE PERFORMED" wide>
              {(id) => <TextArea id={id} value={system.toBePerformed} onChange={(v) => update('systems', (d) => void (d[index].toBePerformed = v))} />}
            </Field>
            <h4>SCOPE OF WORK</h4>
            <ScopeEditor items={system.scope} update={(fn) => update('systems', (d) => fn(d[index].scope))} />
            <h4>Así se verá</h4>
            <div className="scope-preview">
              <p>{system.toBePerformed}</p>
              {system.scope.map((s) => (
                <div key={s.id} style={{ paddingLeft: 18 + (s.level - 1) * 28 }}>
                  <span className="scope-preview__bullet">{SCOPE_BULLETS[s.level]}</span> {s.text}
                </div>
              ))}
            </div>
            <p className="muted small">Los cambios se guardan solos. Las cotizaciones existentes no cambian.</p>
          </Card>
        ) : (
          <p className="empty">Escoge un sistema de la lista o crea uno nuevo.</p>
        )}
      </div>
    </div>
  )
}
