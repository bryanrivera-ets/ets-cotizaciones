/**
 * Enviar la cotización por email.
 * - iPad / navegadores que lo permiten: menú "Compartir" del sistema con el PDF adjunto.
 * - Si no: descarga el PDF con su nombre y abre el programa de correo con destinatario,
 *   asunto y mensaje ya escritos (el PDF se adjunta a mano desde Descargas).
 */
import { useEffect, useRef, useState } from 'react'
import { pdfFileNameOf } from '../../domain/format.ts'
import { emailBody, emailSubject, mailtoUrl } from '../../domain/management.ts'
import type { Quote } from '../../domain/types.ts'
import { Button, Field, TextArea, TextInput } from '../../ui/controls.tsx'
import { canShareFiles, downloadBlob } from '../../ui/files.ts'

export function EmailDialog({
  quote,
  getPdf,
  onClose,
  onSent,
  onSaveEmail,
}: {
  quote: Quote
  getPdf: () => Promise<Blob>
  onClose: () => void
  /** Se llama después de compartir / abrir el correo (para ofrecer marcar "Enviada") */
  onSent: () => void
  /** Guarda el email del contacto en la cotización si se escribió aquí */
  onSaveEmail?: (email: string) => void
}) {
  const [to, setTo] = useState(quote.header.contactEmail ?? '')
  const [subject, setSubject] = useState(() => emailSubject(quote))
  const [body, setBody] = useState(() => emailBody(quote))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const share = canShareFiles()
  const fileName = pdfFileNameOf(quote)

  useEffect(() => {
    const d = dialog.current
    if (d && !d.open) d.showModal()
  }, [])

  const rememberEmail = () => {
    if (onSaveEmail && to.trim() && to.trim() !== (quote.header.contactEmail ?? '')) onSaveEmail(to.trim())
  }

  const doShare = async () => {
    setBusy(true)
    setError(null)
    try {
      const file = new File([await getPdf()], fileName, { type: 'application/pdf' })
      await navigator.share({ files: [file], title: subject, text: body })
      rememberEmail()
      onSent()
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(`No se pudo compartir: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const doMailto = async () => {
    setBusy(true)
    setError(null)
    try {
      downloadBlob(await getPdf(), fileName)
      window.location.href = mailtoUrl(to, subject, body)
      rememberEmail()
      setTimeout(onSent, 800)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog ref={dialog} className="dialog" onCancel={onClose} aria-labelledby="email-title">
      <form method="dialog" onSubmit={(e) => e.preventDefault()}>
        <h2 id="email-title">Enviar por email</h2>
        {!navigator.onLine ? <p className="warning">Sin conexión: el correo se enviará cuando vuelva el internet.</p> : null}
        <Field label="Para" hint="Varios correos separados por coma">
          {(id) => <TextInput id={id} value={to} onChange={setTo} placeholder="nombre@empresa.com" />}
        </Field>
        <Field label="Asunto">{(id) => <TextInput id={id} value={subject} onChange={setSubject} />}</Field>
        <Field label="Mensaje">{(id) => <TextArea id={id} rows={8} value={body} onChange={setBody} />}</Field>
        <p className="muted small">
          Adjunto: <b>{fileName}</b>
        </p>
        {error ? <p className="warning">{error}</p> : null}
        <div className="dialog__actions">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          {share ? (
            <>
              <Button onClick={doMailto} disabled={busy} title="Descarga el PDF y abre el correo con el asunto y el mensaje">
                Descargar y abrir correo
              </Button>
              <Button variant="primary" onClick={doShare} disabled={busy}>
                {busy ? 'Preparando…' : 'Compartir PDF…'}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={doMailto} disabled={busy || !to.includes('@')}>
              {busy ? 'Preparando…' : 'Descargar PDF y abrir correo'}
            </Button>
          )}
        </div>
        {share ? (
          <p className="muted small">"Compartir" abre el menú del sistema (Mail, Outlook, WhatsApp…) con el PDF ya adjunto.</p>
        ) : (
          <p className="muted small">Se descarga el PDF y se abre tu programa de correo: adjunta el PDF desde la carpeta Descargas.</p>
        )}
      </form>
    </dialog>
  )
}
