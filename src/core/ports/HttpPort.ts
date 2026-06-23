// HTTP 端口: core 通过它获取远端数据, 不直接依赖浏览器 fetch / node fetch。
// 类型刻意只描述 core 真正用到的最小面, 不引入 lib.dom 的 Response/RequestInit,
// 这样 core 可在任意 JS 运行时独立编译; 适配器用各平台的 fetch 实现该接口。

export interface HttpResponse {
  readonly ok: boolean
  readonly status: number
  json(): Promise<any>
  text(): Promise<string>
}

export interface HttpRequestInit {
  method?: string
  headers?: Record<string, string>
  body?: string
}

export interface HttpPort {
  /** 发起请求, 语义同 fetch。失败由调用方处理。 */
  fetch(url: string, init?: HttpRequestInit): Promise<HttpResponse>
}
