import { FullConfig } from '@playwright/test'

// 健康门: reuseExistingServer 会复用本地 4391 上的「任何」服务。若那是个 dev server(或残留进程),
// 整套设计明令禁止的 dev 形态(无 SW / 无预渲染 .html / 无 *.md.json)会被悄悄复用、以诡异方式失败。
// 这里在跑用例前先抓一篇 prod 静态入口校验 static-content, 缺失就立刻以清晰报错终止, 而非让几十个用例莫名挂掉。
export default async function globalSetup(_config: FullConfig) {
  const PORT = 4391
  const base = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`
  const url = `${base}/home.html`
  let body = ''
  try {
    const resp = await fetch(url)
    body = await resp.text()
  } catch (e) {
    throw new Error(`E2E 预检失败: 无法访问 ${url} —— preview 服务未就绪? (${String(e)})`)
  }
  // 生产构建的 .html 入口带预渲染正文(含 static-content); dev server 返回的是空壳模板, 不含该标记
  if (!body.includes('static-content')) {
    throw new Error(
      `E2E 预检失败: ${url} 不含预渲染的 static-content —— 复用到的很可能是 dev server 而非 'npm run serve' 生产 preview。\n` +
        `请停掉占用 ${PORT} 的非 preview 进程, 或先 npm run build && npm run serve。`
    )
  }
}
