import { defineConfig } from 'vitest/config'

/** Pruebas de reglas de Firestore: necesitan el emulador (npm run test:rules lo inicia). */
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    pool: 'threads',
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
})
