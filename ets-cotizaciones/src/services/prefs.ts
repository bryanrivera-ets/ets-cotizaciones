/** Preferencias de este dispositivo (no se sincronizan). */
const PROFILE_KEY = 'ets.currentProfileId'

export function getCurrentProfileId(): string | null {
  try {
    return localStorage.getItem(PROFILE_KEY)
  } catch {
    return null
  }
}

export function setCurrentProfileId(id: string): void {
  try {
    localStorage.setItem(PROFILE_KEY, id)
  } catch {
    /* modo privado: se ignora */
  }
}
