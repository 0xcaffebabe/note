<template>
  <div class="site-navigation-host" :class="{ embedded, 'with-bottom-bar': withBottomBar, 'is-positioned': positioned }">
    <div ref="dragBounds" class="navigation-drag-bounds" aria-hidden="true"></div>
    <nav ref="dock" class="site-dock" :class="{ expanded, 'is-positioned': positioned, 'is-dragging': dragging, 'expand-right': layout?.side === 'right', stacked }" :style="dockStyle" aria-label="站内导航" @pointerenter="handlePointerEnter" @pointerleave="handlePointerLeave" @focusin="cancelCollapse" @focusout="scheduleCollapse" @keydown.esc.stop.prevent="closeMenu">
      <transition name="dock-shortcuts">
        <div v-show="expanded" id="site-navigation-shortcuts" ref="shortcuts" class="dock-shortcuts" :style="shortcutStyle">
          <div class="site-nav">
            <router-link v-for="item in navList" :key="item.path" :to="item.path" class="nav-item dock-action" :aria-label="item.name" :title="item.name" :aria-current="$route.path.startsWith(item.match) ? 'page' : undefined" @click="collapse">
              <el-icon><component :is="item.icon" /></el-icon><span>{{ item.name }}</span>
            </router-link>
            <router-link v-if="canReturnToRecentDoc" :to="recentDocPath" class="recent-document dock-action" aria-label="返回最近文档" :title="`返回最近文档：${recentDocName}`" @click="collapse">
              <el-icon><Reading /></el-icon>
            </router-link>
            <button v-else type="button" class="recent-document dock-action" aria-label="返回最近文档" :title="recentDoc ? `当前正在阅读：${recentDocName}` : '暂无阅读记录'" disabled>
              <el-icon><Reading /></el-icon>
            </button>
          </div>
          <button type="button" class="search-box dock-action" aria-label="搜索 (Ctrl+K)" @click="search()">
            <el-icon><Search /></el-icon><span>搜索</span><kbd>{{ metaKeyLabel }} K</kbd>
          </button>
          <button
            type="button"
            class="bridge-button dock-action"
            :class="{ connected: bridgeState === 'ready' }"
            :aria-label="`Note Bridge：${bridgeStatusText}`"
            :title="bridgeStatusText"
            @click="openBridge"
          >
            <el-icon><Connection /></el-icon>
            <span>Note Bridge</span>
            <span v-if="bridgeState === 'ready'" class="bridge-label">已连接</span>
          </button>
          <el-popover v-model:visible="menuOpen" trigger="click" role="dialog" aria-label="站点导航与工具" placement="top-end" :popper-options="popperOptions" :width="280" popper-class="site-navigation-popover" @after-enter="focusMenu" @after-leave="restoreLauncherFocus">
            <template #reference>
              <button type="button" class="more-btn dock-action" title="更多工具" aria-label="站点导航与工具" data-link-preview-control>
                <el-icon><MoreFilled /></el-icon>
              </button>
            </template>
            <section id="site-navigation-panel" ref="panel" class="site-navigation-panel" :class="{ 'with-bottom-bar': withBottomBar }" aria-label="站点导航与工具" @keydown.esc.stop.prevent="closeMenu">
              <p class="panel-title">{{ siteName }}</p>
              <div class="panel-actions">
                <button type="button" class="assistant-entry" aria-label="知识助手" @click="openAssistant">
                  <el-icon><MagicStick /></el-icon>
                  <span>知识助手</span>
                  <kbd v-if="!isTouch" aria-hidden="true">Alt I</kbd>
                </button>
                <div class="theme-row"><span>深色模式</span><theme-switcher class="action-item" aria-label="深色模式" /></div>
                <button type="button" @click="toggleFullScreen"><el-icon><FullScreen /></el-icon>{{ fullscreen ? '退出全屏' : '全屏' }}</button>
                <button type="button" @click="enterZenMode"><el-icon><Aim /></el-icon>专注模式</button>
                <button v-if="positioned" type="button" @click="resetDockPosition"><el-icon><RefreshLeft /></el-icon>恢复默认位置</button>
                <button v-if="linkPreviewCounts.visible" type="button" data-link-preview-control @click.stop="minimizePreviews"><el-icon><Hide /></el-icon>隐藏所有预览</button>
              </div>
              <slot name="document-tools" :close="closeDocumentTools" />
              <div class="panel-links">
                <a v-for="link in linkList" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.title }}<el-icon><TopRight /></el-icon></a>
              </div>
              <p v-if="message" class="panel-message" role="status">{{ message }}</p>
            </section>
          </el-popover>
        </div>
      </transition>
      <div class="navigation-handle" data-link-preview-control>
        <button ref="launcher" type="button" class="navigation-launcher dock-action" :class="{ 'bridge-ready': bridgeState === 'ready' }" :title="(expanded ? '收起站点导航' : '展开站点导航') + '（可拖动）'" :aria-label="expanded ? '收起站点导航' : '展开站点导航'" :aria-describedby="bridgeState === 'ready' ? 'navigation-bridge-status' : undefined" aria-description="拖动可调整位置，更多工具中可恢复默认位置" :aria-expanded="expanded" aria-controls="site-navigation-shortcuts" @pointerdown="start" @pointermove="move" @pointerup="handlePointerUp" @pointercancel="cancelPointer" @lostpointercapture="lostCapture" @contextmenu.prevent @click="toggleNavigation">
          <el-icon><ArrowRightBold v-if="expanded" /><Menu v-else /></el-icon>
          <span
            v-if="bridgeState === 'ready'"
            id="navigation-bridge-status"
            class="bridge-mini-status"
            role="status"
            aria-label="Note Bridge 已连接"
          >已连接</span>
        </button>
        <button
          v-if="linkPreviewCounts.hidden"
          ref="restorePreviewsButton"
          type="button"
          class="preview-restore"
          :aria-label="`恢复全部 ${linkPreviewCounts.hidden} 个隐藏预览`"
          :title="`恢复全部 ${linkPreviewCounts.hidden} 个隐藏预览`"
          @click.stop="restorePreviews"
        >{{ linkPreviewCounts.hidden }}</button>
      </div>
    </nav>
    <NoteBridgeConnection v-model="bridgeOpen" @closed="restoreBridgeFocus" />
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Aim, ArrowRightBold, CollectionTag, Connection, FullScreen, Hide, HomeFilled, MagicStick, Menu, MoreFilled, Reading, RefreshLeft, Search, Share, TopRight } from '@element-plus/icons-vue';
import config from '@/core/config/config';
import DocUtils from '@/core/util/DocUtils';
import { useServices } from '@/platform/web/app/useServices';
import { isMac } from '@/adapters/browser/Platform';
import { exitFullScreen, isFullScreen, requestFullScreen } from '@/adapters/browser/WindowAdapter';
import EventBus from '@/platform/web/components/EventBus';
import ThemeSwitcher from '../header/ThemeSwitcher.vue';
import { useDraggableNavigation } from './useDraggableNavigation';
import { linkPreviewCounts } from '@/platform/web/pages/doc/LinkPreview';
import NoteBridgeConnection from './NoteBridgeConnection.vue';
import { useAiBridgeConnection } from './useAiBridgeConnection';
import { isTouch } from '@/platform/web/composables/useBreakpoint';

