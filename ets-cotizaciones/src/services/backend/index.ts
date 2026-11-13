import { isFirebaseConfigured } from '../firebase/config.ts'
import { firebaseBackend } from './firebase.ts'
import { localBackend } from './local.ts'
import type { Backend } from './types.ts'

/** Con Firebase configurado se usa la nube; si no, todo queda en este navegador. */
export const backend: Backend = isFirebaseConfigured ? firebaseBackend : localBackend

export type { AllowedUser, Backend, ChangeLogEntry, StoredQuote } from './types.ts'
