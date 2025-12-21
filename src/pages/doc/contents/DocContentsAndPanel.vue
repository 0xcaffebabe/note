<template>
  <div class="doc-contents-and-panel">
    <!-- 目录区域 -->
    <div 
      class="toc-wrapper" 
      :style="{
        'top': parentShowHeader ? '66px': '6px', 
        'height': parentShowHeader ? 'calc(80 % - 60px)': '80%', 
        'display': showContentsList ? 'block' : 'none'
      }"
    >
      <contents-list :doc="doc" @item-click="handleTocItemClick" />
    </div>

    <!-- 右下角整合面板（思维笔记和知识网络） -->
    <div class="right-bottom-panel-container" v-if="showContentsList">
      <right-bottom-panel :doc="doc" />
    </div>

    <!-- 目录切换按钮 -->
    <div class="toc-toggle-btn" @click="toggleContentsList">
      <el-icon v-if="showContentsList"><FolderOpened /></el-icon>
      <el-icon v-else><Folder /></el-icon>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ContentsList from "./ContentsList.vue";
import RightBottomPanel from "../knowledge/RightBottomPanel.vue";
import { Folder, FolderOpened } from '@element-plus/icons-vue';

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
      showContentsList: window.innerWidth > 1180, // 根据屏幕宽度初始化显示状态
    };
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
    handleResize() {
      // 当窗口大小改变时，根据宽度决定是否显示ContentsList
      if (window.innerWidth <= 1180) {
        this.showContentsList = false; // 小屏幕默认隐藏
      } else {
        this.showContentsList = true; // 大屏幕默认显示
      }
    }
  },
  mounted() {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    // 移除窗口大小监听器
    window.removeEventListener('resize', this.handleResize);
  }
});
</script>

<style lang="less" scoped>
.toc-wrapper {
  transition: all 0.2s;
  position: fixed;
  right: 16px;
}

.toc-toggle-btn {
  display: none; /* 默认隐藏按钮 */
  position: fixed;
  right: 20px;
  top: 400px;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background-color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 999;
  transition: all 0.3s ease;
  color: white;
  font-size: 18px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.right-bottom-panel-container {
  position: fixed;
  bottom: 0px;
  right: 0px;
  width: 400px;
  height: 200px;
  z-index: 999;

  :deep(.right-bottom-panel) {
    width: 100%;
    height: 100%;
  }

  :deep(#knowledgeNetwork) {
    height: 100%;
    width: 100%;
  }

  :deep(.mind-note) {
    height: 100%;
    width: 100%;
    position: static;
    border: none;
    box-shadow: none;
    border-radius: 0;
  }
}

@media screen and(max-width: 1366px) {
  .right-bottom-panel-container {
    width: 300px;
    height: 160px;
  }
}

@media screen and (max-width: 1370px) {
  .toc-wrapper {
    right: 2px;
  }
}

@media screen and (max-width: 1180px) {
  .toc-wrapper {
    display: none;
  }
  .toc-toggle-btn {
    display: flex; /* 在小屏幕上显示按钮 */
  }
}

body[theme=dark] .toc-toggle-btn {
  background-color: var(--dark-primary-color);
}
</style>