import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),

  ],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'https://diabetic-screening.onrender.com',
      '/patients': 'https://diabetic-screening.onrender.com',
      '/screening': 'https://diabetic-screening.onrender.com',
      '/chatbot': 'https://diabetic-screening.onrender.com',
      '/static': 'https://diabetic-screening.onrender.com'
    }
  }
})
