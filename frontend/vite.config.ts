import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/fournisseurs': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/commandes': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/receptions': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/factures': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/actuator': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
});

