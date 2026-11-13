/**
 * Indicador de conexión y cambios pendientes + numeración automática:
 * las cotizaciones sin número oficial lo reciben en cuanto hay conexión.
 */
import { useEffect, useRef, useState } from 'react'
import { backend } from '../../services/backend/index.ts'

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export function SyncStatus() {
  const online = useOnline()
  const [pending, setPending] = useState(0)
  const [unnumbered, setUnnumbered] = useState<{ id: string; year: number }[]>([])
  const inFlight = useRef(new Set<string>())

  useEffect(() => backend.onPendingChange(setPending), [])
  useEffect(
    () =>
      backend.quotes.subscribe((items) =>
        setUnnumbered(
          items
            .filter((s) => s.quote.number.seq === null && !s.pending)
            .map((s) => ({ id: s.quote.id, year: Number(s.quote.header.date.slice(0, 4)) })),
        ),
      ),
    [],
  )

  // Numeración automática (una a la vez, en orden)
  useEffect(() => {
    if (!online && backend.mode === 'firebase') return
    let cancelled = false
    ;(async () => {
      for (const q of [...unnumbered].reverse()) {
        if (cancelled || inFlight.current.has(q.id)) continue
        inFlight.current.add(q.id)
        try {
          await backend.numbering.reserve(q.id, q.year)
        } catch {
          /* se reintenta en la próxima actualización o al reconectar */
        } finally {
          inFlight.current.delete(q.id)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [online, unnumbered])

  if (backend.mode === 'local')
    return (
      <span className="sync sync--local" title="Firebase no está configurado: los datos se guardan solo en este navegador">
        ● Solo este equipo
      </span>
    )
  const label = !online ? 'Sin conexión' : pending ? 'Sincronizando…' : 'Sincronizado'
  const detail = pending ? ` · ${pending} cambio${pending === 1 ? '' : 's'} sin subir` : ''
  return (
    <span
      className={`sync ${online ? (pending ? 'sync--pending' : 'sync--ok') : 'sync--off'}`}
      role="status"
      title={online ? 'Los cambios se guardan en la nube' : 'Puedes seguir trabajando: los cambios se suben al reconectar'}
    >
      ● {label}
      {detail}
    </span>
  )
}
