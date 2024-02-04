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

const plugins: Plugin[] = [];

// 打包生产环境才引入的插件
if (process.env.NODE_ENV === "production") {
  // 打包依赖展示
  plugins.push(
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: "dist/stats.html"
    }) as Plugin
  );
}

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    },
  },
  server: {
    fs: {
      strict: false
    },
    host: '0.0.0.0',
    hmr: { clientPort: process.env.CODESPACES ? 443 : undefined }
  },
  plugins: [
    ...plugins,
    VitePWA({
      registerType: 'autoUpdate', 
      includeAssets: ['favicon.ico'],
      manifest: {
        name: '知识体系',
        short_name: 'PKS',
        description: '个人知识体系',
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
        "languages": ["javascript", "css", "markup", "java", "sql",
          'c', 'go', 'python', 'ts', 'ruby', 'io', 'scala', 'groovy',
          'kotlin', 'ini', 'json', 'graphql', 'haskell', 'clojure', 'rust'],
        "plugins": ["line-numbers"]
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
    rollupOptions: {
      output: {
        manualChunks(id: string): string {
          const indepentDependcies = ['element-plus', 'vue', 'jspdf',
            'html2canvas', 'echarts', 'zrender', 'marked', 'mermaid',
            'katex', 'lodash-es', 'elkjs', 'cytoscape']
          for (let depend of indepentDependcies) {
            if (id.includes('node_modules') && id.includes(depend)) {
              return depend
            }
          }
          if (id.includes('node_modules')) {
            return 'vendor'
          }
          return ''
        }
      }
    }
  },
})
