import { computeLumpSum } from '../../../domain/calc/lumpSum.ts'
import { newLineItem, newPriceGroup, newSection } from '../../../domain/factories.ts'
import { formatMoney } from '../../../domain/money.ts'
import type { LumpSumQuote, PriceGroup } from '../../../domain/types.ts'
import { Button, Card, Computed, Field, MoneyInput, RowActions, TextArea, TextInput } from '../../../ui/controls.tsx'
import { move } from '../../../ui/list.ts'
import type { Update } from '../editorTypes.ts'
import { applySystem } from '../../../domain/library.ts'
import { useLibrary } from '../../library/context.ts'
import { RichLinesEditor, ScopeEditor, SystemPicker } from './common.tsx'

export function LumpSumForm({ quote, update }: { quote: LumpSumQuote; update: Update<LumpSumQuote> }) {
  const result = computeLumpSum(quote)
  const { library } = useLibrary()
  return (
    <>
      <Card title="Separación Material / Labor">
        <div className="grid">
          <Field label="% de material" hint="Material = % del total, redondeado al dólar. Labor = Total − Material.">
            {(id) => (
              <div className="number">
                <input
                  id={id}
                  inputMode="decimal"
                  value={quote.materialPercent}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d.]/g, '')
                    update((d) => void (d.materialPercent = v || '0'))
                  }}
                />
                <span aria-hidden>%</span>
              </div>
            )}
          </Field>
        </div>
      </Card>

      {quote.sections.map((section, si) => {
        const r = result.sections[si]
        const upSection = (fn: (s: typeof section) => void) => update((d) => fn(d.sections[si]))
        return (
          <Card
            key={section.id}
            title={`Sección ${si + 1}${quote.sections.length > 1 ? ' (página propia)' : ''}`}
            actions={
              <RowActions
                label="sección"
                index={si}
                count={quote.sections.length}
                canRemove={quote.sections.length > 1}
                onMove={(a, b) => update((d) => move(d.sections, a, b))}
                onRemove={() => confirm('¿Eliminar esta sección?') && update((d) => void d.sections.splice(si, 1))}
              />
            }
          >
            <SystemPicker
              target={section}
              onApply={(sid) => {
                const sys = library.systems.find((x) => x.id === sid)
                if (sys) upSection((s) => applySystem(s, sys))
              }}
            />
            <Field label="TO BE PERFORMED" wide>
              {(id) => <TextArea id={id} value={section.toBePerformed} onChange={(v) => upSection((s) => void (s.toBePerformed = v))} />}
            </Field>
            <h4>SCOPE OF WORK</h4>
            <ScopeEditor items={section.scope} update={(fn) => upSection((s) => fn(s.scope))} />

            <h4>Tabla de precios</h4>
            {section.groups.map((group, gi) => (
              <GroupEditor
                key={group.id}
                group={group}
                index={gi}
                count={section.groups.length}
                split={r.groups[gi]}
                update={(fn) => upSection((s) => fn(s.groups[gi]))}
                onMove={(a, b) => upSection((s) => move(s.groups, a, b))}
                onRemove={() => upSection((s) => void s.groups.splice(gi, 1))}
              />
            ))}
            <Button variant="ghost" onClick={() => upSection((s) => void s.groups.push(newPriceGroup()))}>
              + Grupo de precio
            </Button>

            <div className="totals">
              <Computed label="Material" value={formatMoney(r.materialCents)} />
              <Computed label="Labor" value={formatMoney(r.laborCents)} />
              <Computed label="Total" value={formatMoney(r.totalCents)} strong />
              <Computed label="B2B 4% (aparte, no se suma)" value={formatMoney(r.b2bCents)} strong />
            </div>

            <Field label="Nota (opcional)" wide hint='Se imprime como "Note: …" debajo del B2B'>
              {(id) => <TextInput id={id} value={section.note ?? ''} onChange={(v) => upSection((s) => void (s.note = v || undefined))} />}
            </Field>
          </Card>
        )
      })}
      <Button onClick={() => update((d) => void d.sections.push(newSection()))}>+ Agregar sección</Button>
    </>
  )
}

