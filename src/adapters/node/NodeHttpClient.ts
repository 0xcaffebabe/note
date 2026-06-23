// HttpPort 的 node 实现: 用 node 全局 fetch(构建期无需进度条)。
import type { HttpPort, HttpRequestInit, HttpResponse } from '../../core/ports/HttpPort'

export class NodeHttpClient implements HttpPort {
  fetch(url: string, init?: HttpRequestInit): Promise<HttpResponse> {
    return fetch(url, init as RequestInit) as unknown as Promise<HttpResponse>
  }
}

export const nodeHttpClient = new NodeHttpClient()
