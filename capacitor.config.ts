import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'se.askr.app',
  appName: 'ASKR',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
    backgroundColor: '#0B0D0F'
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
