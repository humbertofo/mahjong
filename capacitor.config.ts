import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mahjong.solitaire.offline',
  appName: 'Mahjong Solitaire',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#051E1A',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LiveUpdate: {
      autoUpdateStrategy: 'none',
      resetOnUpdate: false,
      readyTimeout: 0,
    },
  },
};

export default config;
