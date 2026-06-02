import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'react'
          if (id.includes('formik') || id.includes('yup')) return 'forms'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('recharts')) return 'charts'
          if (id.includes('framer-motion')) return 'motion'
          return 'vendor'
        },
      },
    },
  },
})
