import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';

// Filtrer les logs de proxy ECONNREFUSED lorsque les services Spring Boot (:8081, :8082, :8083)
// ne sont pas démarrés localement (le frontend bascule automatiquement en mode démo).
const customLogger = createLogger();
const originalError = customLogger.error;
customLogger.error = (msg, options) => {
  if (typeof msg === 'string' && msg.includes('http proxy error')) {
    return;
  }
  originalError(msg, options);
};

export default defineConfig({
  customLogger,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/fournisseurs': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/actuator': {
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
      '/api/health': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
    },
  },
});
