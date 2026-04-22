import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This resolves @ to the src folder
  // So instead of ../../components/Button you can write @/components/Button
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
