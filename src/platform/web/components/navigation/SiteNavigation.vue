<template>
  <div class="site-navigation-host" :class="{ embedded, 'with-bottom-bar': withBottomBar }">
  <nav ref="dock" class="site-dock" :class="{ expanded }" aria-label="站内导航" @pointerenter="handlePointerEnter" @pointerleave="scheduleCollapse" @focusin="cancelCollapse" @focusout="scheduleCollapse" @keydown.esc.stop.prevent="closeMenu">
    <transition name="dock-shortcuts">
    <div v-show="expanded" id="site-navigation-shortcuts" class="dock-shortcuts">
      <div class="site-nav">
        <router-link v-for="item in navList" :key="item.path" :to="item.path" class="nav-item dock-action" :aria-label="item.name" :title="item.name" :aria-current="$route.path.startsWith(item.match) ? 'page' : undefined" @click="collapse">
          <el-icon><component :is="item.icon" /></el-icon><span>{{ item.name }}</span>
        </router-link>
      </div>
      <button type="button" class="search-box dock-action" aria-label="搜索 (Ctrl+K)" @click="search()">
        <el-icon><Search /></el-icon><span>搜索</span><kbd>{{ metaKeyLabel }} K</kbd>
      </button>
    <el-popover v-model:visible="menuOpen" trigger="click" role="dialog" aria-label="站点导航与工具" placement="top-end" :width="280" popper-class="site-navigation-popover" @after-enter="focusMenu" @after-leave="restoreLauncherFocus">
      <template #reference>
        <button type="button" class="more-btn dock-action" title="更多工具" aria-label="站点导航与工具">
          <el-icon><MoreFilled /></el-icon>
        </button>
      </template>
      <section id="site-navigation-panel" ref="panel" class="site-navigation-panel" :class="{ 'with-bottom-bar': withBottomBar }" aria-label="站点导航与工具" @keydown.esc.stop.prevent="closeMenu">
        <p class="panel-title">{{ siteName }}</p>
        <nav class="panel-nav" aria-label="页面导航">
          <router-link v-for="item in navList" :key="item.path" :to="item.path" :aria-current="$route.path.startsWith(item.match) ? 'page' : undefined" @click="collapse">
            <el-icon><component :is="item.icon" /></el-icon>{{ item.name }}
          </router-link>
        </nav>
        <div class="panel-actions">
          <button type="button" @click="search('fulltext')"><el-icon><Search /></el-icon>全文搜索<kbd>{{ metaKeyLabel }} K</kbd></button>
          <button type="button" @click="search('category')"><el-icon><Folder /></el-icon>目录搜索<kbd>{{ metaKeyLabel }} Q</kbd></button>
          <div class="theme-row"><span>深色模式</span><theme-switcher class="action-item" aria-label="深色模式" /></div>
          <button type="button" @click="toggleFullScreen"><el-icon><FullScreen /></el-icon>{{ fullscreen ? '退出全屏' : '全屏' }}</button>
          <button type="button" @click="enterZenMode"><el-icon><Aim /></el-icon>专注模式</button>
        </div>
        <div class="panel-links">
          <a v-for="link in linkList" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.title }}<el-icon><TopRight /></el-icon></a>
        </div>
        <p v-if="message" class="panel-message" role="status">{{ message }}</p>
      </section>
    </el-popover>
    </div>
    </transition>
    <button ref="launcher" type="button" class="navigation-launcher dock-action" :title="expanded ? '收起站点导航' : '展开站点导航'" :aria-label="expanded ? '收起站点导航' : '展开站点导航'" :aria-expanded="expanded" aria-controls="site-navigation-shortcuts" @click="toggleNavigation">
      <el-icon><ArrowRightBold v-if="expanded" /><Menu v-else /></el-icon>
    </button>
  </nav>
  </div>
</template>

