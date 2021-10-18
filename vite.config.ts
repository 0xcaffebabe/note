import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import DocServer from './src/plugins/DocServer'
import DocBuildMove from './src/plugins/DocBuildMove'
import WordCloudGenrator from './src/plugins/WordCloudGenerator'
import StatisticInfoGenerator from './src/plugins/StatisticInfoGenerator'

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
    }
  ],
  build: {
    assetsDir: "resource",
    emptyOutDir: false
  }
})