defineProps<{ embedded?: boolean; withBottomBar?: boolean }>();
const route = useRoute();
const { docService } = useServices();
const { bridge, state: bridgeState, statusText: bridgeStatusText } = useAiBridgeConnection();
const bridgeOpen = ref(false);
const recentDoc = ref(docService.getLastReadRecord());
const recentDocPath = computed(() => DocUtils.docId2HtmlPath(recentDoc.value));
const recentDocName = computed(() => DocUtils.docId2DisplayName(recentDoc.value));
const canReturnToRecentDoc = computed(() => !!recentDoc.value && recentDoc.value !== DocUtils.routeDocId(route));
const expanded = ref(false);
const menuOpen = ref(false);
const fullscreen = ref(false);
const message = ref('');
const dock = ref<HTMLElement>();
const launcher = ref<HTMLButtonElement>();
const restorePreviewsButton = ref<HTMLButtonElement>();
const panel = ref<HTMLElement>();
const shortcuts = ref<HTMLElement>();
const dragBounds = ref<HTMLElement>();
const { positioned, dragging, hoverBlocked, layout, stacked, dockStyle, shortcutStyle, start, move, finish, cancel, cancelPointer, lostCapture, consumeClick, reset, allowHover } = useDraggableNavigation(dock, launcher, shortcuts, dragBounds, expanded, collapse);
const popperOptions = { modifiers: [{ name: 'preventOverflow', options: { padding: 8, altAxis: true } }] };
let collapseTimer: ReturnType<typeof setTimeout> | undefined;
let returnFocusAfterMenu = false;
let bridgeReturnFocus: HTMLElement | null = null;
const siteName = config.siteName;
const linkList = config.linkList;
const metaKeyLabel = isMac() ? '⌘' : 'Ctrl';
const navList = [
  { name: '首页', path: '/home.html', match: '/home', icon: markRaw(HomeFilled) },
  { name: '标签', path: '/tag.html', match: '/tag', icon: markRaw(CollectionTag) },
  { name: '聚类', path: '/cluster.html', match: '/cluster', icon: markRaw(Share) },
];

