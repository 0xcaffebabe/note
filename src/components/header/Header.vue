<template>
  <header class="site-header" :class="{ compact: $isMobile() }">
    <div class="header-inner">
      <div class="header-left">
        <a href="/home.html" class="site-logo" @click.prevent="$router.push('/home.html')">
          {{ siteName }}
        </a>
        <!-- 宽屏: 顶栏内联导航 -->
        <nav v-if="!$isMobile()" class="site-nav" aria-label="站内导航">
          <a
            v-for="nav in navList"
            :key="nav.path"
            :href="nav.path"
            class="nav-item"
            :class="{active: isActive(nav.match)}"
            @click.prevent="$router.push(nav.path)"
          >{{ nav.name }}</a>
        </nav>
      </div>
      <div class="header-right">
        <!-- 宽屏: 伪输入框 + 快捷键提示 -->
        <button v-if="!$isMobile()" type="button" class="search-box" @click="$emit('search')" aria-label="搜索 (Ctrl+K)">
          <el-icon><Search /></el-icon>
          <span class="search-text">搜索</span>
          <span class="search-kbd"><kbd>{{ metaKeyLabel }}</kbd><kbd>K</kbd></span>
        </button>
        <!-- 窄屏: 图标入口(全文搜索 / 目录搜索 / 展开目录) -->
        <template v-else>
          <button type="button" class="icon-btn" @click="$emit('search')" aria-label="全文搜索">
            <el-icon><Search /></el-icon>
          </button>
          <button type="button" class="icon-btn" @click="$emit('category-search')" aria-label="目录搜索">
            <el-icon><Folder /></el-icon>
          </button>
          <button type="button" class="icon-btn" @click="$store.commit('setShowCategory', true)" aria-label="展开目录">
            <el-icon><Expand /></el-icon>
          </button>
        </template>
        <theme-switcher class="action-item" />
        <el-dropdown trigger="click">
          <button type="button" class="more-btn" aria-label="更多工具">
            <el-icon><MoreFilled /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <!-- 窄屏: 导航并入菜单(宽屏已在顶栏内联) -->
              <template v-if="$isMobile()">
                <el-dropdown-item
                  v-for="nav in navList"
                  :key="'nav-' + nav.path"
                  @click="$router.push(nav.path)"
                >
                  <el-icon><Document /></el-icon>{{ nav.name }}
                </el-dropdown-item>
              </template>
              <el-dropdown-item :divided="$isMobile()" @click="handleToggleFullScreen">
                <el-icon><Monitor /></el-icon>全屏
              </el-dropdown-item>
              <el-dropdown-item @click="refresh">
                <el-icon><Refresh /></el-icon>刷新
              </el-dropdown-item>
              <el-dropdown-item @click="enterZenMode">
                <el-icon><Aim /></el-icon>专注模式
              </el-dropdown-item>
              <el-dropdown-item @click="confirmClearCache">
                <el-icon><Brush /></el-icon>清空缓存
              </el-dropdown-item>
              <el-dropdown-item
                v-for="(link, index) in linkList"
                :key="link.url"
                :divided="index == 0"
                @click="openLink(link.url)"
              >
                <el-icon><Link /></el-icon>{{ link.title }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Monitor, Brush, Aim, Refresh, Search, MoreFilled, Link, Folder, Expand, Document } from '@element-plus/icons-vue';
import EventBus from "@/components/EventBus";
import ThemeSwitcher from "./ThemeSwitcher.vue";
</script>

<script lang="ts">
import { defineComponent } from "vue";
import config from "@/config";
import CacheService from "@/service/CacheService";
import { ElMessage, ElMessageBox } from 'element-plus';

