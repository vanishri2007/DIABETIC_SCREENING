import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Diabetic Retinopathy Screener',
        short_name: 'DR Screener',
        description: 'AI-Powered Diabetic Retinopathy Screening System',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/patients': 'http://localhost:8000',
      '/screening': 'http://localhost:8000',
      '/chatbot': 'http://localhost:8000',
      '/static': 'http://localhost:8000'
    }
  }
})
