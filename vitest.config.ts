import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run tests in Node.js environment (not browser)
    // so fs, path, os modules are available
    environment: 'node',
    include: ['electron/**/__tests__/**/*.test.ts'],
    // [P2-02] カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['electron/services/**/*.ts'],
      exclude: ['electron/services/__tests__/**'],
    },
  },
})
