import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saltbbang',
  appName: 'salt-bbang',
  webDir: 'dist',
  server: {
    iosScheme: 'http',
  },
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
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com', 'apple.com'],
    },
  },
};

export default config;
