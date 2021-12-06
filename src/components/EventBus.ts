export type EventType = 'enter-zen-mode'
class EventBus {
  private static instance: EventBus
  private events: Map<EventType, Function[]>

  public static getInstance(){
    if (!this.instance) {
      this.instance = new EventBus()
    }
    return this.instance
  }

  private constructor() {
    this.events = new Map<EventType, Function[]>();
  }
  emit(eventName: EventType, data: any) {
    if (this.events.has(eventName)) {
      this.events.get(eventName)!.forEach(function (fn: Function) {
        fn(data);
      });
    }
  }
  on(eventName: EventType, fn: Function) {
    this.events.set(eventName, this.events.get(eventName) || []);
    this.events.get(eventName)!.push(fn);
  }

  off(eventName: EventType, fn: Function) {
    if (this.events.has(eventName)) {
      const fnList = this.events.get(eventName)!;
      for (var i = 0; i < fnList.length; i++) {
        if (fnList[i] === fn) {
          fnList.splice(i, 1);
          break;
        }
      };
    }
  }
}

export default EventBus.getInstance()