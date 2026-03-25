import { fileURLToPath, URL } from 'node:url'
import Markdown from 'unplugin-vue-markdown/vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      // 让 Vue 编译器同时处理 .vue 和 .md 文件
      include: [/\.vue$/, /\.md$/], 
    }),
    Markdown({}),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
