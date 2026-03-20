import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),

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
