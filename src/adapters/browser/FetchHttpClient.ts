// HttpPort 的浏览器实现: 委托 ./http(fetch + 顶部进度条 NProgress)。
// 把浏览器 fetch 收敛到 ./http 单点, 既保留进度条行为, 也让测试可在该边界统一 mock。
import type { HttpPort, HttpRequestInit, HttpResponse } from '@/core/ports'
import { http } from './http'

export class FetchHttpClient implements HttpPort {
  async fetch(url: string, init?: HttpRequestInit): Promise<HttpResponse> {
    return http(url, init as RequestInit)
  }
}

export const browserHttpClient = new FetchHttpClient()
