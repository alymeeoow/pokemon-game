import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'

export default defineConfig({
  define: {
    global: 'window',
    'process.env': {},
    'process.platform': '"browser"',
    'process.version': '"v18.0.0"'
  },
  plugins: [
    react({
      fastRefresh: {
        pauseOnError: true
      }
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      crypto: 'crypto-browserify',
      buffer: 'buffer/'
    }
  },
  optimizeDeps: {
    include: [
      'simple-peer',
      'events',
      'util',
      'stream',
      'crypto-browserify',
      'buffer'
    ],
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true
        }),
        NodeModulesPolyfillPlugin()
      ],
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    rollupOptions: {
      plugins: [
        rollupNodePolyFill()
      ]
    },
    chunkSizeWarningLimit: 1600
  },
  server: {
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
        secure: false
      }
    }
  }
})