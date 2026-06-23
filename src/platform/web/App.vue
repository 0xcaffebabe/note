<template>
  <a class="skip-link" href="#main-content">跳到正文</a>
  <el-container class="main-layout" :class="{ 'is-mobile': $isMobile() }">
    <el-header v-show="showHeader">
      <el-affix :offset="0">
        <Header @search="showSearch" @category-search="showCategorySearch" />
      </el-affix>
    </el-header>
    <!-- 收起顶栏按钮: 仅宽屏(窄屏顶栏常驻, 由禅模式统一收起) -->
    <div v-if="!$isMobile()" class="header-toggle-button" :style="{'margin-top': showHeader ? '60px' : '10px'}">
      <el-button
        @click="showHeader = !showHeader"
        size="small"
        type="default"
        :icon="showHeader ? ArrowUpBold : ArrowDownBold"
        circle
        :title="showHeader ? '隐藏顶部栏' : '显示顶部栏'"
      />
    </div>
    <el-main id="main-content" tabindex="-1">
      <router-view v-slot="{ Component }">
        <transition name="page">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
  <command-palette ref="commandPalette" />
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import Header from "./components/header/Header.vue";
import CommandPalette from "@/platform/web/components/search/CommandPalette.vue";
import { ArrowUpBold, ArrowDownBold } from "@element-plus/icons-vue";
import EventBus from "./components/EventBus";
import ConfigService from "./service/ConfigService";

const cateListKey='system::currentCategoryList';
export default defineComponent({
  components: {
    Header,
    CommandPalette,
    ArrowUpBold,
    ArrowDownBold,
  },
  setup() {
    const commandPalette = ref<InstanceType<typeof CommandPalette>>()
    // 统一搜索入口: 全文 / 目录 都走 CommandPalette(取代移动端 Search 抽屉 + CategorySearch 弹窗)
    const showSearch = () => {
      commandPalette.value?.show()
    }
    const showCategorySearch = () => {
      commandPalette.value?.show('category')
    }
    return {
      commandPalette, showSearch, showCategorySearch,
      ArrowUpBold,
      ArrowDownBold
    }
  },
  watch : {
    showHeader(val: boolean) {
      ConfigService.set('showHeader', val)
    }
  },
  provide(){
    return {
      showHeader: computed(() => this.showHeader)
    }
  },
  data() {
    return {
      // 顶栏默认常驻显示(承载全局导航与搜索入口) 禅模式或用户手动收起后保持偏好
      showHeader: true,
      lastClickTime: 0,
    };
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
    EventBus.on('enter-zen-mode', () => {
      this.showHeader = false
    })
    // 文档页底部操作栏的搜索入口(移动端从 MobileApp 迁入: 统一走 CommandPalette)
    EventBus.on('show-mobile-search', () => {
      (this.$refs.commandPalette as any)?.show()
    })
    // 设置showHeader初始值
    const showHeader = ConfigService.get('showHeader') as boolean
    if (typeof showHeader != 'undefined') {
      this.showHeader = showHeader
    }
  },
});
</script>

<style lang="less" scoped>
.main-layout {
  min-height: 100vh;
  transition: all 0.3s ease;
}

.el-main {
  padding: 0;
  transition: all 0.3s ease;
  // 为页面过渡的离场页(绝对定位)提供定位上下文
  position: relative;
}

.header-toggle-button {
  position: fixed;
  right: 16px;
  z-index: 1000;
  transition: all 0.3s ease;

  .el-button {
    padding: 8px;
    width: 32px;
    height: 32px;
    border: none;
    box-shadow: var(--shadow-md);
    background-color: var(--card-bg-color);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }
  }
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

// 暗色专属: 暗色下阴影对比弱, 需补充边框勾勒按钮轮廓; 亮色侧为 border: none, 无法用同一令牌表达
body[theme=dark] {
  .header-toggle-button {
    .el-button {
      border: 1px solid var(--border-color);
    }
  }
}
</style>
