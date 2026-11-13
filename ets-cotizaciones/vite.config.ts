/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    // 'threads' evita el error "VirtualAlloc failed" que dan los procesos 'forks' en algunos Windows
    pool: 'threads',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
