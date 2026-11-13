import { newId } from '../../domain/factories.ts'
import type { ProposalTitle } from '../../domain/types.ts'
import { SIGNATURE_FONTS } from '../../pdf/signatureFonts.ts'
import { Button, Card, Field, Select, TextInput } from '../../ui/controls.tsx'
import { useLibrary } from '../library/context.ts'

const TITLES: { value: ProposalTitle; label: string }[] = [
  { value: 'ETS CORP. P R O P O S A L', label: 'ETS CORP. P R O P O S A L' },
  { value: 'P R O P O S A L', label: 'P R O P O S A L' },
]

export function ProfilesSettings() {
  const { library, update } = useLibrary()
  const { profiles, signers, terms } = library

  const removeProfile = (i: number) => {
    if (profiles.length === 1) return alert('Debe quedar al menos un perfil.')
    if (confirm(`¿Eliminar el perfil ${profiles[i].name} (${profiles[i].initials})? Las cotizaciones existentes no cambian.`))
      update('profiles', (d) => void d.splice(i, 1))
  }

  const removeSigner = (i: number) => {
    const s = signers[i]
    const used = profiles.filter((p) => p.defaultSignerId === s.id)
    if (used.length) return alert(`No se puede eliminar: es el firmante por defecto de ${used.map((p) => p.initials).join(', ')}.`)
    if (signers.length === 1) return alert('Debe quedar al menos un firmante.')
    if (confirm(`¿Eliminar el firmante ${s.name}? Las cotizaciones existentes no cambian.`)) update('signers', (d) => void d.splice(i, 1))
  }

  return (
    <>
      <Card title="Perfiles (quién prepara la cotización)">
        <p className="muted">Las iniciales salen en el pie de página del PDF. El resto son los valores por defecto de cada cotización nueva.</p>
        {profiles.map((p, i) => (
          <div key={p.id} className="group">
            <div className="grid">
              <Field label="Nombre">{(id) => <TextInput id={id} value={p.name} onChange={(v) => update('profiles', (d) => void (d[i].name = v))} />}</Field>
              <Field label="Iniciales">
                {(id) => <TextInput id={id} value={p.initials} onChange={(v) => update('profiles', (d) => void (d[i].initials = v.toUpperCase()))} />}
              </Field>
              <Field label="Título preferido">
                {(id) => <Select<ProposalTitle> id={id} value={p.preferredTitle} options={TITLES} onChange={(v) => update('profiles', (d) => void (d[i].preferredTitle = v))} />}
              </Field>
              <Field label="Términos preferidos">
                {(id) => (
                  <Select
                    id={id}
                    value={p.preferredTermsId}
                    options={terms.map((t) => ({ value: t.id, label: t.name }))}
                    onChange={(v) => update('profiles', (d) => void (d[i].preferredTermsId = v))}
                  />
                )}
              </Field>
              <Field label="Firmante por defecto">
                {(id) => (
                  <Select
                    id={id}
                    value={p.defaultSignerId}
                    options={signers.map((s) => ({ value: s.id, label: s.name }))}
                    onChange={(v) => update('profiles', (d) => void (d[i].defaultSignerId = v))}
                  />
                )}
              </Field>
            </div>
            <Button variant="danger" onClick={() => removeProfile(i)}>
              Eliminar perfil
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            update('profiles', (d) =>
              void d.push({
                id: newId(),
                name: '',
                initials: '',
                preferredTitle: 'ETS CORP. P R O P O S A L',
                preferredTermsId: terms[0]?.id ?? '',
                defaultSignerId: signers[0]?.id ?? '',
              }),
            )
          }
        >
          + Perfil
        </Button>
      </Card>

      <Card title="Firmantes (Acknowledge by)">
        {signers.map((s, i) => (
          <div key={s.id} className="group">
            <div className="grid">
              <Field label="Nombre">{(id) => <TextInput id={id} value={s.name} onChange={(v) => update('signers', (d) => void (d[i].name = v))} />}</Field>
              <Field label="Cargo">{(id) => <TextInput id={id} value={s.position} onChange={(v) => update('signers', (d) => void (d[i].position = v))} />}</Field>
              <Field label="Letra de la firma">
                {(id) => (
                  <Select
                    id={id}
                    value={s.signatureFont}
                    options={Object.entries(SIGNATURE_FONTS).map(([value, f]) => ({ value, label: f.label }))}
                    onChange={(v) => update('signers', (d) => void (d[i].signatureFont = v))}
                  />
                )}
              </Field>
              <div className="signature-preview" aria-label="Vista de la firma">
                <small>Acknowledge by:</small>
                <span style={{ fontFamily: `'${SIGNATURE_FONTS[s.signatureFont]?.family ?? 'Kalam'}'` }}>{s.name || 'Nombre'}</span>
                <small>{s.position}</small>
              </div>
            </div>
            <Button variant="danger" onClick={() => removeSigner(i)}>
              Eliminar firmante
            </Button>
          </div>
        ))}
        <Button variant="ghost" onClick={() => update('signers', (d) => void d.push({ id: newId(), name: '', position: '', signatureFont: 'signature-1' }))}>
          + Firmante
        </Button>
      </Card>
    </>
  )
}
