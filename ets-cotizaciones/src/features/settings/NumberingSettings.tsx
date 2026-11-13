import { useEffect, useState } from 'react'
import { formatQuoteNumber } from '../../domain/format.ts'
import { backend } from '../../services/backend/index.ts'
import { Button, Card, Field, NumberInput } from '../../ui/controls.tsx'

export function NumberingSettings() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [next, setNext] = useState<number | null>(null)
  const [draft, setDraft] = useState(1)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let alive = true
    backend.numbering.getNext(year).then(
      (n) => {
        if (!alive) return
        setNext(n)
        setDraft(n)
      },
      (e) => alive && setMsg({ ok: false, text: `Sin conexión o sin permiso: ${(e as Error).message}` }),
    )
    return () => {
      alive = false
    }
  }, [year])

  const save = async () => {
    const n = Math.round(draft)
    if (n < 1) return
    if (next !== null && n < next && !confirm(`Bajar el contador de ${next} a ${n} puede repetir números ya usados. ¿Seguro?`)) return
    try {
      await backend.numbering.setNext(year, n)
      void backend.changelog.add('counters', `Numeración: próximo número de ${year} = ${formatQuoteNumber({ seq: n, year, revision: 0 })}`)
      setNext(n)
      setMsg({ ok: true, text: `Listo. La próxima cotización de ${year} será la ${formatQuoteNumber({ seq: n, year, revision: 0 })}.` })
    } catch (e) {
      setMsg({ ok: false, text: `No se pudo guardar (¿sin conexión?): ${(e as Error).message}` })
    }
  }

  return (
    <Card title="Numeración (NNN-AA)">
      <p className="muted">
        Cada año la secuencia empieza de nuevo. El número se asigna automáticamente a cada cotización nueva en cuanto hay conexión; dos
        personas nunca reciben el mismo. Aquí puedes fijar desde qué número seguir (por ejemplo, para continuar con la numeración actual).
      </p>
      <div className="grid">
        <Field label="Año">{(id) => <NumberInput id={id} value={year} onChange={(v) => v > 2000 && setYear(Math.round(v))} />}</Field>
        <Field label="Próximo número">{(id) => <NumberInput id={id} value={draft} onChange={setDraft} />}</Field>
        <div className="field">
          <span className="muted small">La próxima será</span>
          <strong className="quote-no__value">{formatQuoteNumber({ seq: Math.max(1, Math.round(draft)), year, revision: 0 })}</strong>
        </div>
      </div>
      <Button variant="primary" onClick={save} disabled={next === null || Math.round(draft) === next}>
        Guardar
      </Button>
      {msg ? <p className={msg.ok ? 'ok' : 'warning'}>{msg.text}</p> : null}
    </Card>
  )
}
