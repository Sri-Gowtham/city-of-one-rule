import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Served from https://sri-gowtham.github.io/city-of-one-rule/ by GitHub Pages, so the
  // production build needs that subpath as its base. `npm run dev` still serves from `/`.
  base: command === 'build' ? '/city-of-one-rule/' : '/',
  plugins: [react()],
}))
