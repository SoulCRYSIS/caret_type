/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  build: {
    // Firebase is a single lazily loaded chunk, fetched after first paint.
    chunkSizeWarningLimit: 700,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
