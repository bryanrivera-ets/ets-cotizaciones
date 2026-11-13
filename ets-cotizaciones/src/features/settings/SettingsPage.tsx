import { CatalogSettings } from './CatalogSettings.tsx'
import { ChangeLogSettings } from './ChangeLogSettings.tsx'
import { NumberingSettings } from './NumberingSettings.tsx'
import { ProfilesSettings } from './ProfilesSettings.tsx'
import { SystemsSettings } from './SystemsSettings.tsx'
import { TermsSettings } from './TermsSettings.tsx'
import { UsersSettings } from './UsersSettings.tsx'

const TABS = [
  { id: 'sistemas', label: 'Sistemas', el: <SystemsSettings /> },
  { id: 'catalogo', label: 'Catálogo T&M', el: <CatalogSettings /> },
  { id: 'terminos', label: 'Términos', el: <TermsSettings /> },
  { id: 'perfiles', label: 'Perfiles y firmantes', el: <ProfilesSettings /> },
  { id: 'usuarios', label: 'Usuarios', el: <UsersSettings /> },
  { id: 'numeracion', label: 'Numeración', el: <NumberingSettings /> },
  { id: 'historial', label: 'Historial de cambios', el: <ChangeLogSettings /> },
]

export function SettingsPage({ tab, navigate }: { tab: string; navigate: (p: string) => void }) {
  const current = TABS.find((t) => t.id === tab) ?? TABS[0]
  return (
    <div className="page page--wide">
      <div className="page__head">
        <h1>Configuración</h1>
      </div>
      <div className="tabs tabs--always" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={t.id === current.id} onClick={() => navigate(`/configuracion/${t.id}`)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="settings-body">{current.el}</div>
    </div>
  )
}
