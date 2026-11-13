import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { canPromptInstall, isIos, isStandalone, onInstallChange, promptInstall } from './install.ts'

/** Botón "Instalar app" (Chrome/Edge) o enlace a las instrucciones (iPad/Safari). */
export function InstallButton() {
  const [, force] = useState(0)
  useEffect(() => onInstallChange(() => force((n) => n + 1)), [])
  if (isStandalone()) return null
  if (canPromptInstall())
    return (
      <button className="btn btn--install" onClick={() => void promptInstall()} title="Instalar como aplicación con acceso directo">
        ⤓ Instalar app
      </button>
    )
  return (
    <a className="btn btn--install" href="#/instalar" title="Cómo instalar la app en este dispositivo">
      ⤓ {isIos() ? 'Instalar en iPad' : 'Instalar'}
    </a>
  )
}

/** Avisos del service worker: "lista sin internet" y "hay una versión nueva". */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Revisa si hay versión nueva cada hora mientras la app está abierta
      if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000)
    },
  })

  useEffect(() => {
    if (!offlineReady) return
    const t = setTimeout(() => setOfflineReady(false), 6000)
    return () => clearTimeout(t)
  }, [offlineReady, setOfflineReady])

  if (needRefresh)
    return (
      <div className="toast" role="status">
        <span>Hay una versión nueva de la app.</span>
        <button className="btn btn--primary" onClick={() => void updateServiceWorker(true)}>
          Actualizar
        </button>
        <button className="btn btn--ghost" onClick={() => setNeedRefresh(false)}>
          Después
        </button>
      </div>
    )
  if (offlineReady)
    return (
      <div className="toast toast--ok" role="status">
        <span>✓ La app quedó guardada en este dispositivo: ya funciona sin internet.</span>
      </div>
    )
  return null
}
