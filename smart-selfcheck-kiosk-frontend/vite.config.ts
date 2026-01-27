import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.0.149:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      // This redirects lottie-web to the light version
      'lottie-web': 'lottie-web/build/player/lottie_light.js',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Put lottie into a separate chunk named 'vendor-lottie'
          'vendor-lottie': ['lottie-react'],
          // Put react and other core libraries into 'vendor-core'
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
