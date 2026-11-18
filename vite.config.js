import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 这个文件是用来告诉 Vite（我们的打包工具）怎么运行项目的
export default defineConfig({
  plugins: [vue()], // 让 Vite 认识 .vue 结尾的文件
  server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
})