function collapse() {
  returnFocusAfterMenu = false;
  cancelCollapse();
  menuOpen.value = false;
  expanded.value = false;
}

/** 连接弹窗接管焦点前记录触发位置；导航本身折叠以避免两个面板争用焦点。 */
function openBridge() {
  bridgeReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  collapse();
  bridgeOpen.value = true;
}

/** 原触发元素仍可见时恢复它，否则回到稳定的导航入口。 */
function restoreBridgeFocus() {
  const target = bridgeReturnFocus?.isConnected && bridgeReturnFocus.getClientRects().length
    ? bridgeReturnFocus
    : launcher.value;
  target?.focus({ preventScroll: true });
  bridgeReturnFocus = null;
}

function closeDocumentTools() {
  collapse();
  launcher.value?.focus({ preventScroll: true });
}

function openAssistant() {
  closeDocumentTools();
  EventBus.emit('show-knowledge-assistant', null);
}

function minimizePreviews() {
  collapse();
  EventBus.emit('minimize-link-previews', null);
}

function restorePreviews() {
  collapse();
  EventBus.emit('restore-link-previews', null);
}

function focusPreviewRestore() {
  restorePreviewsButton.value?.focus({ preventScroll: true });
}

function search(mode?: 'category' | 'fulltext') {
  collapse();
  EventBus.emit('show-site-search', mode);
}

function cancelCollapse() {
  clearTimeout(collapseTimer);
  collapseTimer = undefined;
}

function handlePointerEnter(event: PointerEvent) {
  cancelCollapse();
  if (event.pointerType === 'mouse' && !hoverBlocked.value) expanded.value = true;
}

function handlePointerLeave() {
  allowHover();
  scheduleCollapse();
}

function scheduleCollapse() {
  cancelCollapse();
  if (!expanded.value || dragging.value) return;
  collapseTimer = setTimeout(() => {
    if (!menuOpen.value && !dock.value?.contains(document.activeElement) && !dock.value?.matches(':hover')) collapse();
  }, 180);
}

function handlePointerUp(event: PointerEvent) {
  if (!finish(event)) return;
  launcher.value?.focus({ preventScroll: true });
  toggleNavigation(event, true);
}

async function toggleNavigation(event: MouseEvent, fromTouch = false) {
  if (!fromTouch && consumeClick(event)) return;
  if (expanded.value) {
    collapse();
  } else {
    expanded.value = true;
    if (event.detail === 0 && !fromTouch) {
      await nextTick();
      dock.value?.querySelector<HTMLAnchorElement>('.site-nav a')?.focus({ preventScroll: true });
    }
  }
}

function handleOutside(event: PointerEvent) {
  const target = event.target as Node;
  if (!dock.value?.contains(target) && !panel.value?.contains(target)) collapse();
}

function focusMenu() {
  if (menuOpen.value) panel.value?.querySelector<HTMLElement>('[role="switch"]:not(:disabled), button:not(:disabled), a[href]')?.focus();
}

async function closeMenu() {
  cancel();
  const hadMenu = menuOpen.value;
  collapse();
  returnFocusAfterMenu = hadMenu;
  await nextTick();
  launcher.value?.focus({ preventScroll: true });
}

function resetDockPosition() {
  reset();
  closeMenu();
}