function GroupEditor({
  group,
  index,
  count,
  split,
  update,
  onMove,
  onRemove,
}: {
  group: PriceGroup
  index: number
  count: number
  split: { materialCents: number; laborCents: number; totalCents: number }
  update: (fn: (g: PriceGroup) => void) => void
  onMove: (a: number, b: number) => void
  onRemove: () => void
}) {
  return (
    <div className="group">
      <div className="group__head">
        <strong>Grupo {index + 1}</strong>
        <span className="muted">{group.items.length > 1 ? 'Las filas comparten un mismo precio' : ''}</span>
        <RowActions label="grupo" index={index} count={count} canRemove={count > 1} onMove={onMove} onRemove={onRemove} />
      </div>
      {group.items.map((item, ii) => (
        <div key={item.id} className="item">
          <div className="item__head">
            <span>Fila {ii + 1}</span>
            <label className="check">
              <input type="checkbox" checked={!!item.bulleted} onChange={(e) => update((g) => void (g.items[ii].bulleted = e.target.checked || undefined))} />
              Lista con viñetas
            </label>
            <RowActions
              label="fila"
              index={ii}
              count={group.items.length}
              canRemove={group.items.length > 1}
              onMove={(a, b) => update((g) => move(g.items, a, b))}
              onRemove={() => update((g) => void g.items.splice(ii, 1))}
            />
          </div>
          <div className="item__cols">
            <div>
              <h5>DESCRIPTION</h5>
              <RichLinesEditor
                label="Descripción"
                lines={item.description}
                placeholder="Room 304"
                notePlaceholder="(Room 404)"
                update={(fn) => update((g) => fn(g.items[ii].description))}
              />
            </div>
            <div>
              <h5>QTY/UNIT</h5>
              <RichLinesEditor
                label="Cantidad"
                lines={item.qty}
                placeholder="235 sf"
                notePlaceholder="(6” high)"
                update={(fn) => update((g) => fn(g.items[ii].qty))}
              />
            </div>
          </div>
        </div>
      ))}
      <Button variant="ghost" onClick={() => update((g) => void g.items.push(newLineItem()))}>
        + Fila con el mismo precio
      </Button>

      <div className="grid">
        <Field label="UNIT PRICE">{(id) => <TextInput id={id} value={group.unitPriceLabel} onChange={(v) => update((g) => void (g.unitPriceLabel = v))} />}</Field>
        <Field label="Forma de precio">
          {(id) => (
            <select
              id={id}
              value={group.split.mode}
              onChange={(e) =>
                update((g) => {
                  g.split =
                    e.target.value === 'manual'
                      ? { mode: 'manual', materialCents: split.materialCents, laborCents: split.laborCents }
                      : { mode: 'total', totalCents: split.totalCents }
                })
              }
            >
              <option value="total">Total (separa con el %)</option>
              <option value="manual">Material y Labor a mano</option>
            </select>
          )}
        </Field>
        {group.split.mode === 'total' ? (
          <Field label="Total">
            {(id) => (
              <MoneyInput id={id} value={group.split.mode === 'total' ? group.split.totalCents : 0} onChange={(v) => update((g) => void (g.split = { mode: 'total', totalCents: v }))} />
            )}
          </Field>
        ) : (
          <>
            <Field label="Material">
              {(id) => (
                <MoneyInput id={id} value={split.materialCents} onChange={(v) => update((g) => void (g.split.mode === 'manual' && (g.split.materialCents = v)))} />
              )}
            </Field>
            <Field label="Labor">
              {(id) => <MoneyInput id={id} value={split.laborCents} onChange={(v) => update((g) => void (g.split.mode === 'manual' && (g.split.laborCents = v)))} />}
            </Field>
          </>
        )}
      </div>
      <div className="totals totals--small">
        <Computed label="Material" value={formatMoney(split.materialCents)} />
        <Computed label="Labor" value={formatMoney(split.laborCents)} />
        <Computed label="Total" value={formatMoney(split.totalCents)} strong />
      </div>
    </div>
  )
}
