import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'auth_mfe',
      filename: 'remoteEntry.js',
      exposes: {
        './SignIn': './src/components/SignIn.tsx',
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: {
    port: 5177,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 5177,
    strictPort: true,
    cors: true
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
