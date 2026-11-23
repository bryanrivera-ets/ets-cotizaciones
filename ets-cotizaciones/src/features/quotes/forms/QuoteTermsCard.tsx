import { termsCustomized } from '../../../domain/terms.ts'
import type { Quote, TermsLine } from '../../../domain/types.ts'
import { Button, Card } from '../../../ui/controls.tsx'
import { useLibrary } from '../../library/context.ts'
import { TermsLinesEditor } from '../../terms/TermsLinesEditor.tsx'
import type { Update } from '../editorTypes.ts'

/**
 * Términos y condiciones de ESTA cotización: se pueden desactivar o editar líneas.
 * No cambia la versión guardada en Configuración ni otras cotizaciones.
 */
export function QuoteTermsCard({ quote, update }: { quote: Quote; update: Update }) {
  const { library } = useLibrary()
  const original = library.terms.find((t) => t.id === quote.terms.id)
  const customized = termsCustomized(quote.terms, original)
  const hidden = quote.terms.lines.filter((l) => l.hidden).length
  const upLines = (fn: (lines: TermsLine[]) => void) => update((d) => fn(d.terms.lines))

  const restore = () => {
    if (!original) return
    if (confirm(`¿Volver al texto de "${original.name}" tal como está en Configuración? Se pierden los cambios hechos aquí.`))
      update((d) => void (d.terms = structuredClone(original)))
  }

  return (
    <Card
      title={
        <>
          Términos y condiciones{' '}
          {customized ? <span className="badge badge--sent">Modificados en esta cotización</span> : null}
        </>
      }
      actions={
        <div className="btn-row">
          {hidden ? (
            <Button variant="ghost" onClick={() => upLines((ls) => ls.forEach((l) => void (l.hidden = undefined)))}>
              Activar todas
            </Button>
          ) : null}
          <Button variant="ghost" onClick={restore} disabled={!original || !customized} title={original ? '' : 'Esta versión ya no existe en Configuración'}>
            Restaurar
          </Button>
        </div>
      }
    >
      <p className="muted small">
        Versión: <b>{quote.terms.name}</b>
        {hidden ? ` · ${hidden} línea${hidden === 1 ? '' : 's'} desactivada${hidden === 1 ? '' : 's'}` : ''}. Quita la marca para que una línea
        no salga en el PDF, o pulsa ✎ para editarla. Los cambios son solo para esta cotización.
      </p>
      <TermsLinesEditor lines={quote.terms.lines} update={upLines} compact />
    </Card>
  )
}
