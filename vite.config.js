// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 开发服务器配置（可选）
  server: {
    port: 3000,
    open: false // 不自动打开浏览器
  },

  // 构建配置
  build: {
    // 作为库输出（生成单个 bundle）
    lib: {
      entry: resolve(__dirname, 'src/js/app.js'), // 你的入口文件
      name: 'App', // 全局变量名（window.App）
      fileName: 'app.bundle',
      formats: ['iife'] // 立即执行函数，适合 <script> 标签
    },
    // 不打包外部依赖（但 Web3 需要打包进去）
    rollupOptions: {
      external: [], // 打包所有依赖
      output: {
        // 兼容旧版浏览器
        globals: {}
      }
    }
  },

  // 兼容 Node.js 模块
  define: {
    'process.env': {},
    'global': 'globalThis'
  },

  // 解决兼容性问题
  resolve: {
    alias: {
      // 可选：如果你用到 buffer
      buffer: 'buffer'
    }
  }
});