/** Utilidades para compartir y descargar archivos desde el navegador. */

/** ¿El navegador puede compartir archivos (menú Compartir del iPad, Chrome en Android/Windows)? */
export function canShareFiles(): boolean {
  try {
    const probe = new File(['x'], 'x.pdf', { type: 'application/pdf' })
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
