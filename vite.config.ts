import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Demo build: everything is bundled or served from /public so the site runs offline.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
