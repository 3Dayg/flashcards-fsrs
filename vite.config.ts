/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves from https://<user>.github.io/<repo>/
export default defineConfig({
  plugins: [react()],
  base: '/flashcards-fsrs/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