<script setup lang="ts">
import { markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Aim, ArrowRightBold, CollectionTag, Folder, FullScreen, HomeFilled, Menu, MoreFilled, Search, Share, TopRight } from '@element-plus/icons-vue';
import config from '@/core/config/config';
import { isMac } from '@/adapters/browser/Platform';
import { exitFullScreen, isFullScreen, requestFullScreen } from '@/adapters/browser/WindowAdapter';
import EventBus from '@/platform/web/components/EventBus';
import ThemeSwitcher from '../header/ThemeSwitcher.vue';

defineProps<{ embedded?: boolean; withBottomBar?: boolean }>();
const route = useRoute();
const expanded = ref(false);
const menuOpen = ref(false);
const fullscreen = ref(false);
const message = ref('');
const dock = ref<HTMLElement>();
const launcher = ref<HTMLButtonElement>();
const panel = ref<HTMLElement>();
let collapseTimer: ReturnType<typeof setTimeout> | undefined;
let returnFocusAfterMenu = false;
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
  if (event.pointerType === 'mouse') expanded.value = true;
}

function scheduleCollapse() {
  cancelCollapse();
  if (!expanded.value) return;
  collapseTimer = setTimeout(() => {
    if (!menuOpen.value && !dock.value?.contains(document.activeElement) && !dock.value?.matches(':hover')) collapse();
  }, 180);
}

async function toggleNavigation(event: MouseEvent) {
  if (expanded.value) {
    collapse();
  } else {
    expanded.value = true;
    if (event.detail === 0) {
      await nextTick();
      dock.value?.querySelector<HTMLAnchorElement>('.site-nav a')?.focus();
    }
  }
}

function handleOutside(event: PointerEvent) {
  const target = event.target as Node;
  if (!dock.value?.contains(target) && !panel.value?.contains(target)) collapse();
}

function focusMenu() {
  if (menuOpen.value) panel.value?.querySelector<HTMLAnchorElement>('a')?.focus();
}

async function closeMenu() {
  const hadMenu = menuOpen.value;
  collapse();
  returnFocusAfterMenu = hadMenu;
  await nextTick();
  launcher.value?.focus({ preventScroll: true });
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

watch(() => route.fullPath, collapse);
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
  syncFullScreen();
  document.addEventListener('fullscreenchange', syncFullScreen);
  document.addEventListener('pointerdown', handleOutside);
});
onBeforeUnmount(() => {
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

.site-dock {
  display: flex;
  align-items: center;
  width: max-content;
  max-width: calc(100vw - var(--spacing-xl));
  padding: var(--spacing-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: var(--elevated-bg-color);
  box-shadow: var(--shadow-md);
  &.expanded { gap: var(--spacing-xs); }
}

.dock-shortcuts, .site-nav { display: flex; align-items: center; gap: var(--spacing-xs); }

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

  &:hover, &[aria-expanded="true"], &[aria-current="page"] {
    background: var(--hover-bg-color);
    color: var(--primary-color);
  }

  .el-icon { font-size: var(--font-size-xl); }
}

.nav-item, .search-box { width: auto; min-width: var(--site-control-size); padding-inline: var(--spacing-md); }
.search-box { border-left: 1px solid var(--border-color); }

.dock-shortcuts-enter-active, .dock-shortcuts-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.dock-shortcuts-enter-from, .dock-shortcuts-leave-to { opacity: 0; transform: translateX(var(--spacing-sm)); }

@media (max-width: @bp-desktop) {
  .nav-item, .search-box { width: var(--site-control-size); padding-inline: var(--spacing-sm); }
  .nav-item span, .search-box span, .search-box kbd { display: none; }
  .embedded .site-dock { right: calc(var(--site-control-size) + var(--spacing-md)); }
}

.site-navigation-host.with-bottom-bar {
  .site-dock { right: 0; gap: 0; }
  .dock-shortcuts, .site-nav { gap: 0; }
}

@media (max-width: @bp-mobile) {
  .site-dock, .dock-shortcuts, .site-nav { gap: 0; }
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

.panel-nav, .panel-links {
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
    kbd { margin-left: auto; }
  }

  .theme-row { justify-content: space-between; }
}

.panel-message { color: var(--secondary-text-color); }
</style>
