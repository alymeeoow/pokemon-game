import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  define: {
    global: 'window',
    'process.env': JSON.stringify({}),
    'process': JSON.stringify({
      env: {},
      nextTick: '((cb) => setTimeout(cb, 0))',
      version: '"v18.0.0"'
    })
  },
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-transform-runtime', {
            regenerator: true
          }]
        ]
      }
    }),
    tailwindcss()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/db.json']
    },
    hmr: {
      overlay: false
    },
    proxy: {
      '/myteams': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/myteams/, '')
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1600,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});