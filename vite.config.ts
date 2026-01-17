import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/mcp': {
        target: 'https://mcp.mcd.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mcp/, '/mcp-servers/mcd-mcp'),
        secure: true,
      }
    }
  }
})
