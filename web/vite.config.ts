import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // Allow the preview gateway to proxy through any preview-*.space-z.ai hostname.
    // Vite 8 enforces an allowed-hosts check; without this, the preview returns 403.
    allowedHosts: ['.space-z.ai', '.space-z.ai:81'],
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: ['.space-z.ai'],
  },
})
