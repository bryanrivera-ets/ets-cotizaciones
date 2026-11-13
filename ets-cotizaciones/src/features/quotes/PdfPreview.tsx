/**
 * Vista previa del PDF dibujada página por página con pdf.js.
 * (Safari del iPad solo muestra la primera página de un PDF dentro de un iframe.)
 */
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useEffect, useRef, useState } from 'react'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export function PdfPreview({ blob }: { blob: Blob | null }) {
  const container = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!blob || !container.current) return
    let cancelled = false
    const el = container.current
    ;(async () => {
      try {
        const data = new Uint8Array(await blob.arrayBuffer())
        const task = pdfjs.getDocument({ data })
        const doc = await task.promise
        if (cancelled) return
        const width = el.clientWidth || 600
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        const canvases: HTMLCanvasElement[] = []
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n)
          const base = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: (width / base.width) * ratio })
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          canvas.style.width = '100%'
          canvas.setAttribute('aria-label', `Página ${n} de ${doc.numPages}`)
          await page.render({ canvas, viewport }).promise
          if (cancelled) return
          canvases.push(canvas)
        }
        // Se reemplaza todo de una vez para que la vista no "parpadee"
        el.replaceChildren(...canvases)
        setPages(doc.numPages)
        setError(null)
        void task.destroy()
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [blob])

  return (
    <div className="preview">
      {error ? <p className="warning">No se pudo mostrar la vista previa: {error}</p> : null}
      <div ref={container} className="preview__pages" data-pages={pages} />
      {!blob ? <p className="muted">Generando vista previa…</p> : null}
    </div>
  )
}
