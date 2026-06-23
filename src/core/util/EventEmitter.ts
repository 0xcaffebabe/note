/**
 * 通用事件发射器(发布-订阅)。纯逻辑, 零框架/浏览器依赖, 可独立单测。
 * 应用层在此之上定义具体事件类型并实例化(见 src/components/EventBus.ts)。
 */
export class EventEmitter<E extends string = string> {
  private events = new Map<E, Function[]>()

  emit(eventName: E, data?: any): void {
    const list = this.events.get(eventName)
    if (list) {
      list.forEach(fn => fn(data))
    }
  }

  on(eventName: E, fn: Function): void {
    this.events.set(eventName, this.events.get(eventName) || [])
    this.events.get(eventName)!.push(fn)
  }

  off(eventName: E, fn: Function): void {
    const list = this.events.get(eventName)
    if (list) {
      for (let i = 0; i < list.length; i++) {
        if (list[i] === fn) {
          list.splice(i, 1)
          break
        }
      }
    }
  }
}
