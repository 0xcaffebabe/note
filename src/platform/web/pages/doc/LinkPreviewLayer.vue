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
    :stack-order="index"
    @activate="activate(card.docId)"
    @pin-change="setPinned(card.docId, $event)"
    @close="remove(card.docId)"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import EventBus from '@/platform/web/components/EventBus'
import LinkPopover from './LinkPopover.vue'
import type { LinkPreviewRequest } from './LinkPreview'
import DocUtils from '@/core/util/DocUtils'
import { readPinnedLinkPreviews, savePinnedLinkPreviews } from './LinkPreviewState'

interface PreviewCard extends LinkPreviewRequest {
  pinned: boolean
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
      })),
    }
  },
  methods: {
    open(request: LinkPreviewRequest) {
      if (this.cards.some(card => card.docId === request.docId)) {
        this.activate(request.docId)
        this.focus(request.docId)
        return
      }
      // 固定卡片独立保留；临时预览同时只保留一张。
      this.popovers().forEach(card => card.hide())
      this.cards.push({ ...request, pinned: false })
      this.focus(request.docId)
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
      const top = this.cards[this.cards.length - 1]
      this.popovers().find(card => card.docId === top.docId)?.hide0()
      const next = this.cards[this.cards.length - 1]
      if (next) this.focus(next.docId)
    },
  },
  mounted() {
    EventBus.on('show-link-preview', this.open)
    document.addEventListener('keydown', this.onKeydown)
    window.addEventListener('pagehide', this.rememberCards)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  },
  beforeUnmount() {
    this.rememberCards()
  },
  unmounted() {
    EventBus.off('show-link-preview', this.open)
    document.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('pagehide', this.rememberCards)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  },
})
</script>
