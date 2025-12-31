// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: false 
  },
 
  build: {
    lib: {
      entry: resolve(__dirname, 'src/js/app.js'), 
      name: 'App', // window.App
      fileName: 'app.bundle',
      formats: ['iife'] // immediately-invoked function expression
    },
    // rollupOptions for library build
    rollupOptions: {
      external: [], 
      output: {
        globals: {}
      }
    }
  },

  // compatibility settings
  define: {
    'process.env': {},
    'global': 'globalThis'
  },

  // module resolution settings
  resolve: {
    alias: {
      buffer: 'buffer'
    }
  }
});