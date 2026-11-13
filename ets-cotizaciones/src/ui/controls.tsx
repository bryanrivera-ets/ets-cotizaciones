import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { formatMoney, parseMoney, type Cents } from '../domain/money.ts'

// ───────────────────────── Campos con etiqueta ─────────────────────────

export function Field({
  label,
  hint,
  children,
  wide,
  span2,
}: {
  label: string
  hint?: string
  children: (id: string) => ReactNode
  wide?: boolean
  span2?: boolean
}) {
  const id = useId()
  return (
    <div className={`field${wide ? ' field--wide' : ''}${span2 ? ' field--span2' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint ? <small className="hint">{hint}</small> : null}
    </div>
  )
}

export function TextInput({
  value,
  onChange,
  id,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string
  onChange: (v: string) => void
  id?: string
  placeholder?: string
  ariaLabel?: string
  className?: string
}) {
  return (
    <input
      id={id}
      className={className}
      type="text"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

/** Área de texto que crece con el contenido. */
export function TextArea({ value, onChange, id, ariaLabel, rows = 2 }: { value: string; onChange: (v: string) => void; id?: string; ariaLabel?: string; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])
  return <textarea ref={ref} id={id} rows={rows} value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)} />
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  id,
  ariaLabel,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  id?: string
  ariaLabel?: string
}) {
  return (
    <select id={id} value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/**
 * Campo de texto que se edita libremente y se interpreta al salir del campo.
 * Mientras se escribe no se reformatea, para no mover el cursor.
 */
function useCommitInput<T>(value: T, format: (v: T) => string, parse: (s: string) => T | null, onChange: (v: T) => void) {
  const [draft, setDraft] = useState<string | null>(null)
  return {
    value: draft ?? format(value),
    onFocus: () => setDraft(format(value)),
    onChange: (s: string) => {
      setDraft(s)
      const v = parse(s)
      if (v !== null) onChange(v)
    },
    onBlur: () => setDraft(null),
  }
}

/** Dinero en dólares; guarda centavos. */
export function MoneyInput({ value, onChange, id, ariaLabel }: { value: Cents; onChange: (v: Cents) => void; id?: string; ariaLabel?: string }) {
  const p = useCommitInput(
    value,
    (v) => formatMoney(v).replace('$', ''),
    (s) => parseMoney(s),
    onChange,
  )
  return (
    <div className="money">
      <span aria-hidden>$</span>
      <input
        id={id}
        inputMode="decimal"
        aria-label={ariaLabel}
        value={p.value}
        onFocus={(e) => {
          p.onFocus()
          e.target.select()
        }}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onBlur}
      />
    </div>
  )
}

const parseNum = (s: string): number | null => {
  const clean = s.replace(/,/g, '').trim()
  if (clean === '') return 0
  const n = Number(clean)
  return Number.isFinite(n) ? n : null
}

/** Número decimal (horas, sf, cantidades). */
export function NumberInput({ value, onChange, id, ariaLabel, suffix }: { value: number; onChange: (v: number) => void; id?: string; ariaLabel?: string; suffix?: string }) {
  const p = useCommitInput(value, (v) => (v ? String(v) : ''), parseNum, onChange)
  return (
    <div className="number">
      <input
        id={id}
        inputMode="decimal"
        aria-label={ariaLabel}
        value={p.value}
        placeholder="0"
        onFocus={(e) => {
          p.onFocus()
          e.target.select()
        }}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onBlur}
      />
      {suffix ? <span aria-hidden>{suffix}</span> : null}
    </div>
  )
}

// ───────────────────────── Botones ─────────────────────────

export function Button({
  children,
  onClick,
  variant = 'default',
  type = 'button',
  disabled,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  type?: 'button' | 'submit'
  disabled?: boolean
  title?: string
}) {
  return (
    <button type={type} className={`btn btn--${variant}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  )
}

/** Botones para mover / eliminar una fila de una lista. */
export function RowActions({
  index,
  count,
  onMove,
  onRemove,
  canRemove = true,
  label,
}: {
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onRemove: () => void
  canRemove?: boolean
  label: string
}) {
  return (
    <div className="row-actions">
      <button type="button" className="icon-btn" title={`Subir ${label}`} aria-label={`Subir ${label}`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        ↑
      </button>
      <button type="button" className="icon-btn" title={`Bajar ${label}`} aria-label={`Bajar ${label}`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>
        ↓
      </button>
      <button type="button" className="icon-btn icon-btn--danger" title={`Eliminar ${label}`} aria-label={`Eliminar ${label}`} disabled={!canRemove} onClick={onRemove}>
        ✕
      </button>
    </div>
  )
}

export function Card({ title, actions, children }: { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      {title || actions ? (
        <header className="card__head">
          {title ? <h3>{title}</h3> : <span />}
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  )
}

/** Valor calculado (solo lectura). */
export function Computed({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`computed${strong ? ' computed--strong' : ''}`}>
      <span>{label}</span>
      <output>{value}</output>
    </div>
  )
}
