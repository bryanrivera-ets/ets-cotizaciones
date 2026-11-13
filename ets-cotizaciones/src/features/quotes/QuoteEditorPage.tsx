import { produce } from 'immer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { QUOTE_TYPE_LABEL } from '../../domain/factories.ts'
import { pdfFileNameOf, quoteNumberOf } from '../../domain/format.ts'
import { duplicateQuote, newRevision } from '../../domain/management.ts'
import type { LumpSumQuote, PremiumTimeQuote, Quote, TmQuote } from '../../domain/types.ts'
import { generatePdfBlob } from '../../pdf/browser.ts'
import { backend, type StoredQuote } from '../../services/backend/index.ts'
import { downloadBlob } from '../../ui/files.ts'
import { EmailDialog } from './EmailDialog.tsx'
import { Button } from '../../ui/controls.tsx'
import type { Update } from './editorTypes.ts'
import { HeaderForm } from './forms/common.tsx'
import { LumpSumForm } from './forms/LumpSumForm.tsx'
import { PremiumTimeForm } from './forms/PremiumTimeForm.tsx'
import { TmForm } from './forms/TmForm.tsx'
import { PdfPreview } from './PdfPreview.tsx'

type SaveState = 'saved' | 'saving' | 'error'

export function QuoteEditorPage({ id, navigate }: { id: string; navigate: (path: string) => void }) {
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [tab, setTab] = useState<'form' | 'preview'>('form')
  const [meta, setMeta] = useState<Pick<StoredQuote, 'locked' | 'supersededBy' | 'revisionOf'>>({})
  const [emailOpen, setEmailOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const dirty = useRef(false)

  // Cargar y seguir en vivo el número oficial (se asigna aparte, incluso mientras se edita)
  useEffect(
    () =>
      backend.quotes.watch(id, (stored) => {
        if (stored) setMeta({ locked: stored.locked, supersededBy: stored.supersededBy, revisionOf: stored.revisionOf })
        setQuote((cur) => {
          if (!stored) return cur === undefined ? null : cur
          if (!cur) return stored.quote
          return JSON.stringify(cur.number) === JSON.stringify(stored.quote.number) ? cur : { ...cur, number: stored.quote.number }
        })
      }),
    [id],
  )

  const update: Update = useCallback((recipe) => {
    dirty.current = true
    setSaveState('saving')
    setQuote((q) => (q ? produce(q, recipe) : q))
  }, [])

  // Guardado automático (0.6 s después del último cambio)
  useEffect(() => {
    if (!quote || !dirty.current) return
    const t = setTimeout(() => {
      backend.quotes
        .saveBody(quote)
        .then(() => {
          dirty.current = false
          setSaveState('saved')
        })
        .catch(() => setSaveState('error'))
    }, 600)
    return () => clearTimeout(t)
  }, [quote])

  // Vista previa del PDF (0.8 s después del último cambio)
  useEffect(() => {
    if (!quote) return
    let alive = true
    const t = setTimeout(() => {
      generatePdfBlob(quote)
        .then((b) => {
          if (!alive) return
          setPdfBlob(b)
          setPdfError(null)
        })
        .catch((e) => alive && setPdfError(e instanceof Error ? e.message : String(e)))
    }, 800)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [quote])

  if (quote === undefined) return <p className="page muted">Cargando…</p>
  if (quote === null)
    return (
      <div className="page">
        <p>No se encontró la cotización.</p>
        <Button onClick={() => navigate('/')}>Volver</Button>
      </div>
    )

  const readOnly = meta.locked === true
  const getPdf = async () => (pdfBlob && !dirty.current ? pdfBlob : generatePdfBlob(quote))
  const download = async () => downloadBlob(await getPdf(), pdfFileNameOf(quote))

  /** Guarda lo pendiente antes de duplicar / revisar */
  const flush = async () => {
    if (dirty.current && !readOnly) {
      await backend.quotes.saveBody(quote)
      dirty.current = false
      setSaveState('saved')
    }
  }

  const duplicate = async () => {
    if (!confirm('¿Crear una cotización nueva copiando esta? Recibirá el próximo número y la fecha de hoy.')) return
    setBusy(true)
    try {
      await flush()
      const copy = duplicateQuote(quote)
      await backend.quotes.create(copy)
      navigate(`/cotizacion/${copy.id}`)
    } catch (e) {
      alert(`No se pudo duplicar: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const revise = async () => {
    if (quote.number.seq === null) return alert('Primero la cotización necesita su número oficial (Reservar número).')
    const next = newRevision(quote)
    if (!confirm(`¿Crear la revisión ${quoteNumberOf(next)}?\n\nLa versión actual (${quoteNumberOf(quote)}) quedará guardada y ya no se podrá modificar.`))
      return
    setBusy(true)
    try {
      await flush()
      await backend.quotes.createRevision(quote.id, next)
      navigate(`/cotizacion/${next.id}`)
    } catch (e) {
      alert(
        navigator.onLine
          ? `No se pudo crear la revisión: ${(e as Error).message}`
          : 'Para crear una revisión hace falta conexión (así nadie más la crea al mismo tiempo). Inténtalo cuando vuelva el internet.',
      )
    } finally {
      setBusy(false)
    }
  }

  const markSent = () => {
    setEmailOpen(false)
    if (!readOnly && quote.status !== 'sent' && confirm('¿Cambiar el estado de la cotización a "Enviada"?')) update((d) => void (d.status = 'sent'))
  }

  return (
    <div className="editor">
      <div className="editor__bar">
        <Button variant="ghost" onClick={() => navigate('/')}>
          ← Cotizaciones
        </Button>
        <div className="editor__title">
          <strong>{quoteNumberOf(quote)}</strong>
          <span className="muted">
            {QUOTE_TYPE_LABEL[quote.type]} · {quote.header.projectArea || 'Sin proyecto'}
          </span>
        </div>
        <span className={`save save--${readOnly ? 'saved' : saveState}`} role="status">
          {readOnly ? '🔒 Solo lectura' : saveState === 'saved' ? '✓ Guardado' : saveState === 'saving' ? 'Guardando…' : '⚠ Error al guardar'}
        </span>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'form'} onClick={() => setTab('form')}>
            Formulario
          </button>
          <button role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
            Vista previa
          </button>
        </div>
        <details className="menu">
          <summary className="btn">Acciones ▾</summary>
          <div className="menu__items" onClick={(e) => (e.currentTarget.parentElement as HTMLDetailsElement).removeAttribute('open')}>
            <button onClick={duplicate} disabled={busy}>
              Duplicar
              <small>Nueva, con el próximo número y la fecha de hoy</small>
            </button>
            <button onClick={revise} disabled={busy || readOnly}>
              Crear revisión
              <small>Mismo número + REV; esta versión queda guardada</small>
            </button>
            <button onClick={download}>
              Descargar PDF
              <small>{pdfFileNameOf(quote)}</small>
            </button>
          </div>
        </details>
        <Button variant="primary" onClick={() => setEmailOpen(true)}>
          Enviar por email
        </Button>
      </div>

      {readOnly ? (
        <div className="locked-banner" role="note">
          <span>
            🔒 <b>Versión anterior.</b> Esta cotización fue reemplazada por una revisión más nueva y no se puede modificar.
          </span>
          {meta.supersededBy ? <Button onClick={() => navigate(`/cotizacion/${meta.supersededBy}`)}>Ir a la versión más nueva</Button> : null}
        </div>
      ) : null}
      {emailOpen ? (
        <EmailDialog
          quote={quote}
          getPdf={getPdf}
          onClose={() => setEmailOpen(false)}
          onSent={markSent}
          onSaveEmail={readOnly ? undefined : (email) => update((d) => void (d.header.contactEmail = email))}
        />
      ) : null}

      <div className={`editor__body editor__body--${tab}`}>
        <fieldset className="editor__form" disabled={readOnly}>
          <HeaderForm quote={quote} update={update} />
          {quote.type === 'lumpSum' ? (
            <LumpSumForm quote={quote} update={update as Update<LumpSumQuote>} />
          ) : quote.type === 'premiumTime' ? (
            <PremiumTimeForm quote={quote} update={update as Update<PremiumTimeQuote>} />
          ) : (
            <TmForm quote={quote} update={update as Update<TmQuote>} />
          )}
        </fieldset>
        <aside className="editor__preview" aria-label="Vista previa del PDF">
          {pdfError ? <p className="warning">Error al generar el PDF: {pdfError}</p> : null}
          <PdfPreview blob={pdfBlob} />
        </aside>
      </div>
    </div>
  )
}
