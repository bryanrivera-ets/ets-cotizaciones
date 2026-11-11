import { brand } from '../domain/brand.ts'

/**
 * Fase 1: pantalla de bienvenida provisional.
 * Las pantallas reales (cotizaciones, biblioteca, historial…) llegan en las fases 4–7.
 */
export default function App() {
  return (
    <main className="shell">
      <img src="/logo-ets.png" alt="ETS – Epoxy Technologies Systems" className="logo" />
      <h1>Cotizaciones ETS Corp.</h1>
      <p className="muted">Base del proyecto lista (Fase 1). Las funciones se agregan por fases.</p>
      <div className="swatches" aria-label="Colores de marca extraídos de los PDF">
        {Object.entries(brand.colors).map(([name, hex]) => (
          <div key={name} className="swatch">
            <span style={{ background: hex }} />
            <small>
              {name}
              <br />
              {hex}
            </small>
          </div>
        ))}
      </div>
    </main>
  )
}
