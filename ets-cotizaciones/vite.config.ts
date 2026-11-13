/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Hay versión nueva → la app muestra "Actualizar" (no se recarga sola mientras alguien edita)
      registerType: 'prompt',
      includeAssets: ['logo-ets.png', 'icons/*.png', 'fonts/*.ttf'],
      manifest: {
        name: 'ETS Cotizaciones',
        short_name: 'Cotizaciones',
        description: 'Cotizaciones (proposals) de ETS Corp. – Epoxy Technologies Systems',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ffffff',
        theme_color: '#1f4e79',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Guarda TODA la app para abrir sin internet: código, estilos, fuentes del PDF, logo,
        // íconos y el motor de la vista previa (pdf.js)
        globPatterns: ['**/*.{js,mjs,css,html,png,svg,ttf,woff2,webmanifest}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Rutas internas de Firebase (inicio de sesión) nunca salen de la caché
        navigateFallbackDenylist: [/^\/__\//],
        cleanupOutdatedCaches: true,
        // Sin comprimir el service worker (modo "development" de Workbox, sin mensajes de depuración):
        // ese paso usaba mucha memoria y fallaba en algunas computadoras con
        // "JavaScript heap out of memory". El archivo es pequeño igual.
        mode: 'development',
        disableDevLogs: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  build: { chunkSizeWarningLimit: 2500 },
  test: {
    globals: true,
    environment: 'node',
    // 'threads' evita el error "VirtualAlloc failed" que dan los procesos 'forks' en algunos Windows
    pool: 'threads',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
