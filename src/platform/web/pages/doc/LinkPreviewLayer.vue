<template>
  <link-popover
    v-for="(card, index) in cards"
    :key="card.docId"
    ref="popovers"
    :doc-id="card.docId"
    :doc-link="card.docLink"
    :x="card.x"
    :y="card.y"
    :pinned="card.pinned"
    :minimized="card.minimized"
    :stack-order="index"
    @activate="activate(card.docId)"
    @pin-change="setPinned(card.docId, $event)"
    @close="remove(card.docId)"
    @minimize-all="minimizeAll"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import EventBus from '@/platform/web/components/EventBus'
import LinkPopover from './LinkPopover.vue'
import { linkPreviewCounts, type LinkPreviewRequest } from './LinkPreview'
import DocUtils from '@/core/util/DocUtils'
import { readPinnedLinkPreviews, savePinnedLinkPreviews } from './LinkPreviewState'

interface PreviewCard extends LinkPreviewRequest {
  pinned: boolean
  minimized: boolean
}

export default defineComponent({
  components: { LinkPopover },
  data() {
    return {
      cards: readPinnedLinkPreviews().map((docId, index): PreviewCard => ({
        docId,
        docLink: '/' + DocUtils.docId2Url(docId),
        x: 80 + index * 24,
        y: 80 + index * 24,
        pinned: true,
        minimized: false,
      })),
    }
  },
  watch: {
    cards: {
      deep: true,
      immediate: true,
      handler() {
        linkPreviewCounts.hidden = this.cards.filter(card => card.minimized).length
        linkPreviewCounts.visible = this.cards.length - linkPreviewCounts.hidden
      },
    },
  },
  methods: {
    open(request: LinkPreviewRequest) {
      const existing = this.cards.find(card => card.docId === request.docId)
      if (existing) {
        existing.minimized = false
        this.activate(request.docId)
        this.focus(request.docId)
        return
      }
      // 固定及已收起卡片独立保留；新开预览替换显示中的临时卡片。
      this.popovers().forEach(card => card.hide())
      this.cards.push({ ...request, pinned: false, minimized: false })
      this.focus(request.docId)
    },
    minimizeAll() {
      this.cards.forEach(card => { card.minimized = true })
      this.$nextTick(() => EventBus.emit('focus-link-preview-restore', null))
    },
    restoreAll() {
      this.cards.forEach(card => { card.minimized = false })
      const top = this.cards[this.cards.length - 1]
      if (top) this.focus(top.docId)
    },
    popovers(): InstanceType<typeof LinkPopover>[] {
      return (this.$refs.popovers || []) as InstanceType<typeof LinkPopover>[]
    },
    activate(docId: string) {
      const index = this.cards.findIndex(card => card.docId === docId)
      if (index < 0 || index === this.cards.length - 1) return
      this.cards.push(...this.cards.splice(index, 1))
      this.rememberPinned()
    },
    focus(docId: string) {
      this.$nextTick(() => this.popovers().find(card => card.docId === docId)?.focus())
    },
    remove(docId: string) {
      this.cards = this.cards.filter(card => card.docId !== docId)
      this.rememberPinned()
    },
    setPinned(docId: string, pinned: boolean) {
      const card = this.cards.find(card => card.docId === docId)
      if (!card) return
      card.pinned = pinned
      this.rememberPinned()
    },
    rememberPinned() {
      savePinnedLinkPreviews(this.cards.filter(card => card.pinned).map(card => card.docId))
    },
    rememberCards() {
      this.popovers().forEach(card => card.rememberLayout(false))
    },
    onVisibilityChange() {
      if (document.visibilityState === 'hidden') this.rememberCards()
    },
    onKeydown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !this.cards.length || event.defaultPrevented) return
      // Mermaid 查看器优先处理 Esc，避免连带关闭其所属卡片。
      if (this.popovers().some(card => card.showingMermaid)) return
      if (Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]'))
        .some(dialog => dialog.getClientRects().length > 0)) return
      const top = this.cards.filter(card => !card.minimized).at(-1)
      if (!top) return
      this.popovers().find(card => card.docId === top.docId)?.hide0()
      const next = this.cards.filter(card => !card.minimized).at(-1)
      if (next) this.focus(next.docId)
    },
  },
  mounted() {
    EventBus.on('show-link-preview', this.open)
    EventBus.on('minimize-link-previews', this.minimizeAll)
    EventBus.on('restore-link-previews', this.restoreAll)
    document.addEventListener('keydown', this.onKeydown)
    window.addEventListener('pagehide', this.rememberCards)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  },
  beforeUnmount() {
    this.rememberCards()
  },
  unmounted() {
    linkPreviewCounts.hidden = 0
    linkPreviewCounts.visible = 0
    EventBus.off('show-link-preview', this.open)
    EventBus.off('minimize-link-previews', this.minimizeAll)
    EventBus.off('restore-link-previews', this.restoreAll)
    document.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('pagehide', this.rememberCards)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  },
})
</script>
