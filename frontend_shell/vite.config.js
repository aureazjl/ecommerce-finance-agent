import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
/* global process */

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_URL || '/',
})
