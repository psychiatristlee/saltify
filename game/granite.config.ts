import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'saltbbang',
  brand: {
    displayName: '솔트빵',
    primaryColor: '#FF8C00',
    icon: '/brandings/thumbnail.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'game',
    overScrollMode: 'never',
  },
});
