import NProgress from '@/util/NProgress'

export async function http(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  NProgress.start()
  try {
    return await fetch(input, init)
  } finally {
    NProgress.done()
  }
}
