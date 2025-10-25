import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
// import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

const isProd = process.env.BUILD_MODE === 'prod'
export default defineConfig({
  plugins: [
    react(), 
    // Disabled for debugging
    // sourceIdentifierPlugin({
    //   enabled: !isProd,
    //   attributePrefix: 'data-matrix',
    //   includeProps: true,
    // })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
          ],
          'obs-vendor': ['obs-websocket-js'],
          'supabase-vendor': ['@supabase/supabase-js'],
          // Lazy-loaded component chunks
          'live-control': ['./src/components/LiveControl.tsx'],
          'show-management': [
            './src/components/shows/ShowManager.tsx',
            './src/components/shows/EpisodeManager.tsx',
            './src/components/shows/GuestManager.tsx',
          ],
          'media': [
            './src/components/media/MediaLibrary.tsx',
            './src/components/media/PlaylistManager.tsx',
          ],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild',
    // Drop console.logs in production
    ...(isProd && {
      esbuild: {
        drop: ['console', 'debugger'],
      },
    }),
  },
})

