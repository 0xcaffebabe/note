import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import DocServer from './src/plugins/DocServer'
import DocBuildMove from './src/plugins/DocBuildMove'
import WordCloudGenrator from './src/plugins/WordCloudGenerator'
import StatisticInfoGenerator from './src/plugins/StatisticInfoGenerator'
import KnowledgeNetworkGenerator from './src/plugins/KnowledgeNetworkGenerator'
import DocTagsGenerator from './src/plugins/DocTagsGenerator'
import VitePluginPrismjs from 'vite-plugin-prismjs'

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
    host: '0.0.0.0'
  },
  plugins: [
    vue(),
    DocServer(),
    {
      ...DocBuildMove(),
      enforce: 'post',
      apply: 'build'
    },
    {
      ...WordCloudGenrator(),
      apply: 'build'
    },
    {
      ...StatisticInfoGenerator(),
      apply: 'build'
    },
    {
      ...KnowledgeNetworkGenerator(),
      apply: 'build'
    },
    {
      ...DocTagsGenerator(),
      apply: 'build'
    },
    {
      ...VitePluginPrismjs({
        "languages": ["javascript", "css", "markup", "java", "sql", 
        'c', 'go', 'python', 'ts', 'ruby', 'io', 'scala', 'groovy', 
        'kotlin', 'ini', 'json', 'graphql', 'haskell', 'clojure', 'rust'],
        "plugins": ["line-numbers"]
      }),
    }
  ],
  build: {
    assetsDir: "resource",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id: string): string {
          if (id.includes('node_modules') && id.includes('element')) {
            return 'element'
          } else if (id.includes('node_modules') && id.includes('vue')) {
            return 'vue'
          } else if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  },
})
