import { useEffect, useState, type FormEvent } from 'react'
import { backend, type AllowedUser } from '../../services/backend/index.ts'
import { Button, Card, Field, Select, TextInput } from '../../ui/controls.tsx'
import { useAuth } from '../auth/context.ts'
import { useLibrary } from '../library/context.ts'

const AUTH_ERRORS: Record<string, string> = {
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/operation-not-allowed': 'En la consola de Firebase falta activar "Correo electrónico/contraseña".',
  'auth/admin-restricted-operation':
    'En la consola de Firebase está desactivada la creación de cuentas. Crea la cuenta allí y aquí solo autoriza el email (sin contraseña).',
}

export function UsersSettings() {
  const { email: me } = useAuth()
  const { library } = useLibrary()
  const [users, setUsers] = useState<AllowedUser[]>([])
  const [form, setForm] = useState({ email: '', name: '', password: '', profileId: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => backend.users.subscribe(setUsers), [])

  if (backend.mode === 'local')
    return (
      <Card title="Usuarios">
        <p className="muted">Los usuarios se administran cuando la app está conectada a Firebase.</p>
      </Card>
    )

  const add = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await backend.users.add({ email: form.email, name: form.name, profileId: form.profileId }, form.password || undefined)
      void backend.changelog.add('users', `Usuarios: autorizó a ${form.email.trim().toLowerCase()}`)
      setMsg({
        ok: true,
        text: form.password
          ? `Listo. ${form.email} ya puede entrar con la contraseña que escribiste (luego puede cambiarla con "Olvidé mi contraseña").`
          : `Listo. ${form.email} quedó autorizado.`,
      })
      setForm({ email: '', name: '', password: '', profileId: '' })
    } catch (err) {
      setMsg({ ok: false, text: AUTH_ERRORS[(err as { code?: string }).code ?? ''] ?? (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (u: AllowedUser) => {
    if (u.email === me) return alert('No puedes quitarte a ti mismo.')
    if (!confirm(`¿Quitar el acceso a ${u.email}? Ya no podrá ver ni editar nada.`)) return
    await backend.users.remove(u.email)
    void backend.changelog.add('users', `Usuarios: quitó el acceso a ${u.email}`)
  }

  const profileLabel = (id?: string) => library.profiles.find((p) => p.id === id)?.initials ?? '—'

  return (
    <>
      <Card title="Usuarios autorizados">
        <p className="muted">Solo estas personas pueden entrar a la app. No hay registro público.</p>
        <ul className="user-list">
          {[...users]
            .sort((a, b) => a.email.localeCompare(b.email))
            .map((u) => (
              <li key={u.email}>
                <div>
                  <strong>{u.name || u.email}</strong>
                  <span className="muted">
                    {u.email} · Perfil: {profileLabel(u.profileId)}
                    {u.email === me ? ' · (tú)' : ''}
                  </span>
                </div>
                <Button variant="danger" onClick={() => remove(u)} disabled={u.email === me}>
                  Quitar acceso
                </Button>
              </li>
            ))}
        </ul>
      </Card>

      <Card title="Agregar usuario">
        <form onSubmit={add} className="grid">
          <Field label="Email">{(id) => <TextInput id={id} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />}</Field>
          <Field label="Nombre">{(id) => <TextInput id={id} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />}</Field>
          <Field label="Perfil por defecto">
            {(id) => (
              <Select
                id={id}
                value={form.profileId}
                onChange={(v) => setForm({ ...form, profileId: v })}
                options={[{ value: '', label: '—' }, ...library.profiles.map((p) => ({ value: p.id, label: `${p.name} (${p.initials})` }))]}
              />
            )}
          </Field>
          <Field label="Contraseña inicial" hint="Vacío = solo autorizar un email que ya tiene cuenta">
            {(id) => (
              <input id={id} type="text" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            )}
          </Field>
          <div className="field field--wide">
            <Button type="submit" variant="primary" disabled={busy || !form.email.includes('@')}>
              {busy ? 'Agregando…' : 'Agregar usuario'}
            </Button>
          </div>
        </form>
        {msg ? <p className={msg.ok ? 'ok' : 'warning'}>{msg.text}</p> : null}
      </Card>
    </>
  )
}
