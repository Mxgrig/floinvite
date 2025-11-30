import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite Configuration
 * Build tool for Floinvite
 */
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: false,
    open: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  build: {
    target: 'ES2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },

  preview: {
    port: 4173,
    strictPort: false,
  },

  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },

  css: {
    postcss: null,
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
})
