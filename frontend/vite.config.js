import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow external connections
    allowedHosts: [
      'aithink.truyenthong.edu.vn',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5172',
        changeOrigin: true,
        ws: true
      },
      '/socket.io': {
        target: 'http://localhost:5172',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
