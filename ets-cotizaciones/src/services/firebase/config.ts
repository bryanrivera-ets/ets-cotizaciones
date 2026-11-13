/**
 * Configuración de Firebase. Los valores vienen de variables de entorno (archivo .env):
 * ver .env.example y docs/FIREBASE-CONFIGURACION.md.
 *
 * Nota: la "apiKey" de Firebase para web NO es secreta (identifica el proyecto);
 * la seguridad está en las reglas de Firestore (firestore.rules).
 */
const env = import.meta.env

export const useEmulators = env.VITE_FIREBASE_EMULATORS === 'true'

export const firebaseConfig = useEmulators
  ? { apiKey: 'demo-key', authDomain: 'demo-ets.firebaseapp.com', projectId: 'demo-ets', appId: 'demo-app' }
  : env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID
    ? {
        apiKey: env.VITE_FIREBASE_API_KEY as string,
        authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string) || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
        projectId: env.VITE_FIREBASE_PROJECT_ID as string,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
        appId: env.VITE_FIREBASE_APP_ID as string,
      }
    : null

export const isFirebaseConfigured = firebaseConfig !== null
