import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En production (GitHub Pages projet), l'app est servie sous /neon-180/.
// En dev, base reste '/'.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/neon-180/' : '/',
  server: { port: 4180, host: true },
}))
