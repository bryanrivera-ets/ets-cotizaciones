import { useEffect, useMemo, useState } from 'react'
import { computeLumpSum } from '../../domain/calc/lumpSum.ts'
import { computePremiumTime } from '../../domain/calc/premiumTime.ts'
import { computeTm } from '../../domain/calc/tm.ts'
import { newId, newQuote, QUOTE_TYPE_LABEL } from '../../domain/factories.ts'
import { EXAMPLES } from '../../domain/fixtures/examples.ts'
import { formatLongDate, quoteNumberOf } from '../../domain/format.ts'
import { formatMoney } from '../../domain/money.ts'
import { compareByNumber, EMPTY_FILTERS, matchesFilters, type QuoteFilters } from '../../domain/management.ts'
import type { Quote, QuoteStatus, QuoteType } from '../../domain/types.ts'
import { backend, type StoredQuote } from '../../services/backend/index.ts'
import { useEmulators } from '../../services/firebase/config.ts'
import { getCurrentProfileId, setCurrentProfileId } from '../../services/prefs.ts'
import { useAuth } from '../auth/context.ts'
import { Button, Select } from '../../ui/controls.tsx'
import { useLibrary } from '../library/context.ts'
import { STATUS_LABEL } from './labels.ts'

function totalOf(q: Quote): number {
  if (q.type === 'lumpSum') return computeLumpSum(q).totalCents
  if (q.type === 'premiumTime') return computePremiumTime(q).totalCents
  return computeTm(q).totalCents
}

