import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Recarrega a página automaticamente se o usuário estiver com uma aba antiga aberta e um novo build for publicado
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})

// Registro do Service Worker com atualização automática:
// Quando um novo SW é encontrado no estado "waiting", força a ativação imediata
// sem precisar fechar todas as abas — resolve o problema de chunks estáticos 404.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Novo SW disponível: pede para ativar imediatamente e recarrega
            newWorker.postMessage({ type: 'SKIP_WAITING' })
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              window.location.reload()
            })
          }
        })
      })
    }).catch((err) => {
      console.warn('[SW] Falha no registro:', err)
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
