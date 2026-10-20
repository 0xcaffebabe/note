<template>
  <a class="skip-link" href="#main-content">跳到正文</a>
  <el-container class="main-layout" :class="{ 'is-mobile': $isMobile() }">
    <el-main id="main-content" tabindex="-1">
      <router-view v-slot="{ Component }">
        <transition name="page">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
  <site-navigation @search="showSearch" @category-search="showCategorySearch" />
  <command-palette ref="commandPalette" />
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import SiteNavigation from "./components/navigation/SiteNavigation.vue";
import CommandPalette from "@/platform/web/components/search/CommandPalette.vue";
import EventBus from "./components/EventBus";

const cateListKey='system::currentCategoryList';
export default defineComponent({
  components: {
    SiteNavigation,
    CommandPalette,
  },
  setup() {
    const commandPalette = ref<InstanceType<typeof CommandPalette>>()
    // 统一搜索入口: 全文 / 目录 都走 CommandPalette(取代移动端 Search 抽屉 + CategorySearch 弹窗)
    const showSearch = (mode?: 'fulltext') => {
      commandPalette.value?.show(mode)
    }
    const showCategorySearch = () => {
      commandPalette.value?.show('category')
    }
    return {
      commandPalette, showSearch, showCategorySearch,
    }
  },
  created() {
    // 全局快捷键监听
    const actionList = [
      {
        hotkey: 'ctrl + q',
        action: () => (this.$refs.commandPalette as any).show('category')
      },
      {
        hotkey: 'ctrl + k',
        action: () => (this.$refs.commandPalette as any).show()
      },
      {
        hotkey: 'db + shift',
        action: () => (this.$refs.commandPalette as any).show('category')
      },
      {
        hotkey: 'db + s',
        action: () => (this.$refs.commandPalette as any).show()
      },
    ]
    const clickTimeMap = new Map<string, number>()
    document.addEventListener('keydown', (e) => {
      // 输入场景下禁用双击类快捷键 避免正常打字误触
      const target = e.target as HTMLElement
      const typing = target && (
        target.tagName == 'INPUT' ||
        target.tagName == 'TEXTAREA' ||
        target.isContentEditable
      )
      for(let action of actionList) {
        const mainKey = action.hotkey.split('+')[0].trim();
        const subKey = action.hotkey.split('+')[1].trim();
        let mainKeyPressed = false;
        if (mainKey == 'alt') {
          mainKeyPressed = e.altKey;
        }
        if (mainKey == 'ctrl') {
          // metaKey兼容macOS的Cmd组合键
          mainKeyPressed = e.ctrlKey || e.metaKey;
        }
        if (mainKey == 'shift') {
          mainKeyPressed = e.shiftKey;
        }
        // 双击按键处理
        if (mainKey == 'db' && !typing && e.key.toLowerCase() == subKey) {
          const diff = new Date().getTime() - (clickTimeMap.get(subKey)! || 0);
          if (diff <= 300) {
            action.action()
            return e.preventDefault()
          }
          clickTimeMap.set(subKey, new Date().getTime())
        }
        // 组合按键处理: 同时匹配e.key与e.code 兼容输入法激活时key被置为Process的情况
        const physicalKey = e.code.toLowerCase().replace('key', '')
        if (mainKeyPressed && [e.key.toLowerCase(), physicalKey].includes(subKey.toLowerCase())) {
          action.action()
          return e.preventDefault();
        }
      }
    })
    // 恢复目录列表
    const raw = localStorage.getItem(cateListKey);
    if (raw){
      this.$store.commit('setCurrentCategoryList', JSON.parse(raw));
    }
    // 事件总线监听
    // 文档页底部操作栏的搜索入口(移动端从 MobileApp 迁入: 统一走 CommandPalette)
    EventBus.on('show-mobile-search', () => {
      (this.$refs.commandPalette as any)?.show()
    })
  },
});
</script>

<style lang="less" scoped>
.main-layout {
  min-height: 100vh;
  padding-bottom: var(--site-dock-clearance);
}

.el-main {
  padding: 0;
  transition: all 0.3s ease;
  // 为页面过渡的离场页(绝对定位)提供定位上下文
  position: relative;
}

// 统一页面切换过渡: 桌面/移动同一动效语言(纯淡入淡出)
// 不用 mode=out-in: 它会与懒加载的异步路由组件死锁, 导致首次跨路由跳转渲染空白(router-view 只剩注释节点)。
// 改为同时进出的交叉淡入; 离场页绝对定位脱离文档流, 入场页就位, 避免两页堆叠抖动。
.page-enter-active,
.page-leave-active {
  transition: opacity var(--transition-page);
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.page-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

</style>
