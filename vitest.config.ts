import { defineConfig } from 'vitest/config'
import path from 'path'

// 故意不复用 vite.config.ts: 那里挂着 DocServer / 各类 *Generator / VitePWA 等重型插件
// 单测/组件测只需要 @ 别名 + ts 解析 不想在每次跑测时触发文档生成与 git 扫描
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
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['tests/component/**/*.test.ts'],
        },
      },
    ],
  },
})
