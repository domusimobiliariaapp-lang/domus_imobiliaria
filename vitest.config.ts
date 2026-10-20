import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Os testes rodam sem navegador.
 *
 * Só o que é conta de dinheiro entra aqui: o cálculo de repasse e o fluxo de
 * caixa. Um E2E de navegador para o resto (login, criação de cliente, upload)
 * precisa de um servidor de verdade e de credenciais de teste, e o custo de
 * mantê-lo é maior que o retorno.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
