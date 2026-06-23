import { describe, it, expect, beforeEach } from 'vitest'
import Cache from '@/core/cache/Cache'
import CacheService from '@/core/cache/CacheService'

// 守护 @Cache 装饰器(src/decorator/Cache.ts)的两条缓存策略, 它是 DocService/SearchService
// 各方法记忆化的核心。一旦命中/键/作用域逻辑出错, 会静默返回陈旧数据或反复重算大文档。
//
// 两条路径(由是否传 keyResolver 决定):
//  1) 默认(无 keyResolver): 键=JSON.stringify(arguments), 且 *只* 缓存 Promise 结果。
//     同步结果故意不缓存——TagService 之类同步方法依赖异步 init 填充数据,
//     过早缓存会把 init 前的空结果永久冻结。
//  2) 传 keyResolver: 方法被当作纯函数, 同步结果也缓存; 键完全由 resolver 决定
//     (不同入参解析出同键 => 共用同一条目, 对应"按文档内容做键"的大对象场景)。
//     Promise 仍走 .then 缓存 resolved 值。
//
// scope = name()+'-'+propertyKey, 因此不同类/不同方法互不串扰。
// LRU 淘汰已由 CacheService.test.ts 覆盖, 此处不重复。
//
// 装饰器用法照搬 DocService/SearchService: 先 `const cache = Cache()`(工厂取一个具名装饰器),
// 再在方法上 `@cache`; 带键的则 `const cacheByX = Cache(resolver)`。

const cacheService = new CacheService()

// 与各被测类配套的装饰器实例(工厂式, 与源码 DocService 写法一致)
const cacheDefault = Cache()
const cacheByFirstArg = Cache((a: any) => String(a))
const cacheConstKey = Cache(() => 'CONST') // 任意入参都解析为同一键

describe('@Cache 默认路径(无 keyResolver): 只缓存 Promise', () => {
  beforeEach(() => cacheService.clear()) // 单例共享, 每例清空

  // 每个用例用独立类/方法名 => 独立 scope, 避免跨例命中
  class AsyncSvc {
      cache = cacheService;    name() { return 'async-svc' }
    calls = 0
    @cacheDefault
    async fetch(x: number): Promise<number> {
      this.calls++
      return x * 2
    }
  }

  it('相同入参的 Promise 方法第二次不再真正执行(命中缓存)', async () => {
    const s = new AsyncSvc()
    expect(await s.fetch(5)).toBe(10)
    expect(await s.fetch(5)).toBe(10)
    expect(s.calls).toBe(1) // 仅首次真正执行
  })

  it('不同入参的 Promise 方法各自重新执行', async () => {
    const s = new AsyncSvc()
    expect(await s.fetch(1)).toBe(2)
    expect(await s.fetch(2)).toBe(4)
    expect(s.calls).toBe(2)
  })

  it('缓存键为 JSON.stringify(arguments): 形如 {"0":<arg>}', async () => {
    const s = new AsyncSvc()
    await s.fetch(7)
    // arguments 是类数组对象, JSON.stringify 产出 {"0":7}
    expect(cacheService.has('async-svc-fetch', JSON.stringify({ 0: 7 }))).toBe(true)
    // 朴素的 "7" / "[7]" 都不是其键
    expect(cacheService.has('async-svc-fetch', '7')).toBe(false)
    expect(cacheService.has('async-svc-fetch', '[7]')).toBe(false)
  })

  it('多参数全部纳入键: 任一参数不同即视为不同键', async () => {
    class MultiArg {
      cache = cacheService;      name() { return 'multi-arg' }
      calls = 0
      @cacheDefault
      async pair(a: number, b: number): Promise<number> {
        this.calls++
        return a + b
      }
    }
    const m = new MultiArg()
    await m.pair(1, 2)
    await m.pair(1, 3) // 第二参不同 => 不命中
    expect(m.calls).toBe(2)
    expect(cacheService.has('multi-arg-pair', JSON.stringify({ 0: 1, 1: 2 }))).toBe(true)
    expect(cacheService.has('multi-arg-pair', JSON.stringify({ 0: 1, 1: 3 }))).toBe(true)
  })

  it('缓存的是 resolved 数据本身, 不是 Promise 包装', async () => {
    const s = new AsyncSvc()
    await s.fetch(4)
    expect(cacheService.get('async-svc-fetch', JSON.stringify({ 0: 4 }))).toBe(8)
  })

  it('拒绝(reject)的 Promise 不被缓存, 后续调用会重试', async () => {
    class Flaky {
      cache = cacheService;      name() { return 'flaky' }
      calls = 0
      @cacheDefault
      async boom(x: number): Promise<number> {
        this.calls++
        throw new Error('boom')
      }
    }
    const f = new Flaky()
    await expect(f.boom(1)).rejects.toThrow('boom')
    await expect(f.boom(1)).rejects.toThrow('boom')
    expect(f.calls).toBe(2) // 失败未写缓存 => 重新执行
    expect(cacheService.has('flaky-boom', JSON.stringify({ 0: 1 }))).toBe(false)
  })

  it('已知行为: Promise 方法命中缓存时返回 *原始 resolved 值* 而非 Promise', async () => {
    // 首次返回 Promise, 命中后直接返回 cacheService.get(...) 即解包后的值。
    // 返回类型在首调/命中间不一致, 但因 `await 非Promise` 仍得到原值, 调用方不受影响。
    const s = new AsyncSvc()
    const first = s.fetch(9)
    expect(first instanceof Promise).toBe(true)
    await first
    const second = s.fetch(9)
    expect(second instanceof Promise).toBe(false) // 命中: 返回裸值
    expect(second).toBe(18)
    expect(await second).toBe(18) // 仍可被 await
  })
})

