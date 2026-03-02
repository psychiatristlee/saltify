import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  define: {
    __TOSS_BUILD__: process.env.VITE_TOSS_BUILD === 'true',
  },
});
