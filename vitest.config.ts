import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test-setup.ts',
        exclude: ['src/__tests__/*-region.test.ts', 'node_modules/**'],
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
})
