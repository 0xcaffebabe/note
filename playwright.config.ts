import { defineConfig, devices } from '@playwright/test'

// 端口与 vite.config.ts 的 preview.port、既有 HtmlEntryE2E 默认 baseUrl 三者对齐
const PORT = 4391
// 允许把套件指向已部署环境(如 https://note.ismy.wang)做线上冒烟 不传则本地拉起 preview
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  // 复用服务时先校验确实是生产 preview(而非被误复用的 dev server) 见 global-setup.ts
  globalSetup: './tests/e2e/global-setup.ts',
  // 单个文件内串行、文件间并行
  fullyParallel: true,
  // CI 里出现 test.only 直接判失败 防止误提交只跑一条
  forbidOnly: !!process.env.CI,
  // SW 激活 / echarts 力导布局 / postRender 轮询都有时序抖动 CI 下给 2 次重试兜底
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '50%' : undefined,
  timeout: 30_000,
  // 默认断言收紧到 10s 让「真的坏了」的断言更快变红(原 20s 会把红路径拖慢一倍)。
  // 真正慢的操作(SW 激活 / echarts 布局 / 力导)各自在调用处显式带 { timeout: 20000 }, 不受此默认影响。
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
  ],
  use: {
    baseURL,
    // 失败重试时才抓 trace/视频 控制产物体积
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // 必须跑「生产构建 + preview」: SW、生成的 .html 静态入口、.md.json、recoverDocPath
  // 这些只在 prod 构建里存在 dev 下要么没有要么走动态中间件
  // 指定 E2E_BASE_URL 时(测线上)不再本地起服务
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run serve',
        url: baseURL,
        timeout: 60_000,
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      // 移动端用例只在 mobile 工程跑
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      // 小视口(Pixel 5, ≤820)触发响应式 isMobile → 同一无前缀 URL 渲染移动布局(P5 合流后无 /m 分流)
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
})
