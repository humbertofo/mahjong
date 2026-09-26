import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mahjong.solitaire.offline',
  appName: 'Mahjong Solitaire',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0C2417',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
