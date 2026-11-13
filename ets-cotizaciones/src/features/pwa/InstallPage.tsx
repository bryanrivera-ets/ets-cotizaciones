import { canPromptInstall, isIos, isStandalone, promptInstall } from './install.ts'

/** Instrucciones para instalar la app en cada tipo de dispositivo. */
export function InstallPage() {
  const ios = isIos()
  return (
    <div className="page install">
      <h1>Instalar la app</h1>
      {isStandalone() ? (
        <p className="ok">✓ Ya estás usando la app instalada.</p>
      ) : canPromptInstall() ? (
        <p>
          <button className="btn btn--primary" onClick={() => void promptInstall()}>
            ⤓ Instalar ahora
          </button>
        </p>
      ) : null}

      <section className={`card${ios ? ' card--highlight' : ''}`}>
        <h3>iPad (Safari)</h3>
        <ol>
          <li>
            Abre la app en <b>Safari</b> (no en Chrome).
          </li>
          <li>
            Toca el botón <b>Compartir</b> <span className="ios-share" aria-hidden /> (arriba a la derecha, un cuadrado con una flecha hacia arriba).
          </li>
          <li>
            Baja y toca <b>"Agregar a pantalla de inicio"</b> (<i>Add to Home Screen</i>).
          </li>
          <li>
            Toca <b>Agregar</b>. Aparece el ícono <b>Cotizaciones</b> con el cubo de ETS.
          </li>
          <li>Ábrela desde ese ícono: se ve a pantalla completa y funciona sin internet.</li>
        </ol>
        <p className="muted small">
          La primera vez entra con internet e inicia sesión; después ya puede abrir sin conexión.
        </p>
      </section>

      <section className={`card${!ios ? ' card--highlight' : ''}`}>
        <h3>Computadora Windows o Mac (Chrome o Edge)</h3>
        <ol>
          <li>
            Pulsa el botón <b>⤓ Instalar app</b> de arriba a la derecha, o el ícono de instalar <span className="kbd">⊕</span> en la barra de
            direcciones.
          </li>
          <li>
            Confirma con <b>Instalar</b>.
          </li>
          <li>
            Queda un acceso directo en el escritorio / menú Inicio (Windows) o en Aplicaciones / Dock (Mac). Se abre en su propia ventana.
          </li>
        </ol>
      </section>

      <section className="card">
        <h3>Mac con Safari</h3>
        <ol>
          <li>
            Menú <b>Archivo → Agregar al Dock</b> (Safari 17 o más nuevo).
          </li>
        </ol>
      </section>

      <p className="muted small">
        Las actualizaciones llegan solas: cuando haya una versión nueva aparece un aviso con el botón <b>Actualizar</b>.
      </p>
    </div>
  )
}
