/**
 * Instalación como app.
 * - Chrome / Edge (Windows, Mac, Android): el navegador dispara "beforeinstallprompt";
 *   lo guardamos para mostrar nuestro propio botón "Instalar app".
 * - iPad / iPhone (Safari): no hay ese evento; se instala con Compartir → "Agregar a pantalla de inicio".
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const subs = new Set<() => void>()
const notify = () => subs.forEach((cb) => cb())

/** Se llama al arrancar (antes que React) para no perder el evento. */
export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export function onInstallChange(cb: () => void): () => void {
  subs.add(cb)
  return () => void subs.delete(cb)
}

export const canPromptInstall = () => deferred !== null

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const ev = deferred
  deferred = null
  notify()
  await ev.prompt()
  return (await ev.userChoice).outcome === 'accepted'
}

/** ¿Ya se está usando como app instalada? */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** iPad / iPhone (el iPad moderno dice ser "Macintosh", pero tiene pantalla táctil). */
export function isIos(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}
