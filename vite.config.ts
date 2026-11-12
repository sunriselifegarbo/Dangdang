import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { zh } from './src/i18n/zh-CN'

export default defineConfig({
  base: '/Dangdang/',
  plugins: [react(), {
    name: 'local-only-policy', apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' data: blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'" }, injectTo: 'head' }, { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } }, { tag: 'meta', attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' } }, { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: zh.appName } }],
  }, VitePWA({
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
    workbox: { globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,gz,wasm,txt}'], maximumFileSizeToCacheInBytes: 25 * 1024 * 1024 },
  })],
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('pinyin-pro')) return 'pinyin'
    if (id.includes('tesseract.js')) return 'ocr'
    if (id.includes('dexie')) return 'database'
    if (id.includes('node_modules')) return 'vendor'
  } } } },
  test: { environment: 'node', setupFiles: ['./src/data/test-setup.ts'] },
})