describe('@Cache 默认路径: 同步结果不缓存(防冻结 init 前空数据)', () => {
  beforeEach(() => cacheService.clear())

  class SyncSvc {
      cache = cacheService;    name() { return 'sync-svc' }
    calls = 0
    @cacheDefault
    compute(x: number): number {
      this.calls++
      return x * 3
    }
  }

  it('同步方法相同入参重复调用每次都真正执行', () => {
    const s = new SyncSvc()
    expect(s.compute(2)).toBe(6)
    expect(s.compute(2)).toBe(6)
    expect(s.compute(2)).toBe(6)
    expect(s.calls).toBe(3) // 默认不缓存同步结果
  })

  it('同步方法的结果根本不写入缓存', () => {
    const s = new SyncSvc()
    s.compute(2)
    expect(cacheService.has('sync-svc-compute', JSON.stringify({ 0: 2 }))).toBe(false)
  })

  it('返回 undefined 的同步方法也不缓存(不会误把 undefined 冻结)', () => {
    class VoidSvc {
      cache = cacheService;      name() { return 'void-svc' }
      calls = 0
      @cacheDefault
      noop(x: number): void {
        this.calls++
      }
    }
    const v = new VoidSvc()
    v.noop(1)
    v.noop(1)
    expect(v.calls).toBe(2)
    expect(cacheService.has('void-svc-noop', JSON.stringify({ 0: 1 }))).toBe(false)
  })
})

describe('@Cache keyResolver 路径: 同步结果也缓存', () => {
  beforeEach(() => cacheService.clear())

  class KeyedSync {
      cache = cacheService;    name() { return 'keyed-sync' }
    calls = 0
    @cacheByFirstArg
    transform(x: number): number {
      this.calls++
      return x * 5
    }
  }

  it('相同入参的同步方法命中缓存, 不重复执行', () => {
    const k = new KeyedSync()
    expect(k.transform(3)).toBe(15)
    expect(k.transform(3)).toBe(15)
    expect(k.calls).toBe(1)
  })

  it('不同入参(解析出不同键)各自重新执行', () => {
    const k = new KeyedSync()
    expect(k.transform(3)).toBe(15)
    expect(k.transform(4)).toBe(20)
    expect(k.calls).toBe(2)
  })

  it('缓存键由 resolver 决定: 写入 resolver 返回的字符串而非 JSON.stringify(arguments)', () => {
    const k = new KeyedSync()
    k.transform(3)
    expect(cacheService.has('keyed-sync-transform', '3')).toBe(true) // resolver => String(3)
    expect(cacheService.has('keyed-sync-transform', JSON.stringify({ 0: 3 }))).toBe(false)
    expect(cacheService.get('keyed-sync-transform', '3')).toBe(15)
  })

  it('不同入参解析出同一键 => 共用同一条目, 第二次入参被忽略, 返回首次缓存值(对应按内容做键的大文档场景)', () => {
    class ConstKeyed {
      cache = cacheService;      name() { return 'const-keyed' }
      calls = 0
      @cacheConstKey
      pick(x: number): number {
        this.calls++
        return x * 100
      }
    }
    const c = new ConstKeyed()
    const first = c.pick(1) // 键 'CONST', 缓存 100
    const second = c.pick(999) // 键仍 'CONST' => 命中, 忽略 999
    expect(first).toBe(100)
    expect(second).toBe(100) // 返回首次值, 而非 99900
    expect(c.calls).toBe(1)
  })

  it('keyResolver 路径下 Promise 仍走 .then 缓存 resolved 值', async () => {
    class KeyedAsync {
      cache = cacheService;      name() { return 'keyed-async' }
      calls = 0
      @cacheByFirstArg
      async load(x: number): Promise<number> {
        this.calls++
        return x * 2
      }
    }
    const k = new KeyedAsync()
    expect(await k.load(3)).toBe(6)
    expect(await k.load(3)).toBe(6)
    expect(k.calls).toBe(1)
    // 缓存的是 resolved 值, 键为 resolver 结果
    expect(cacheService.get('keyed-async-load', '3')).toBe(6)
  })
})

