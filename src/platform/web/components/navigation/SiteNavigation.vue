<template>
  <nav class="site-dock" aria-label="站内导航">
    <el-popover v-model:visible="menuOpen" trigger="click" role="dialog" aria-label="站点导航与工具" placement="bottom-end" :width="280" popper-class="site-navigation-popover" @after-enter="focusMenu">
      <template #reference>
        <button ref="menuButton" type="button" class="more-btn dock-action" title="站点导航与工具" aria-label="站点导航与工具" @keydown.esc.stop.prevent="closeMenu">
          <el-icon><Menu /></el-icon>
        </button>
      </template>
      <section id="site-navigation-panel" ref="panel" class="site-navigation-panel" aria-label="站点导航与工具" @keydown.esc.stop.prevent="closeMenu">
        <p class="panel-title">{{ siteName }}</p>
        <nav class="panel-nav" aria-label="页面导航">
          <router-link v-for="item in navList" :key="item.path" :to="item.path" :aria-current="$route.path.startsWith(item.match) ? 'page' : undefined" @click="menuOpen = false">
            <el-icon><component :is="item.icon" /></el-icon>{{ item.name }}
          </router-link>
        </nav>
        <div class="panel-actions">
          <button type="button" @click="search(false)"><el-icon><Search /></el-icon>全文搜索<kbd>{{ metaKeyLabel }} K</kbd></button>
          <button type="button" @click="search(true)"><el-icon><Folder /></el-icon>目录搜索<kbd>{{ metaKeyLabel }} Q</kbd></button>
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
  </nav>
</template>

<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Aim, CollectionTag, Folder, FullScreen, HomeFilled, Menu, Search, Share, TopRight } from '@element-plus/icons-vue';
import config from '@/core/config/config';
import { isMac } from '@/adapters/browser/Platform';
import { exitFullScreen, isFullScreen, requestFullScreen } from '@/adapters/browser/WindowAdapter';
import EventBus from '@/platform/web/components/EventBus';
import ThemeSwitcher from '../header/ThemeSwitcher.vue';

const emit = defineEmits<{
  search: [mode?: 'fulltext'];
  'category-search': [];
}>();
const route = useRoute();
const menuOpen = ref(false);
const fullscreen = ref(false);
const message = ref('');
const menuButton = ref<HTMLButtonElement>();
const panel = ref<HTMLElement>();
const siteName = config.siteName;
const linkList = config.linkList;
const metaKeyLabel = isMac() ? '⌘' : 'Ctrl';
const navList = [
  { name: '首页', path: '/home.html', match: '/home', icon: markRaw(HomeFilled) },
  { name: '标签', path: '/tag.html', match: '/tag', icon: markRaw(CollectionTag) },
  { name: '聚类', path: '/cluster.html', match: '/cluster', icon: markRaw(Share) },
];

function search(category: boolean) {
  menuOpen.value = false;
  if (category) emit('category-search');
  else emit('search', 'fulltext');
}

function focusMenu() {
  if (menuOpen.value) panel.value?.querySelector<HTMLAnchorElement>('a')?.focus();
}

function closeMenu() {
  menuOpen.value = false;
  menuButton.value?.focus();
}

async function toggleFullScreen() {
  message.value = '';
  try {
    if (isFullScreen()) await exitFullScreen();
    else await requestFullScreen();
    menuOpen.value = false;
  } catch {
    message.value = '当前浏览器无法切换全屏';
  }
}

async function enterZenMode() {
  menuOpen.value = false;
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

watch(() => route.fullPath, () => {
  menuOpen.value = false;
});
onMounted(() => {
  syncFullScreen();
  document.addEventListener('fullscreenchange', syncFullScreen);
});
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullScreen));
</script>

<style lang="less" scoped>
.site-dock {
  position: fixed;
  top: calc(var(--spacing-md) + env(safe-area-inset-top));
  right: calc(var(--spacing-md) + env(safe-area-inset-right));
  z-index: var(--z-header);
}

.dock-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--site-control-size);
  height: var(--site-control-size);
  padding: var(--spacing-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: var(--elevated-bg-color);
  box-shadow: var(--shadow-sm);
  color: var(--secondary-text-color);
  font: inherit;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: color var(--transition-fast), background-color var(--transition-fast);

  &:hover, &[aria-expanded="true"] {
    background: var(--hover-bg-color);
    color: var(--primary-color);
  }

  .el-icon { font-size: var(--font-size-xl); }
}

kbd {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
}

.site-navigation-panel {
  color: var(--main-text-color);
  font-size: var(--font-size-base);
  max-height: calc(100dvh - var(--site-control-size) - var(--spacing-3xl) - env(safe-area-inset-top) - env(safe-area-inset-bottom));
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
