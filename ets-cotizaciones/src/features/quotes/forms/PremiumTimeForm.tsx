import { computePremiumTime } from '../../../domain/calc/premiumTime.ts'
import { newPremiumItem } from '../../../domain/factories.ts'
import { formatMoney } from '../../../domain/money.ts'
import type { PremiumTimeQuote } from '../../../domain/types.ts'
import { Button, Card, Computed, Field, MoneyInput, RowActions, TextInput } from '../../../ui/controls.tsx'
import { move } from '../../../ui/list.ts'
import type { Update } from '../editorTypes.ts'

export function PremiumTimeForm({ quote, update }: { quote: PremiumTimeQuote; update: Update<PremiumTimeQuote> }) {
  const { totalCents } = computePremiumTime(quote)
  return (
    <Card title="Premium Time">
      <Field label="Subtítulo" wide>
        {(id) => <TextInput id={id} value={quote.subtitle} onChange={(v) => update((d) => void (d.subtitle = v))} />}
      </Field>
      {quote.items.map((item, i) => (
        <div key={item.id} className="group">
          <div className="group__head">
            <strong>Fila {i + 1}</strong>
            <span />
            <RowActions
              label="fila"
              index={i}
              count={quote.items.length}
              canRemove={quote.items.length > 1}
              onMove={(a, b) => update((d) => move(d.items, a, b))}
              onRemove={() => update((d) => void d.items.splice(i, 1))}
            />
          </div>
          <div className="grid">
            <Field label="Descripción">{(id) => <TextInput id={id} value={item.title} onChange={(v) => update((d) => void (d.items[i].title = v))} />}</Field>
            <Field label="Detalle (fechas)" wide>
              {(id) => (
                <TextInput
                  id={id}
                  value={item.detail ?? ''}
                  placeholder="(Saturday, November 7, 2026, and Sunday, November 8, 2026)"
                  onChange={(v) => update((d) => void (d.items[i].detail = v))}
                />
              )}
            </Field>
            <Field label="Monto">{(id) => <MoneyInput id={id} value={item.amountCents} onChange={(v) => update((d) => void (d.items[i].amountCents = v))} />}</Field>
          </div>
        </div>
      ))}
      <Button variant="ghost" onClick={() => update((d) => void d.items.push(newPremiumItem()))}>
        + Fila
      </Button>
      <div className="totals">
        <Computed label="Total" value={formatMoney(totalCents)} strong />
      </div>
    </Card>
  )
}