describe('@Cache 作用域隔离: name()+"-"+propertyKey', () => {
  beforeEach(() => cacheService.clear())

  it('两个不同类的同名方法各用独立 scope, 互不命中', async () => {
    class Alpha {
      cache = cacheService;      name() { return 'alpha' }
      calls = 0
      @cacheDefault
      run(x: number): Promise<number> { this.calls++; return Promise.resolve(x) }
    }
    class Beta {
      cache = cacheService;      name() { return 'beta' }
      calls = 0
      @cacheDefault
      run(x: number): Promise<number> { this.calls++; return Promise.resolve(x * 10) }
    }
    const a = new Alpha()
    const b = new Beta()
    expect(await a.run(1)).toBe(1)
    expect(await b.run(1)).toBe(10) // 同入参但不同 scope => 不会拿到 alpha 的 1
    expect(a.calls).toBe(1)
    expect(b.calls).toBe(1)
    expect(cacheService.has('alpha-run', JSON.stringify({ 0: 1 }))).toBe(true)
    expect(cacheService.has('beta-run', JSON.stringify({ 0: 1 }))).toBe(true)
  })

  it('同一类的两个不同方法各用独立 scope', async () => {
    class TwoMethods {
      cache = cacheService;      name() { return 'two-methods' }
      aCalls = 0
      bCalls = 0
      @cacheDefault
      first(x: number): Promise<number> { this.aCalls++; return Promise.resolve(x) }
      @cacheDefault
      second(x: number): Promise<number> { this.bCalls++; return Promise.resolve(x + 1) }
    }
    const t = new TwoMethods()
    expect(await t.first(1)).toBe(1)
    expect(await t.second(1)).toBe(2) // 同入参不同方法 => 不串扰
    expect(t.aCalls).toBe(1)
    expect(t.bCalls).toBe(1)
    expect(cacheService.has('two-methods-first', JSON.stringify({ 0: 1 }))).toBe(true)
    expect(cacheService.has('two-methods-second', JSON.stringify({ 0: 1 }))).toBe(true)
  })

  it('共享同一具名装饰器实例的两个类仍因 name() 不同而隔离', () => {
    // DocService 里多处复用同一个 const cacheByFileId; 隔离应来自 name(), 而非装饰器实例
    class One { cache = cacheService; name() { return 'one' } c = 0; @cacheByFirstArg s(x: number) { this.c++; return x } }
    class Two { cache = cacheService; name() { return 'two' } c = 0; @cacheByFirstArg s(x: number) { this.c++; return x * 2 } }
    const o = new One()
    const w = new Two()
    expect(o.s(5)).toBe(5)
    expect(w.s(5)).toBe(10) // 同 resolver 键 '5' 但 scope 不同
    expect(o.c).toBe(1)
    expect(w.c).toBe(1)
  })
})

describe('@Cache this 绑定与实例间共享', () => {
  beforeEach(() => cacheService.clear())

  it('原方法以正确的 this 执行(可访问实例字段)', async () => {
    class WithState {
      cache = cacheService;      name() { return 'with-state' }
      multiplier = 4
      @cacheDefault
      async scale(x: number): Promise<number> {
        return x * this.multiplier
      }
    }
    const s = new WithState()
    expect(await s.scale(3)).toBe(12) // 依赖 this.multiplier => this 必须正确绑定
  })

  it('缓存按 scope+key 共享, 不区分实例: 不同实例相同入参也会命中(scope 只看 name())', async () => {
    class Shared {
      cache = cacheService;      name() { return 'shared' }
      calls = 0
      @cacheDefault
      get(x: number): Promise<number> { this.calls++; return Promise.resolve(x) }
    }
    const a = new Shared()
    const b = new Shared()
    expect(await a.get(1)).toBe(1)
    expect(await b.get(1)).toBe(1) // 命中 a 写入的条目
    expect(a.calls).toBe(1)
    expect(b.calls).toBe(0) // b 的原方法根本没被执行
  })
})
