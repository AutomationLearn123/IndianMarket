import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  root: './',
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: 'trading-dashboard.html',
        manual: 'manual-analysis.html'
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
