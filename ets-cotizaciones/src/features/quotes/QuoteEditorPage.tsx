import { produce } from 'immer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { QUOTE_TYPE_LABEL } from '../../domain/factories.ts'
import { pdfFileNameOf, quoteNumberOf } from '../../domain/format.ts'
import type { LumpSumQuote, PremiumTimeQuote, Quote, TmQuote } from '../../domain/types.ts'
import { generatePdfBlob } from '../../pdf/browser.ts'
import { localQuoteStore } from '../../services/localStore.ts'
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
  const dirty = useRef(false)

  // Cargar
  useEffect(() => {
    let alive = true
    localQuoteStore.get(id).then((s) => alive && setQuote(s?.quote ?? null))
    return () => {
      alive = false
    }
  }, [id])

  const update: Update = useCallback((recipe) => {
    dirty.current = true
    setSaveState('saving')
    setQuote((q) => (q ? produce(q, recipe) : q))
  }, [])

  // Guardado automático (0.6 s después del último cambio)
  useEffect(() => {
    if (!quote || !dirty.current) return
    const t = setTimeout(() => {
      localQuoteStore
        .save(quote)
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

  const download = async () => {
    const blob = pdfBlob ?? (await generatePdfBlob(quote))
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = pdfFileNameOf(quote)
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
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
        <span className={`save save--${saveState}`} role="status">
          {saveState === 'saved' ? '✓ Guardado' : saveState === 'saving' ? 'Guardando…' : '⚠ Error al guardar'}
        </span>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'form'} onClick={() => setTab('form')}>
            Formulario
          </button>
          <button role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
            Vista previa
          </button>
        </div>
        <Button variant="primary" onClick={download}>
          Descargar PDF
        </Button>
      </div>

      <div className={`editor__body editor__body--${tab}`}>
        <div className="editor__form">
          <HeaderForm quote={quote} update={update} />
          {quote.type === 'lumpSum' ? (
            <LumpSumForm quote={quote} update={update as Update<LumpSumQuote>} />
          ) : quote.type === 'premiumTime' ? (
            <PremiumTimeForm quote={quote} update={update as Update<PremiumTimeQuote>} />
          ) : (
            <TmForm quote={quote} update={update as Update<TmQuote>} />
          )}
        </div>
        <aside className="editor__preview" aria-label="Vista previa del PDF">
          {pdfError ? <p className="warning">Error al generar el PDF: {pdfError}</p> : null}
          <PdfPreview blob={pdfBlob} />
        </aside>
      </div>
    </div>
  )
}
