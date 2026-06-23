// 应用级事件总线: 在通用 core EventEmitter 之上声明具体事件类型, 导出单例供跨组件协调。
import { EventEmitter } from '@/core/util/EventEmitter'

export type EventType = 'enter-zen-mode' | 'show-mobile-search'

export default new EventEmitter<EventType>()