export default defineComponent({
  // 窄屏搜索/目录搜索图标复用同一契约: search=全文, category-search=目录
  emits: ['search', 'category-search'],
  data() {
    return {
      fullscreen: false,
      navList: [
        { name: '首页', path: '/home.html', match: '/home' },
        { name: '标签', path: '/tag.html', match: '/tag' },
        { name: '聚类', path: '/cluster.html', match: '/cluster' },
      ],
    };
  },
  methods: {
    isActive(prefix: string): boolean {
      return this.$route.path.startsWith(prefix);
    },
    confirmClearCache() {
      ElMessageBox.confirm('确认清空本地缓存?', '清空缓存', {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        CacheService.getInstance().clear();
        ElMessage.success('清除缓存完成');
      }).catch(() => { /* 取消 */ });
    },
    handleToggleFullScreen() {
      this.fullscreen = !document.fullscreenElement;
      if (this.fullscreen) {
        document.body.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    },
    enterZenMode() {
      EventBus.emit('enter-zen-mode', null)
    },
    refresh() {
      location.reload()
    },
    openLink(url: string) {
      window.open(url, '_blank', 'noopener')
    },
  },
  computed: {
    siteName() {
      return config.siteName;
    },
    linkList() {
      return config.linkList;
    },
    metaKeyLabel(): string {
      return /mac/i.test(navigator.userAgent) ? '⌘' : 'Ctrl';
    },
  },
  created() {
    EventBus.on('enter-zen-mode', () => {
      document.body.requestFullscreen();
    })
  },
});
</script>

<style lang="less" scoped>
.site-header {
  height: 60px;
  background-color: var(--card-bg-color);
  border-bottom: 1px solid var(--border-color);
  transition: background-color var(--transition-normal), border-color var(--transition-normal);

  // 窄屏紧凑顶栏
  &.compact {
    height: 48px;

    .header-inner {
      padding: 0 var(--spacing-md);
      gap: var(--spacing-sm);
    }
  }
}

.header-inner {
  height: 100%;
  padding: 0 var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

// 大屏宽档: 顶栏内容限宽居中(对齐文档壳 --doc-shell-max), 免 2560 下 logo 与搜索/操作相距过远
@media (min-width: @bp-wide) {
  .header-inner {
    max-width: var(--doc-shell-max);
    margin-inline: auto;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  min-width: 0;
}

.site-logo {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--main-text-color);
  text-decoration: none;
  white-space: nowrap;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  transition: color var(--transition-fast), background-color var(--transition-fast);

  &:hover {
    color: var(--primary-color);
    background-color: var(--hover-bg-color);
  }
}

.site-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.nav-item {
  padding: 6px 12px;
  font-size: var(--font-size-base);
  color: var(--secondary-text-color);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: color var(--transition-fast), background-color var(--transition-fast);

  &:hover {
    color: var(--main-text-color);
    background-color: var(--hover-bg-color);
  }

  &.active {
    color: var(--primary-color);
    font-weight: 500;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

// 窄屏图标按钮: 触控目标 >= 40x40
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  border: none;
  background: transparent;
  color: var(--secondary-text-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: color var(--transition-fast), background-color var(--transition-fast);

  &:hover,
  &:active {
    color: var(--main-text-color);
    background-color: var(--hover-bg-color);
  }

  .el-icon {
    font-size: 18px;
  }
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  height: 36px;
  padding: 0 var(--spacing-sm) 0 var(--spacing-md);
  min-width: 180px;
  background-color: var(--main-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--secondary-text-color);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:hover,
  &:focus-visible {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 15%, transparent);
  }

  .search-text {
    flex: 1;
    text-align: left;
  }

  .search-kbd {
    display: flex;
    gap: 2px;

    kbd {
      padding: 1px 5px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--secondary-text-color);
      border: 1px solid var(--border-color);
      border-bottom-width: 2px;
      border-radius: var(--radius-sm);
      background-color: var(--card-bg-color);
    }
  }
}

.more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--secondary-text-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: color var(--transition-fast), background-color var(--transition-fast);

  &:hover {
    color: var(--main-text-color);
    background-color: var(--hover-bg-color);
  }
}
</style>
