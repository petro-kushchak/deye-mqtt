import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const backendUrl = env.BACKEND_URL || '';
  const apiUrl = backendUrl || 'http://localhost:8000';
  const wsUrl = env.BACKEND_WS_URL || backendUrl.replace(/^http/, 'ws');

  return {
    plugins: [react()],
    optimizeDeps: {
      include: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
    },
    server: {
      proxy: {
        '/api': apiUrl,
        '/ws': {
          target: wsUrl,
          ws: true,
        },
      },
    },
  };
});
