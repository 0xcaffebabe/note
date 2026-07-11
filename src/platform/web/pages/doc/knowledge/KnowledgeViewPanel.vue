<template>
  <div class="knowledge-view-panel">
    <!-- 内容区：占据全部空间 -->
    <div class="panel-content">
      <transition name="fade" mode="out-in">
        <div v-if="activeView === 'graph'" key="graph" class="view-container">
          <knowledge-network-chart
            :doc="doc"
            mode="force"
            :onlySelfRelated="true"
            :isPotential="false"
            :showLegend="false"
            :resizeListener="false"
            :showTooltip="false"
            :showChartText="false"
            :zoom="currentZoom"
            :degree="degree"
          />
        </div>
        <div v-else key="mind" class="view-container">
          <mind id="panelMind" :mind-data="mindData" :toolbar="false" />
        </div>
      </transition>
    </div>

    <!-- 右下角浮动按钮组 -->
    <div class="floating-controls">
      <!-- 视图切换按钮组 -->
      <el-button-group class="view-switch">
        <el-button
          :type="activeView === 'graph' ? 'primary' : ''"
          size="small"
          @click="activeView = 'graph'"
          title="知识关系图"
        >
          <el-icon><Share /></el-icon>
        </el-button>
        <el-button
          :type="activeView === 'mind' ? 'primary' : ''"
          size="small"
          @click="activeView = 'mind'"
          title="思维导图"
        >
          <el-icon><DocumentCopy /></el-icon>
        </el-button>
      </el-button-group>

      <!-- 放大按钮 -->
      <el-button class="expand-btn" size="small" circle @click="openExpanded" title="全屏展开">
        <el-icon><FullScreen /></el-icon>
      </el-button>
    </div>

    <!-- 全屏展示对话框 -->
    <el-dialog
      v-model="isExpanded"
      title="知识图谱"
      width="90%"
      class="expand-dialog"
      align-center
      append-to-body
      destroy-on-close>
      <template #header>
        <el-segmented v-model="dialogTab" :options="dialogTabOptions" />
      </template>
      <div class="expand-content">
        <!-- 展开后使用完整知识网络(含工具栏: 度数/布局/显隐式/仅看相关) -->
        <knowledge-network-content
          v-if="dialogTab === 'graph'"
          :doc="doc"
        />
        <mind v-else id="expandedMind" :mind-data="mindData" />
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElButton, ElButtonGroup, ElIcon, ElDialog, ElSegmented } from 'element-plus';
import { FullScreen, Share, DocumentCopy } from '@element-plus/icons-vue';
import Mind from "@/platform/web/components/mind/Mind.vue";
import KnowledgeNetworkChart from "./KnowledgeNetworkChart.vue";
import KnowledgeNetworkContent from "./KnowledgeNetworkContent.vue";
import MindNode from "@/core/domain/mind/MindNode";

const EMPTY_NODE = { id: '', topic: '', children: [], expanded: false, direction: 'left' } as MindNode;

export default defineComponent({
  name: "KnowledgeViewPanel",
  components: {
    Mind,
    KnowledgeNetworkChart,
    KnowledgeNetworkContent,
    ElButton,
    ElButtonGroup,
    ElIcon,
    ElDialog,
    ElSegmented,
    FullScreen,
    Share,
    DocumentCopy
  },
  props: {
    doc: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      degree: 1,
      currentZoom: 0.6,
      activeView: 'graph' as 'graph' | 'mind',
      isExpanded: false,
      dialogTab: 'graph' as 'graph' | 'mind',
      dialogTabOptions: [
        { label: '知识关系图', value: 'graph' },
        { label: '思维导图', value: 'mind' }
      ],
      mindData: EMPTY_NODE as MindNode
    };
  },
  watch: {
    doc(val: string) {
      this.loadMindData(val);
    }
  },
  async mounted() {
    this.loadMindData(this.doc);
  },
  methods: {
    async loadMindData(doc: string) {
      this.mindData = await this.$services.docService.generateMindData(doc);
    },
    openExpanded() {
      this.dialogTab = this.activeView;
      this.isExpanded = true;
    }
  }
});
</script>

<style lang="less" scoped>
.knowledge-view-panel {
  position: relative;
  height: 100%;
  width: 100%;
  background-color: color-mix(in srgb, var(--card-bg-color) 80%, transparent);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

// 内容区：占据全部空间
.panel-content {
  height: 100%;
  width: 100%;
  position: relative;
}

.view-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

// 视图切换过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 右下角浮动按钮组
.floating-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-switch {
  background: color-mix(in srgb, var(--card-bg-color) 90%, transparent);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);

  :deep(.el-button) {
    border: none;
    background: transparent;

    &:hover {
      background: var(--hover-bg-color);
    }

    &.el-button--primary {
      background: var(--primary-color);
      color: #fff;

      &:hover {
        background: var(--primary-color);
        opacity: 0.9;
      }
    }
  }
}

.expand-btn {
  background: color-mix(in srgb, var(--card-bg-color) 90%, transparent);
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}
</style>

<!-- 全屏对话框使用 append-to-body，scoped 样式不生效，需独立 style 块 -->
<style lang="less">
.expand-dialog {
  .el-dialog__header {
    display: flex;
    align-items: center;
    padding: 12px 20px;
  }

  .el-dialog__body {
    padding: 0;
    height: 80vh;
  }

  .expand-content {
    height: 100%;
    width: 100%;
  }
}
</style>