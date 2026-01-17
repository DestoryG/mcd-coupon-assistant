import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // 开发环境：将 Netlify Function 路径代理到实际的 MCP Server
      '/.netlify/functions/mcp': {
        target: 'https://mcp.mcd.cn',
        changeOrigin: true,
        rewrite: (path) => '/mcp-servers/mcd-mcp',
        secure: true,
      }
    }
  }
})
