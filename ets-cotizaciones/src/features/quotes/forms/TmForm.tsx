import { areaQtyLabel, computeTm, positionHours } from '../../../domain/calc/tm.ts'
import { newArea, newCrewDay, newLaborPosition, newMaterialLine, newPmRow } from '../../../domain/factories.ts'
import { formatMoney } from '../../../domain/money.ts'
import type { AreaAllocation, HoursSource, TmQuote } from '../../../domain/types.ts'
import { Button, Card, Computed, Field, MoneyInput, NumberInput, RowActions, Select, TextArea, TextInput } from '../../../ui/controls.tsx'
import { move } from '../../../ui/list.ts'
import type { Update } from '../editorTypes.ts'
import { ScopeEditor } from './common.tsx'

const HOURS_SOURCE: { value: HoursSource; label: string }[] = [
  { value: 'supervisor', label: 'Calendario: Supervisor' },
  { value: 'labor', label: 'Calendario: Labor' },
  { value: 'pm', label: 'Calendario: Project Manager' },
  { value: 'manual', label: 'Horas escritas a mano' },
]

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })

export function TmForm({ quote, update }: { quote: TmQuote; update: Update<TmQuote> }) {
  const r = computeTm(quote)
  return (
    <>
      <Card title="Trabajo">
        <Field label="TO BE PERFORMED" wide>
          {(id) => <TextArea id={id} value={quote.toBePerformed} onChange={(v) => update((d) => void (d.toBePerformed = v))} />}
        </Field>
        <h4>SCOPE OF WORK</h4>
        <ScopeEditor items={quote.scope} update={(fn) => update((d) => fn(d.scope))} />
      </Card>

      <Card title="2. Calendario de trabajo (ESTIMATED WORK SCHEDULE)">
        <Field label="Línea descriptiva" wide>
          {(id) => <TextArea id={id} value={quote.scheduleIntro} onChange={(v) => update((d) => void (d.scheduleIntro = v))} />}
        </Field>
        <div className="tbl tbl--sched">
          <div className="tbl__head">
            <span>DAY</span>
            <span>ACTIVITY</span>
            <span>CREW</span>
            <span>HORAS</span>
            <span />
          </div>
          {quote.schedule.map((row, i) => (
            <div key={row.id} className="tbl__row">
              <TextInput ariaLabel="Día" value={row.day} onChange={(v) => update((d) => void (d.schedule[i].day = v))} />
              <TextArea ariaLabel="Actividad" rows={1} value={row.activity} onChange={(v) => update((d) => void (d.schedule[i].activity = v))} />
              <TextInput ariaLabel="Crew" value={row.crew} onChange={(v) => update((d) => void (d.schedule[i].crew = v))} />
              {row.kind === 'crew' ? (
                <div className="hours-pair">
                  <NumberInput ariaLabel="Horas Supervisor" value={row.supervisorHours} onChange={(v) => update((d) => void (d.schedule[i].kind === 'crew' && (d.schedule[i].supervisorHours = v)))} />
                  <span>/</span>
                  <NumberInput ariaLabel="Horas Labor" value={row.laborHours} onChange={(v) => update((d) => void (d.schedule[i].kind === 'crew' && (d.schedule[i].laborHours = v)))} />
                </div>
              ) : (
                <NumberInput ariaLabel="Horas PM" suffix="PM" value={row.hours} onChange={(v) => update((d) => void (d.schedule[i].kind === 'pm' && (d.schedule[i].hours = v)))} />
              )}
              <RowActions
                label="día"
                index={i}
                count={quote.schedule.length}
                onMove={(a, b) => update((d) => move(d.schedule, a, b))}
                onRemove={() => update((d) => void d.schedule.splice(i, 1))}
              />
            </div>
          ))}
        </div>
        <div className="btn-row">
          <Button variant="ghost" onClick={() => update((d) => void d.schedule.splice(d.schedule.filter((s) => s.kind === 'crew').length, 0, newCrewDay(d.schedule.filter((s) => s.kind === 'crew').length + 1)))}>
            + Día (Supervisor / Labor)
          </Button>
          <Button variant="ghost" onClick={() => update((d) => void d.schedule.push(newPmRow()))}>
            + Fila Project Manager
          </Button>
        </div>
        <div className="totals totals--small">
          <Computed label="Horas Supervisor" value={fmt(r.hours.supervisor)} />
          <Computed label="Horas Labor" value={fmt(r.hours.labor)} />
          <Computed label="Horas PM" value={fmt(r.hours.pm)} />
        </div>
      </Card>

      <Card title="1. Mano de obra (ESTIMATED LABOR)">
        <div className="tbl tbl--labor">
          <div className="tbl__head">
            <span>POSITION</span>
            <span>QTY</span>
            <span>Horas</span>
            <span>RATE / HR</span>
            <span>AMOUNT</span>
            <span />
          </div>
          {quote.labor.map((p, i) => (
            <div key={p.id} className="tbl__row">
              <TextInput ariaLabel="Posición" value={p.name} onChange={(v) => update((d) => void (d.labor[i].name = v))} />
              <NumberInput ariaLabel="Cantidad de personas" suffix="pers." value={p.qty} onChange={(v) => update((d) => void (d.labor[i].qty = v))} />
              <div className="hours-src">
                <Select<HoursSource> ariaLabel="Origen de las horas" value={p.hoursSource} options={HOURS_SOURCE} onChange={(v) => update((d) => void (d.labor[i].hoursSource = v))} />
                {p.hoursSource === 'manual' ? (
                  <NumberInput ariaLabel="Horas" suffix="h" value={p.manualHours ?? 0} onChange={(v) => update((d) => void (d.labor[i].manualHours = v))} />
                ) : (
                  <output>{fmt(positionHours(p, r.hours))} h</output>
                )}
              </div>
              <MoneyInput ariaLabel="Tarifa por hora" value={p.rateCents} onChange={(v) => update((d) => void (d.labor[i].rateCents = v))} />
              <output className="num">{formatMoney(r.labor.rows[i].amountCents)}</output>
              <RowActions
                label="posición"
                index={i}
                count={quote.labor.length}
                onMove={(a, b) => update((d) => move(d.labor, a, b))}
                onRemove={() => update((d) => void d.labor.splice(i, 1))}
              />
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={() => update((d) => void d.labor.push(newLaborPosition()))}>
          + Posición
        </Button>
        <div className="totals totals--small">
          <Computed label="Personas" value={fmt(r.labor.totalQty)} />
          <Computed label="Horas" value={fmt(r.labor.totalHours)} />
          <Computed label="Total Estimated Labor" value={formatMoney(r.labor.totalCents)} strong />
        </div>
      </Card>

      <Card title="3. Materiales y equipo">
        <div className="tbl tbl--mat">
          <div className="tbl__head">
            <span>DESCRIPTION</span>
            <span>QTY</span>
            <span>UNIT</span>
            <span>UNIT PRICE</span>
            <span>AMOUNT</span>
            <span />
          </div>
          {quote.materials.map((m, i) => (
            <div key={m.id} className="tbl__row">
              <TextInput ariaLabel="Descripción" value={m.description} onChange={(v) => update((d) => void (d.materials[i].description = v))} />
              <input
                aria-label="Cantidad"
                inputMode="decimal"
                value={m.qty}
                onChange={(e) => update((d) => void (d.materials[i].qty = e.target.value.replace(/[^\d.]/g, '')))}
              />
              <TextInput ariaLabel="Unidad" value={m.unit} onChange={(v) => update((d) => void (d.materials[i].unit = v))} />
              <MoneyInput ariaLabel="Precio unitario" value={m.unitPriceCents} onChange={(v) => update((d) => void (d.materials[i].unitPriceCents = v))} />
              <output className="num">{formatMoney(r.materials.amounts[i])}</output>
              <RowActions
                label="material"
                index={i}
                count={quote.materials.length}
                onMove={(a, b) => update((d) => move(d.materials, a, b))}
                onRemove={() => update((d) => void d.materials.splice(i, 1))}
              />
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={() => update((d) => void d.materials.push(newMaterialLine()))}>
          + Material o equipo
        </Button>
        <div className="totals totals--small">
          <Computed label="Total Materials & Equipment" value={formatMoney(r.materials.totalCents)} strong />
        </div>
      </Card>

      <Card title="4. Distribución por área (ALLOCATION BY AREA)">
        <p className="muted">
          El porcentaje se calcula con sf + lf. Puedes fijar un porcentaje o el total deseado del área; la última área recibe el resto.
        </p>
        <div className="tbl tbl--areas">
          <div className="tbl__head">
            <span>AREA</span>
            <span>sf</span>
            <span>lf</span>
            <span>Proporción</span>
            <span>%</span>
            <span>MATERIAL / LABOR / TOTAL</span>
            <span />
          </div>
          {quote.areas.map((a, i) => {
            const row = r.areas.rows[i]
            const al = a.allocation
            return (
              <div key={a.id} className="tbl__row">
                <div className="stack">
                  <TextInput ariaLabel="Área" value={a.name} onChange={(v) => update((d) => void (d.areas[i].name = v))} />
                  <TextInput
                    ariaLabel="Texto QTY/UNIT"
                    value={a.qtyLabel ?? ''}
                    placeholder={areaQtyLabel({ ...a, qtyLabel: undefined }) || 'QTY/UNIT'}
                    onChange={(v) => update((d) => void (d.areas[i].qtyLabel = v || undefined))}
                  />
                </div>
                <NumberInput ariaLabel="Pies cuadrados" suffix="sf" value={a.sf ?? 0} onChange={(v) => update((d) => void (d.areas[i].sf = v))} />
                <NumberInput ariaLabel="Pies lineales" suffix="lf" value={a.lf ?? 0} onChange={(v) => update((d) => void (d.areas[i].lf = v))} />
                <div className="stack">
                  <Select<AreaAllocation['mode']>
                    ariaLabel="Cómo se calcula"
                    value={al.mode}
                    options={[
                      { value: 'auto', label: 'Automático (sf + lf)' },
                      { value: 'percent', label: 'Porcentaje' },
                      { value: 'total', label: 'Total deseado' },
                    ]}
                    onChange={(mode) =>
                      update((d) => {
                        d.areas[i].allocation =
                          mode === 'auto'
                            ? { mode }
                            : mode === 'percent'
                              ? { mode, percent: row ? row.percent.toFixed(2) : '0' }
                              : { mode, totalCents: row ? row.totalCents : 0 }
                      })
                    }
                  />
                  {al.mode === 'percent' ? (
                    <div className="number">
                      <input
                        aria-label="Porcentaje del área"
                        inputMode="decimal"
                        value={al.percent}
                        onChange={(e) => update((d) => void (d.areas[i].allocation = { mode: 'percent', percent: e.target.value.replace(/[^\d.]/g, '') || '0' }))}
                      />
                      <span aria-hidden>%</span>
                    </div>
                  ) : al.mode === 'total' ? (
                    <MoneyInput ariaLabel="Total deseado del área" value={al.totalCents} onChange={(v) => update((d) => void (d.areas[i].allocation = { mode: 'total', totalCents: v }))} />
                  ) : null}
                </div>
                <output className="num">{row ? `${row.percent.toFixed(2)}%` : ''}</output>
                <output className="num small">
                  {row ? `${formatMoney(row.materialCents)} / ${formatMoney(row.laborCents)} / ${formatMoney(row.totalCents)}` : ''}
                  {i === quote.areas.length - 1 && quote.areas.length > 1 ? <em className="muted"> (resto)</em> : null}
                </output>
                <RowActions
                  label="área"
                  index={i}
                  count={quote.areas.length}
                  onMove={(x, y) => update((d) => move(d.areas, x, y))}
                  onRemove={() => update((d) => void d.areas.splice(i, 1))}
                />
              </div>
            )
          })}
        </div>
        {r.areas.warnings.map((w) => (
          <p key={w} className="warning">
            ⚠ {w}
          </p>
        ))}
        <Button variant="ghost" onClick={() => update((d) => void d.areas.push(newArea()))}>
          + Área
        </Button>
      </Card>

      <Card title="5. Resumen (ESTIMATED T&M SUMMARY)">
        <div className="totals">
          <Computed label="Estimated Labor" value={formatMoney(r.labor.totalCents)} />
          <Computed label="Materials & Equipment" value={formatMoney(r.materials.totalCents)} />
          <Computed label="Subtotal" value={formatMoney(r.subtotalCents)} strong />
          <Computed label="B2B 4% (on labor)" value={formatMoney(r.b2bCents)} />
          <Computed label="ESTIMATED TOTAL" value={formatMoney(r.totalCents)} strong />
        </div>
      </Card>
    </>
  )
}