export function QuoteListPage({ navigate }: { navigate: (path: string) => void }) {
  const [items, setItems] = useState<StoredQuote[] | null>(null)
  const { library } = useLibrary()
  const { profiles: SEED_PROFILES, signers: SEED_SIGNERS, terms: SEED_TERMS } = library
  const { allowed } = useAuth()
  const [profileId, setProfileId] = useState(() => {
    const saved = getCurrentProfileId() ?? allowed?.profileId
    return SEED_PROFILES.some((p) => p.id === saved) ? (saved as string) : SEED_PROFILES[0].id
  })
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<QuoteFilters>(loadFilters)
  const [sort, setSort] = useState<'recent' | 'number'>('recent')
  const setF = (patch: Partial<QuoteFilters>) =>
    setFilters((f) => {
      const next = { ...f, ...patch }
      saveFilters(next)
      return next
    })

  useEffect(() => backend.quotes.subscribe(setItems, (e) => setError(e.message)), [])

  const visible = useMemo(() => {
    if (!items) return []
    const list = items.filter((s) => matchesFilters(s.quote, filters, s.locked))
    return sort === 'number' ? [...list].sort((a, b) => compareByNumber(a.quote, b.quote)) : list
  }, [items, filters, sort])
  const activeCount = (filters.includeOld ? items?.length : items?.filter((s) => !s.locked).length) ?? 0
  const filtering = JSON.stringify({ ...filters, includeOld: false }) !== JSON.stringify(EMPTY_FILTERS)

  const setStatus = (s: StoredQuote, status: QuoteStatus) => void backend.quotes.saveBody({ ...s.quote, status })

  const create = async (type: QuoteType) => {
    const profile = SEED_PROFILES.find((p) => p.id === profileId) ?? SEED_PROFILES[0]
    const quote = newQuote(type, {
      profile,
      signer: SEED_SIGNERS.find((s) => s.id === profile.defaultSignerId) ?? SEED_SIGNERS[0],
      terms: SEED_TERMS.find((t) => t.id === profile.preferredTermsId) ?? SEED_TERMS[0],
    })
    await backend.quotes.create(quote)
    navigate(`/cotizacion/${quote.id}`)
  }

  const loadExamples = async () => {
    for (const q of Object.values(EXAMPLES)) await backend.quotes.create({ ...structuredClone(q), id: newId() })
  }

  const remove = async (s: StoredQuote) => {
    const extra = s.revisionOf ? '\n\nLa versión anterior volverá a ser editable.' : ''
    if (!confirm(`¿Eliminar la cotización ${quoteNumberOf(s.quote)} – ${s.quote.header.projectArea || 'sin proyecto'}?${extra}`)) return
    try {
      await backend.quotes.remove(s.quote.id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div className="page">
      <div className="page__head">
        <h1>Cotizaciones</h1>
        <label className="profile">
          Soy:
          <Select
            ariaLabel="Perfil"
            value={profileId}
            onChange={(v) => {
              setProfileId(v)
              setCurrentProfileId(v)
            }}
            options={SEED_PROFILES.map((p) => ({ value: p.id, label: `${p.name} (${p.initials})` }))}
          />
        </label>
      </div>

      <div className="new-quote">
        <span>Nueva cotización:</span>
        {(Object.keys(QUOTE_TYPE_LABEL) as QuoteType[]).map((t) => (
          <Button key={t} variant="primary" onClick={() => create(t)}>
            + {QUOTE_TYPE_LABEL[t]}
          </Button>
        ))}
      </div>

      {items && items.length > 0 ? (
        <div className="filters" role="search">
          <input
            type="search"
            className="filters__text"
            aria-label="Buscar"
            placeholder="Buscar por número, contractor, proyecto, contacto, fecha o iniciales…"
            value={filters.text}
            onChange={(e) => setF({ text: e.target.value })}
          />
          <Select<QuoteStatus | ''>
            ariaLabel="Estado"
            value={filters.status}
            onChange={(v) => setF({ status: v })}
            options={[{ value: '', label: 'Todos los estados' }, ...(Object.keys(STATUS_LABEL) as QuoteStatus[]).map((k) => ({ value: k, label: STATUS_LABEL[k] }))]}
          />
          <Select<QuoteType | ''>
            ariaLabel="Tipo"
            value={filters.type}
            onChange={(v) => setF({ type: v })}
            options={[{ value: '', label: 'Todos los tipos' }, ...(Object.keys(QUOTE_TYPE_LABEL) as QuoteType[]).map((k) => ({ value: k, label: QUOTE_TYPE_LABEL[k] }))]}
          />
          <Select
            ariaLabel="Preparada por"
            value={filters.preparedBy}
            onChange={(v) => setF({ preparedBy: v })}
            options={[
              { value: '', label: 'Preparada por: todos' },
              ...[...new Set(items.map((s) => s.quote.preparedBy.initials))].sort().map((i) => ({ value: i, label: `Preparada por: ${i}` })),
            ]}
          />
          <label className="filters__date">
            Desde
            <input type="date" value={filters.from} onChange={(e) => setF({ from: e.target.value })} />
          </label>
          <label className="filters__date">
            Hasta
            <input type="date" value={filters.to} onChange={(e) => setF({ to: e.target.value })} />
          </label>
          <Select<'recent' | 'number'>
            ariaLabel="Orden"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'recent', label: 'Orden: modificadas recientemente' },
              { value: 'number', label: 'Orden: por número' },
            ]}
          />
          <label className="check">
            <input type="checkbox" checked={filters.includeOld} onChange={(e) => setF({ includeOld: e.target.checked })} />
            Incluir versiones anteriores
          </label>
          <span className="filters__count muted">
            {visible.length} de {activeCount}
            {filtering ? (
              <button className="link" onClick={() => setF({ ...EMPTY_FILTERS, includeOld: filters.includeOld })}>
                Limpiar filtros
              </button>
            ) : null}
          </span>
        </div>
      ) : null}

      {error ? <p className="warning">No se pudo cargar la lista: {error}</p> : null}
      {items === null ? (
        <p className="muted">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="empty">
          <p>Todavía no hay cotizaciones en este dispositivo. Crea una con los botones de arriba.</p>
          {backend.mode === 'local' || useEmulators ? (
            <Button variant="ghost" onClick={loadExamples}>
              Cargar las 6 cotizaciones de ejemplo
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="quote-list">
          {visible.length === 0 ? <li className="empty">Ninguna cotización coincide con la búsqueda.</li> : null}
          {visible.map((s) => {
            const q = s.quote
            return (
              <li key={q.id} className={s.locked ? 'is-old' : undefined}>
                <button className="quote-list__main" onClick={() => navigate(`/cotizacion/${q.id}`)}>
                  <span className="quote-list__no">{quoteNumberOf(q)}</span>
                  <span className="quote-list__project">{q.header.projectArea || <em className="muted">Sin proyecto</em>}</span>
                  <span className="muted">
                    {q.header.contractor || '—'} · {formatLongDate(q.header.date)} · {QUOTE_TYPE_LABEL[q.type]} · {q.preparedBy.initials}
                  </span>
                </button>
                {s.pending ? (
                  <span className="badge badge--pending" title="Guardada en este dispositivo; se sube al conectarse">
                    Sin subir
                  </span>
                ) : null}
                {s.locked ? (
                  <span className="badge" title="Reemplazada por una revisión más nueva; solo lectura">
                    Versión anterior
                  </span>
                ) : (
                  <select
                    className={`status-select badge--${q.status}`}
                    aria-label={`Estado de ${quoteNumberOf(q)}`}
                    value={q.status}
                    onChange={(e) => setStatus(s, e.target.value as QuoteStatus)}
                  >
                    {(Object.keys(STATUS_LABEL) as QuoteStatus[]).map((k) => (
                      <option key={k} value={k}>
                        {STATUS_LABEL[k]}
                      </option>
                    ))}
                  </select>
                )}
                <span className="quote-list__total">{formatMoney(totalOf(q))}</span>
                <button
                  className="icon-btn icon-btn--danger"
                  aria-label="Eliminar cotización"
                  title={s.locked ? 'Las versiones anteriores no se pueden eliminar' : 'Eliminar'}
                  disabled={s.locked}
                  onClick={() => remove(s)}
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Filtros recordados en este dispositivo
const FILTERS_KEY = 'ets.filters'
function loadFilters(): QuoteFilters {
  try {
    return { ...EMPTY_FILTERS, ...JSON.parse(sessionStorage.getItem(FILTERS_KEY) ?? '{}') }
  } catch {
    return EMPTY_FILTERS
  }
}
function saveFilters(f: QuoteFilters) {
  try {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify(f))
  } catch {
    /* sin almacenamiento */
  }
}
