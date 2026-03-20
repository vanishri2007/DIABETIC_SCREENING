import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),

  ],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://https://diabetic-screening.onrender.com',
      '/patients': 'http://https://diabetic-screening.onrender.com',
      '/screening': 'http://https://diabetic-screening.onrender.com',
      '/chatbot': 'http://https://diabetic-screening.onrender.com',
      '/static': 'http://https://diabetic-screening.onrender.com'
    }
  }
})
