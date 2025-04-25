import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Add these react plugin options to prevent fast refresh issues
      fastRefresh: {
        pauseOnError: true // Prevents full reload on errors
      }
    }),
    tailwindcss()
  ],
  server: {
    watch: {
      // Ignore JSON server file changes to prevent reloads
      ignored: ['**/db.json']
    },
    hmr: {
      overlay: false // Disable error overlay that forces reloads
    },
    // Proxy API requests to your JSON server
    proxy: {
      '/myteams': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    // Add chunk size warning limit
    chunkSizeWarningLimit: 1600
  }
})