import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DocUtils from '@/core/util/DocUtils'
import EventBus from '@/platform/web/components/EventBus'
import { isTouch } from '@/platform/web/composables/useBreakpoint'
import type { KnowledgeAssistantHandle } from './KnowledgeAssistantHandle'

/**
 * 管理全局知识助手入口：首次打开才挂载，跨路由保留弹窗实例，只更新可选文档。
 * 异步组件就绪后补发一次打开操作；应用卸载时释放事件和快捷键监听。
 */
export function useKnowledgeAssistant() {
  const route = useRoute()
  const assistantDoc = computed(() => DocUtils.routeDocId(route) || undefined)
  const assistantMounted = ref(false)
  const knowledgeAssistant = ref<KnowledgeAssistantHandle>()
  let openWhenReady = false

  function showKnowledgeAssistant(): void {
    assistantMounted.value = true
    if (knowledgeAssistant.value) {
      knowledgeAssistant.value.show()
    } else {
      openWhenReady = true
    }
  }

  watch(knowledgeAssistant, (panel) => {
    if (!panel || !openWhenReady) {
      return
    }
    openWhenReady = false
    panel.show()
  })

  function handleShortcut(event: KeyboardEvent): void {
    if (!isAssistantShortcut(event)) {
      return
    }
    event.preventDefault()
    showKnowledgeAssistant()
  }

  EventBus.on('show-knowledge-assistant', showKnowledgeAssistant)
  onMounted(() => document.addEventListener('keydown', handleShortcut))
  onBeforeUnmount(() => {
    EventBus.off('show-knowledge-assistant', showKnowledgeAssistant)
    document.removeEventListener('keydown', handleShortcut)
  })

  return { assistantDoc, assistantMounted, knowledgeAssistant }
}

/** Alt+I 同时支持逻辑键和输入法下的物理键；输入中或已处理的事件不抢占。 */
function isAssistantShortcut(event: KeyboardEvent): boolean {
  const target = event.target
  const typing =
    target instanceof HTMLElement &&
    target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
  if (isTouch.value || event.defaultPrevented || event.repeat || typing) {
    return false
  }
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return false
  }
  const physicalKey = event.code.toLowerCase().replace('key', '')
  return [event.key.toLowerCase(), physicalKey].includes('i')
}
