import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saltify.game',
  appName: 'Saltify',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#fff8e7',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#fff8e7',
      showSpinner: false,
    },
  },
};

export default config;
