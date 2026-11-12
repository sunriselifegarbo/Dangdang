import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { zh } from './src/i18n/zh-CN'

export default defineConfig({
  base: '/Dangdang/',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    scope: '/Dangdang/',
    includeAssets: ['icons/*.png'],
    manifest: {
      id: '/Dangdang/', name: zh.appName, short_name: zh.appName,
      description: zh.description, lang: 'zh-CN',
      start_url: '/Dangdang/', scope: '/Dangdang/',
      display: 'standalone', background_color: '#10141b', theme_color: '#10141b',
      icons: [
        { src: '/Dangdang/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/Dangdang/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/Dangdang/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'], maximumFileSizeToCacheInBytes: 25 * 1024 * 1024 },
  })],
  test: { environment: 'node', setupFiles: ['./src/data/test-setup.ts'] },
})
