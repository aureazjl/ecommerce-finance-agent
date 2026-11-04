import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
/* global process */

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_URL || '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mui: ['@mui/material', '@mui/icons-material'],
          calendar: ['@fullcalendar/react', '@fullcalendar/core', '@fullcalendar/daygrid', '@fullcalendar/timegrid'],
          charts: ['@nivo/bar', '@nivo/line', '@nivo/pie', '@nivo/geo'],
        },
      },
    },
  },
})
