import { defineConfig } from 'vitest/config'
import path from 'path'
import vue from '@vitejs/plugin-vue'

// 故意不复用 vite.config.ts: 那里挂着 DocServer / 各类 *Generator / VitePWA 等重型插件
// 只启用 @ 别名、TS 解析和组件所需的 Vue 插件，避免跑测时触发文档生成与 git 扫描
const alias = { '@': path.resolve(import.meta.dirname, 'src') }

export default defineConfig({
  resolve: { alias },
  test: {
    // 两层独立工程: 纯逻辑用 node 环境 组件/服务集成用 jsdom
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        plugins: [vue()],
        test: {
          name: 'component',
          environment: 'jsdom',
          // Node 26 的原生 localStorage 在未传 --localstorage-file 时为 undefined,
          // 会遮蔽 jsdom 的浏览器存储; 组件测试应使用各自 jsdom 环境的 Web Storage。
          execArgv: ['--no-experimental-webstorage'],
          include: ['tests/component/**/*.test.ts'],
        },
      },
    ],
  },
})
