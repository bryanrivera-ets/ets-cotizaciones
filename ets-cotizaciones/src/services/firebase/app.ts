import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { firebaseConfig, useEmulators } from './config.ts'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

/** Inicializa Firebase una sola vez. Caché persistente y multi-pestaña: todo funciona sin internet. */
export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!firebaseConfig) throw new Error('Firebase no está configurado (falta el archivo .env)')
  if (!app) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      // Los campos opcionales vacíos (undefined) simplemente no se guardan
      ignoreUndefinedProperties: true,
    })
    if (useEmulators) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
      connectFirestoreEmulator(db, '127.0.0.1', 8080)
    }
  }
  return { app: app!, auth: auth!, db: db! }
}
