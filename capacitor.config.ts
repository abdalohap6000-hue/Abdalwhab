import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qalami.app',
  appName: 'قلمي',
  webDir: 'dist',
  icon: 'public/icon-512.png',
  server: {
    // https ضروري لعمل جلسة Supabase والكوكيز داخل WebView بسلاسة
    androidScheme: 'https',
  },
};

export default config;