function restoreLauncherFocus() {
  if (!returnFocusAfterMenu) return;
  returnFocusAfterMenu = false;
  launcher.value?.focus({ preventScroll: true });
}

async function toggleFullScreen() {
  message.value = '';
  try {
    if (isFullScreen()) await exitFullScreen();
    else await requestFullScreen();
    closeMenu();
  } catch {
    message.value = '当前浏览器无法切换全屏';
  }
}

async function enterZenMode() {
  closeMenu();
  EventBus.emit('enter-zen-mode', null);
  if (!isFullScreen() && document.fullscreenEnabled) {
    try {
      await requestFullScreen();
    } catch {
      // 全屏不可用时仍保留收起侧栏的专注布局。
    }
  }
}

function syncFullScreen() {
  fullscreen.value = isFullScreen();
}

watch(() => route.fullPath, () => { cancel(); collapse(); bridgeOpen.value = false; });
watch(expanded, (visible) => {
  if (visible) recentDoc.value = docService.getLastReadRecord();
});
watch(menuOpen, (visible) => {
  if (visible) {
    returnFocusAfterMenu = false;
    cancelCollapse();
    expanded.value = true;
  } else {
    scheduleCollapse();
  }
});
onMounted(() => {
  bridge.initialize();
  EventBus.on('show-note-bridge', openBridge);
  EventBus.on('focus-link-preview-restore', focusPreviewRestore);
  syncFullScreen();
  document.addEventListener('fullscreenchange', syncFullScreen);
  document.addEventListener('pointerdown', handleOutside);
});
onBeforeUnmount(() => {
  EventBus.off('show-note-bridge', openBridge);
  EventBus.off('focus-link-preview-restore', focusPreviewRestore);
  cancelCollapse();
  document.removeEventListener('fullscreenchange', syncFullScreen);
  document.removeEventListener('pointerdown', handleOutside);
});
</script>

<style lang="less" scoped>
.site-navigation-host, .site-navigation-panel {
  --navigation-bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom));
}
.site-navigation-host.with-bottom-bar, .site-navigation-panel.with-bottom-bar {
  --navigation-bottom: calc(var(--mobile-action-bottom) + env(safe-area-inset-bottom));
}

.site-navigation-host {
  position: fixed;
  bottom: var(--navigation-bottom);
  right: calc(var(--spacing-lg) + env(safe-area-inset-right));
  z-index: var(--z-header);
}

.site-navigation-host.embedded {
  position: sticky;
  top: calc(100dvh - var(--navigation-bottom));
  bottom: auto;
  right: auto;
  height: 0;
  max-width: var(--content-max);
  margin-inline: auto;

  .site-dock { position: absolute; right: 0; bottom: 0; }
}

.site-navigation-host.is-positioned { z-index: calc(var(--z-overlay) + 1); }

.navigation-drag-bounds {
  position: fixed;
  inset: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) var(--navigation-bottom) max(8px, env(safe-area-inset-left));
  visibility: hidden;
  pointer-events: none;
}

