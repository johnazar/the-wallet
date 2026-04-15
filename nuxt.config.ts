import { defineNuxtConfig } from 'nuxt/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineNuxtConfig({
  ssr: false,
  css: ['~/assets/css/tailwind.css'],
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'The Wallet',
          short_name: 'Wallet',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#06b6d4',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        }
      })
    ]
  },
  build: { transpile: ['vue-chartjs'] }
})
