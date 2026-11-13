import { newId } from '../../domain/factories.ts'
import type { HoursSource } from '../../domain/types.ts'
import { Button, Card, RowActions, Select, TextInput } from '../../ui/controls.tsx'
import { move } from '../../ui/list.ts'
import { useLibrary } from '../library/context.ts'

const HOURS: { value: HoursSource; label: string }[] = [
  { value: 'supervisor', label: 'Horas del calendario: Supervisor' },
  { value: 'labor', label: 'Horas del calendario: Labor' },
  { value: 'pm', label: 'Horas del calendario: Project Manager' },
  { value: 'manual', label: 'Horas escritas a mano' },
]

export function CatalogSettings() {
  const { library, update } = useLibrary()
  return (
    <>
      <Card title="Materiales y equipo (T&M)">
        <p className="muted">Solo nombre y unidad. La cantidad y el precio se escriben en cada cotización.</p>
        <div className="tbl tbl--catalog">
          <div className="tbl__head">
            <span>DESCRIPCIÓN</span>
            <span>UNIDAD</span>
            <span />
          </div>
          {library.materials.map((m, i) => (
            <div key={m.id} className="tbl__row">
              <TextInput ariaLabel="Descripción" value={m.name} onChange={(v) => update('materials', (d) => void (d[i].name = v))} />
              <TextInput ariaLabel="Unidad" value={m.unit} onChange={(v) => update('materials', (d) => void (d[i].unit = v))} />
              <RowActions
                label="material"
                index={i}
                count={library.materials.length}
                onMove={(a, b) => update('materials', (d) => move(d, a, b))}
                onRemove={() => update('materials', (d) => void d.splice(i, 1))}
              />
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={() => update('materials', (d) => void d.push({ id: newId(), name: '', unit: 'Ea' }))}>
          + Material o equipo
        </Button>
      </Card>

      <Card title="Posiciones de mano de obra (T&M)">
        <div className="tbl tbl--catalog">
          <div className="tbl__head">
            <span>POSICIÓN</span>
            <span>DE DÓNDE SALEN LAS HORAS</span>
            <span />
          </div>
          {library.positions.map((p, i) => (
            <div key={p.id} className="tbl__row">
              <TextInput ariaLabel="Posición" value={p.name} onChange={(v) => update('positions', (d) => void (d[i].name = v))} />
              <Select<HoursSource> ariaLabel="Origen de las horas" value={p.hoursSource} options={HOURS} onChange={(v) => update('positions', (d) => void (d[i].hoursSource = v))} />
              <RowActions
                label="posición"
                index={i}
                count={library.positions.length}
                onMove={(a, b) => update('positions', (d) => move(d, a, b))}
                onRemove={() => update('positions', (d) => void d.splice(i, 1))}
              />
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={() => update('positions', (d) => void d.push({ id: newId(), name: '', hoursSource: 'manual' }))}>
          + Posición
        </Button>
      </Card>
    </>
  )
}
