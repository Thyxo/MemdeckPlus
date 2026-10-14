import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// StackMaster – Vite + React + PWA (Workbox generateSW).
// Alt (JS, CSS, fonte, ikoner) precaches, så appen virker 100 % offline.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'icons/*.svg', 'favicon.svg'],
      manifest: {
        id: '/',
        name: 'StackMaster',
        short_name: 'StackMaster',
        description: 'Lær, husk og brug memorerede kortspil (Mnemonica m.fl.)',
        lang: 'da',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#08130f',
        theme_color: '#0b1d17',
        categories: ['education', 'games', 'entertainment'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Dagens træning', url: '/#/train/daily', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Hurtigt opslag', url: '/#/tools/lookup', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        // Kun latinske font-subsets precaches (dansk/engelsk); øvrige hentes ved behov.
        globIgnores: ['**/*{cyrillic,greek,vietnamese}*'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
