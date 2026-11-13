import { useEffect, useState } from 'react'
import { backend, type ChangeLogEntry } from '../../services/backend/index.ts'
import { Card } from '../../ui/controls.tsx'

const fmt = new Intl.DateTimeFormat('es-PR', { dateStyle: 'medium', timeStyle: 'short' })

/** Quién cambió qué y cuándo (sistemas, catálogo, términos, perfiles, usuarios, numeración). */
export function ChangeLogSettings() {
  const [entries, setEntries] = useState<ChangeLogEntry[] | null>(null)
  useEffect(() => backend.changelog.subscribe(setEntries), [])
  return (
    <Card title="Historial de cambios de la configuración">
      {entries === null ? (
        <p className="muted">Cargando…</p>
      ) : entries.length === 0 ? (
        <p className="muted">Todavía no hay cambios registrados.</p>
      ) : (
        <ul className="log">
          {entries.map((e) => (
            <li key={e.id}>
              <time dateTime={e.at}>{fmt.format(new Date(e.at))}</time>
              <strong>{e.by}</strong>
              <span>{e.summary}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
