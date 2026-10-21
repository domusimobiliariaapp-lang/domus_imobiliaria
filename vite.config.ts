import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api-asaas-sandbox': {
        target: 'https://sandbox.asaas.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-asaas-sandbox/, ''),
        secure: false,
      },
      '/api-asaas-production': {
        target: 'https://api.asaas.com/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-asaas-production/, ''),
        secure: false,
      },
    },
  },
})