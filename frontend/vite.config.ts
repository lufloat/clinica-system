import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // bind mount do Windows não propaga inotify: sem polling o HMR
    // nunca dispara quando o Vite roda dentro do container
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
