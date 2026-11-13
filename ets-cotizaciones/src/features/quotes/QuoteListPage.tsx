import { useEffect, useState } from 'react'
import { computeLumpSum } from '../../domain/calc/lumpSum.ts'
import { computePremiumTime } from '../../domain/calc/premiumTime.ts'
import { computeTm } from '../../domain/calc/tm.ts'
import { newId, newQuote, QUOTE_TYPE_LABEL } from '../../domain/factories.ts'
import { EXAMPLES } from '../../domain/fixtures/examples.ts'
import { formatLongDate, quoteNumberOf } from '../../domain/format.ts'
import { formatMoney } from '../../domain/money.ts'
import { SEED_PROFILES } from '../../domain/seed/profiles.ts'
import { SEED_SIGNERS } from '../../domain/seed/signers.ts'
import { SEED_TERMS } from '../../domain/seed/terms.ts'
import type { Quote, QuoteType } from '../../domain/types.ts'
import { getCurrentProfileId, localQuoteStore, setCurrentProfileId, type StoredQuote } from '../../services/localStore.ts'
import { Button, Select } from '../../ui/controls.tsx'
import { STATUS_LABEL } from './labels.ts'

function totalOf(q: Quote): number {
  if (q.type === 'lumpSum') return computeLumpSum(q).totalCents
  if (q.type === 'premiumTime') return computePremiumTime(q).totalCents
  return computeTm(q).totalCents
}

export function QuoteListPage({ navigate }: { navigate: (path: string) => void }) {
  const [items, setItems] = useState<StoredQuote[] | null>(null)
  const [profileId, setProfileId] = useState(getCurrentProfileId() ?? SEED_PROFILES[0].id)

  const reload = () => localQuoteStore.list().then(setItems)
  useEffect(() => {
    void reload()
  }, [])

  const create = async (type: QuoteType) => {
    const profile = SEED_PROFILES.find((p) => p.id === profileId) ?? SEED_PROFILES[0]
    const quote = newQuote(type, {
      profile,
      signer: SEED_SIGNERS.find((s) => s.id === profile.defaultSignerId) ?? SEED_SIGNERS[0],
      terms: SEED_TERMS.find((t) => t.id === profile.preferredTermsId) ?? SEED_TERMS[0],
    })
    await localQuoteStore.save(quote)
    navigate(`/cotizacion/${quote.id}`)
  }

  const loadExamples = async () => {
    for (const q of Object.values(EXAMPLES)) await localQuoteStore.save({ ...structuredClone(q), id: newId() })
    void reload()
  }

  const remove = async (s: StoredQuote) => {
    if (!confirm(`¿Eliminar la cotización ${quoteNumberOf(s.quote)} – ${s.quote.header.projectArea || 'sin proyecto'}?`)) return
    await localQuoteStore.remove(s.quote.id)
    void reload()
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

      {items === null ? (
        <p className="muted">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="empty">
          <p>Todavía no hay cotizaciones en este dispositivo. Crea una con los botones de arriba.</p>
          <Button variant="ghost" onClick={loadExamples}>
            Cargar las 6 cotizaciones de ejemplo
          </Button>
        </div>
      ) : (
        <ul className="quote-list">
          {items.map((s) => {
            const q = s.quote
            return (
              <li key={q.id}>
                <button className="quote-list__main" onClick={() => navigate(`/cotizacion/${q.id}`)}>
                  <span className="quote-list__no">{quoteNumberOf(q)}</span>
                  <span className="quote-list__project">{q.header.projectArea || <em className="muted">Sin proyecto</em>}</span>
                  <span className="muted">
                    {q.header.contractor || '—'} · {formatLongDate(q.header.date)} · {QUOTE_TYPE_LABEL[q.type]} · {q.preparedBy.initials}
                  </span>
                </button>
                <span className={`badge badge--${q.status}`}>{STATUS_LABEL[q.status]}</span>
                <span className="quote-list__total">{formatMoney(totalOf(q))}</span>
                <button className="icon-btn icon-btn--danger" aria-label="Eliminar cotización" title="Eliminar" onClick={() => remove(s)}>
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
