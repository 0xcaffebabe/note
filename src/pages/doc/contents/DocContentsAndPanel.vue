<template>
  <div class="doc-contents-and-panel" :class="{collapsed: !showContentsList}">
    <!-- 目录区域和右下方面板的容器 -->
    <div
      class="contents-panel-container"
      :style="{
        'top': parentShowHeader ? '60px': '0',
        'height': parentShowHeader ? 'calc(100vh - 60px)': '100vh',
        'display': showContentsList ? 'flex' : 'none',
        'flex-direction': 'column'
      }"
    >
      <!-- 右下角整合面板（思维笔记和知识网络） -->
      <div class="right-bottom-panel-container">
        <right-bottom-panel :doc="doc" />
      </div>

      <!-- 目录区域 -->
      <div class="toc-wrapper-flex">
        <contents-list :doc="doc" @item-click="handleTocItemClick" />
      </div>
    </div>

    <!-- 目录切换按钮 -->
    <button
      type="button"
      class="toc-toggle-btn"
      @click="toggleContentsList"
      aria-label="切换文档目录面板"
      :aria-expanded="showContentsList"
    >
      <el-icon v-if="showContentsList"><FolderOpened /></el-icon>
      <el-icon v-else><Folder /></el-icon>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ContentsList from "./ContentsList.vue";
import RightBottomPanel from "../knowledge/RightBottomPanel.vue";
import { Folder, FolderOpened } from '@element-plus/icons-vue';
import { isFull } from "@/composables/useBreakpoint";

export default defineComponent({
  name: "DocContentsAndPanel",
  components: {
    ContentsList,
    RightBottomPanel,
    Folder,
    FolderOpened
  },
  props: {
    doc: {
      type: String,
      required: true
    },
    parentShowHeader: {
      type: Boolean,
      default: true
    }
  },
  emits: ["item-click", "toggle-contents"],
  data() {
    return {
      // 默认显示状态跟随响应式断点(full≥1280 显示, 否则收起为浮层)
      // 单一真源 isFull: 与 CSS 的 @bp-desktop 同值, 消除旧 JS(1180)/CSS(1280) 不一致死区
      showContentsList: isFull.value,
    };
  },
  watch: {
    // 断点跨越时同步默认显隐(同一档位内的用户手动 toggle 不被覆盖)
    isFull(val: boolean) {
      this.showContentsList = val;
    },
  },
  computed: {
    isFull() {
      return isFull.value;
    },
  },
  methods: {
    handleTocItemClick(id: string) {
      this.$emit("item-click", id);
    },
    toggleContentsList() {
      this.showContentsList = !this.showContentsList;
      this.$emit("toggle-contents", this.showContentsList);
    },
    // 提供一个外部方法来控制显示/隐藏
    setShowContentsList(show: boolean) {
      this.showContentsList = show;
    },
  }
});
</script>

<style lang="less" scoped>
// TOC列: 占据文档流宽度 内部容器粘性定位 不再fixed悬浮在正文之上
.doc-contents-and-panel {
  width: 300px;
  flex-shrink: 0;
  // 与正文区同色 避免列内留白处露出页面底色形成灰带
  background-color: var(--card-bg-color);

  &.collapsed {
    width: 0;
  }
}

.contents-panel-container {
  transition: all 0.2s;
  position: sticky;
  width: 290px;
  overflow: hidden; /* 防止内容溢出 */
  display: flex;
  flex-direction: column;
}

.toc-wrapper-flex {
  flex: 1; /* 占据可用的剩余空间 */
  // 滚动统一交给内部ContentsList的.toc容器(滚动联动逻辑以它为基准) 避免双滚动条
  overflow: hidden;
  min-height: 0; /* 允许flex子元素收缩到内容以下 */
}

.toc-toggle-btn {
  display: none; /* 默认隐藏按钮 仅小屏显示 */
  position: fixed;
  right: 20px;
  bottom: 96px;
  width: 40px;
  height: 40px;
  border: none;
  background-color: var(--primary-color);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: var(--z-float);
  transition: all 0.3s ease;
  color: white;
  font-size: 18px;
  box-shadow: var(--shadow-md);
}

.right-bottom-panel-container {
  flex: 0 0 auto; /* 固定高度，不伸缩 */
  height: 250px; /* 固定高度 */
  z-index: var(--z-float);
  overflow: hidden; /* 防止内容溢出 */

  :deep(.right-bottom-panel) {
    width: 100%;
    height: 100%;
  }

  :deep(#knowledgeNetwork) {
    height: 100%;
    width: 100%;
  }
}

/* 为小屏幕调整: 断点统一为1280 */
@media screen and (max-width: 1366px) {
  .right-bottom-panel-container {
    height: 160px;
  }
}

// 列收起断点与 JS 的 isFull(DESKTOP_MIN=1280) 同源, 消除旧 1180/1280 死区
@media screen and (max-width: @bp-desktop) {
  .doc-contents-and-panel {
    width: 0;
  }
  .contents-panel-container {
    /* 小屏时面板以浮层形式展开(由切换按钮控制) */
    position: fixed;
    right: 8px;
    width: 290px;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
  }
  .toc-toggle-btn {
    display: flex; /* 在小屏幕上显示按钮 */
  }
}
</style>