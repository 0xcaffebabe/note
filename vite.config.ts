import { defineConfig, Plugin, PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import DocServer from './src/plugins/DocServer'
import DocBuildMove from './src/plugins/DocBuildMove'
import StatisticInfoGenerator from './src/plugins/StatisticInfoGenerator'
import CommitTotalTrendGenerator from './src/plugins/CommitTotalTrendGenerator'
import BuildTimeGenerator from './src/plugins/BuildTimeGenerator'
import VitePluginPrismjs from 'vite-plugin-prismjs'
import DataGenrator from './src/plugins/DataGenerator'
import {visualizer} from "rollup-plugin-visualizer"
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { VitePWA } from 'vite-plugin-pwa'

// vite 8 的 runner 配置加载器会把装饰器转译引入的虚拟模块（\0 前缀路径）记入配置依赖，
// dev server 的文件监听对含空字节的路径执行 stat 会直接崩溃，这里将其从依赖列表剔除
const stripVirtualConfigDeps: Plugin = {
  name: 'strip-virtual-config-deps',
  configResolved(config) {
    const deps = config.configFileDependencies as string[]
    for (let i = deps.length - 1; i >= 0; i--) {
      if (deps[i].includes('\0')) deps.splice(i, 1)
    }
  }
}

const plugins: Plugin[] = [];

// 打包生产环境才引入的插件
if (process.env.NODE_ENV === "production") {
  // 打包依赖展示
  // plugins.push(
  //   visualizer({
  //     open: true,
  //     gzipSize: true,
  //     brotliSize: true,
  //     filename: "dist/stats.html"
  //   }) as Plugin
  // );
}

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src")
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        // 让每个 .less / SFC <style lang="less"> 都能直接用 @bp-mobile/@bp-desktop
        // 断点变量(与 src/const/breakpoints.ts 同源)而无需逐文件 @import。
        // paths 让 @import "breakpoints.less" 从 src 解析; 跳过文件自身避免自导入。
        paths: [path.resolve(import.meta.dirname, "src")],
        additionalData: (source: string, filename: string) =>
          filename.replace(/\\/g, "/").endsWith("src/breakpoints.less")
            ? source
            : `@import "breakpoints.less";\n${source}`,
      },
    },
  },
  server: {
    fs: {
      strict: false
    },
    host: '0.0.0.0',
    hmr: { clientPort: process.env.CODESPACES ? 443 : undefined }
  },
  // E2E(Playwright)与既有 HtmlEntryE2E 默认 baseUrl 都指向 4391
  // vite preview 默认端口是 4173 这里显式对齐 strictPort 让端口被占用时直接报错而非静默改端口
  preview: {
    port: 4391,
    strictPort: true,
    host: '0.0.0.0'
  },
  plugins: [
    stripVirtualConfigDeps,
    ...plugins,
    VitePWA({
      // prompt模式: 配合main.ts的onNeedRefresh提示用户刷新 避免静默接管导致页面无预警重载
      registerType: 'prompt',
      includeAssets: ['favicon.ico'],
      workbox: {
        // 只预缓存应用入口，避免首次访问就在后台下载全站约10MB资源
        // （含mermaid/echarts/cytoscape等懒加载chunk和300+个文档JSON）
        globPatterns: ['**/index.html'],
        // .html是真实静态入口 导航不走app shell 保证直接访问/查看源码拿到带正文的静态文件
        // 无扩展名路径(/ /cluster 及旧链接)仍由app shell接管
        navigateFallbackDenylist: [/\.html(\?|$)/],
        runtimeCaching: [
          {
            // 文档页导航网络优先 离线时回退到已访问过的缓存副本
            urlPattern: /\.html(\?|$)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'doc-pages',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 带内容哈希的静态资源不会变更，缓存优先
            urlPattern: /\/resource\/.*\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hashed-assets',
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 文档与统计数据按需缓存，先返回缓存同时后台刷新
            urlPattern: /\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'doc-data',
              expiration: { maxEntries: 500 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: '知识体系',
        short_name: 'PKS',
        description: '知识体系',
        display: 'standalone',
        background_color: '#F1F5F9',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    vue(),
    DocServer(),
    BuildTimeGenerator(),
    {
      ...DocBuildMove(),
      enforce: 'post',
      apply: 'build'
    },
    {
      ...StatisticInfoGenerator(),
      apply: 'build'
    },
    {
      ...CommitTotalTrendGenerator(),
      apply: 'build'
    },
    {
      ...DataGenrator(),
      apply: 'build'
    },
    {
      ...VitePluginPrismjs({
        // 笔记高频语言补全: bash/yaml/docker/nginx/http/properties
        // markup已含html/xml/svg; line-numbers插件只对highlightElement生效 运行时走字符串API 引入无效 故移除
        "languages": ["javascript", "css", "markup", "java", "sql",
          'c', 'go', 'python', 'ts', 'ruby', 'io', 'scala', 'groovy',
          'kotlin', 'ini', 'json', 'graphql', 'haskell', 'clojure', 'rust',
          'bash', 'yaml', 'docker', 'nginx', 'http', 'properties'],
      }),
    },
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  build: {
    assetsDir: "resource",
    emptyOutDir: false,
  },
})
