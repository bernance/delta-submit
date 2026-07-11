import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: base must match your repo name exactly, e.g. '/delta-submit/'
// If your repo is named something else, change this to '/your-repo-name/'
export default defineConfig({
  plugins: [react()],
  base: '/delta-submit/',
})