.site-dock {
  display: flex;
  align-items: center;
  width: max-content;
  // 入口栏选择换行布局时，拖拽锚点仍保持单个按钮的尺寸。
  height: calc(var(--site-control-size) + var(--spacing-xs) * 2 + 2px);
  max-width: calc(100vw - var(--spacing-xl));
  padding: var(--spacing-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: var(--elevated-bg-color);
  box-shadow: var(--shadow-md);
  &.expanded { gap: var(--spacing-xs); }
}

.navigation-handle { position: relative; flex-shrink: 0; }
.navigation-launcher { touch-action: none; user-select: none; -webkit-touch-callout: none; }
.navigation-launcher.bridge-ready { flex-direction: column; gap: 0; padding: var(--spacing-xs); }
.bridge-mini-status { color: var(--success-color); font-size: var(--font-size-xs); line-height: var(--leading-tight); pointer-events: none; }
.bridge-button.connected,
.bridge-button.connected:hover:not(:disabled) {
  color: var(--success-color);
}
.bridge-label {
  font-size: var(--font-size-xs);
}
.preview-restore {
  position: absolute;
  top: calc(-1 * var(--spacing-xs));
  right: calc(-1 * var(--spacing-xs));
  min-width: var(--spacing-lg);
  height: var(--spacing-lg);
  padding: 0 var(--spacing-xs);
  border: 1px solid var(--elevated-bg-color);
  border-radius: var(--radius-xl);
  background: var(--primary-color);
  color: var(--el-color-white);
  font: inherit;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;

  &:hover { background: var(--el-color-primary-dark-2); }
}
.navigation-launcher .el-icon { pointer-events: none; }
.is-positioned .navigation-launcher { cursor: grab; }
.is-dragging .navigation-launcher { cursor: grabbing; }
.site-dock.expand-right { flex-direction: row-reverse; }
.shortcut-surface() {
  position: absolute;
  width: max-content;
  padding: var(--spacing-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: var(--elevated-bg-color);
  box-shadow: var(--shadow-md);
}
.site-dock.stacked .dock-shortcuts { .shortcut-surface(); }

.dock-shortcuts, .site-nav { display: flex; align-items: center; gap: var(--spacing-xs); }
.dock-shortcuts { flex-shrink: 0; }

.dock-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--site-control-size);
  height: var(--site-control-size);
  padding: var(--spacing-sm);
  flex-shrink: 0;
  gap: var(--spacing-sm);
  border: 0;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--secondary-text-color);
  font: inherit;
  font-size: var(--font-size-base);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--transition-fast), background-color var(--transition-fast);

  &:hover:not(:disabled), &[aria-expanded="true"], &[aria-current="page"] {
    background: var(--hover-bg-color);
    color: var(--primary-color);
  }

  &:disabled { cursor: default; opacity: 0.5; }

  .el-icon { font-size: var(--font-size-xl); }
}

.nav-item, .search-box, .bridge-button { width: auto; min-width: var(--site-control-size); padding-inline: var(--spacing-md); }
.search-box { border-left: 1px solid var(--border-color); }

.dock-shortcuts-enter-active, .dock-shortcuts-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.dock-shortcuts-enter-from, .dock-shortcuts-leave-to { opacity: 0; transform: translateX(var(--spacing-sm)); }

@media (max-width: @bp-desktop) {
  .nav-item, .search-box, .bridge-button { width: var(--site-control-size); padding-inline: var(--spacing-sm); }
  .nav-item span, .search-box span, .search-box kbd, .bridge-button span { display: none; }
  .embedded .site-dock { right: calc(var(--site-control-size) + var(--spacing-md)); }
}

.site-navigation-host.with-bottom-bar {
  &.embedded {
    max-width: calc(100vw - var(--spacing-xl));
    margin-inline: 0;
  }
  .site-dock { right: 0; gap: 0; }
  .dock-shortcuts, .site-nav { gap: 0; }
}

@media (max-width: @bp-mobile) {
  .site-dock, .dock-shortcuts, .site-nav { gap: 0; }
  .dock-shortcuts { box-sizing: border-box; flex-wrap: wrap; max-width: calc(100vw - var(--spacing-xl)); }
  // 七个入口在按钮上方展开，窄屏换行保留完整触控尺寸。
  .site-dock:not(.is-positioned) .dock-shortcuts {
    .shortcut-surface();
    right: 0;
    bottom: calc(100% + var(--spacing-xs));
  }
}

kbd {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
}

.site-navigation-panel {
  color: var(--main-text-color);
  font-size: var(--font-size-base);
  max-height: calc(100dvh - var(--navigation-bottom) - var(--site-control-size) - var(--spacing-3xl) - env(safe-area-inset-top));
  overflow-y: auto;
  overscroll-behavior: contain;
}

.panel-title {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.panel-links {
  display: flex;
  gap: var(--spacing-xs);

  a {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    flex: 1;
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--secondary-text-color);

    &:hover, &[aria-current="page"] {
      color: var(--primary-color);
      background: var(--hover-bg-color);
    }
  }
}

.panel-actions {
  display: flex;
  flex-direction: column;
  margin-block: var(--spacing-sm);
  padding-block: var(--spacing-sm);
  border-block: 1px solid var(--border-color);

  button, .theme-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-height: var(--site-control-size);
    padding: var(--spacing-sm);
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
  }

  button {
    cursor: pointer;
    &:hover { background: var(--hover-bg-color); }
  }

  .theme-row { justify-content: space-between; }
  .assistant-entry kbd { margin-left: auto; }
}

.panel-message { color: var(--secondary-text-color); }
</style>
