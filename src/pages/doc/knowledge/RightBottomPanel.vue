<template>
  <div class="right-bottom-panel">
    <!-- Carousel 组件替换原来的 Tabs -->
    <el-carousel
      class="carousel-container"
      height="100%"
      direction="vertical"
      :autoplay="false"
      @change="onCarouselChange">
      <el-carousel-item>
        <div class="carousel-item-content">
          <div class="chart-container">
            <knowledge-network-chart
              class="carousel-content"
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
        </div>
      </el-carousel-item>
      <el-carousel-item>
        <div class="carousel-item-content">
          <mind id="panelMind" class="carousel-content" :mind-data="mindData" />
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- 右下角放大按钮 -->
    <el-button class="expand-btn" size="small" circle @click="openExpanded">
      <el-icon><FullScreen /></el-icon>
    </el-button>

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
        <knowledge-network-chart
          v-if="dialogTab === 'graph'"
          :doc="doc"
          mode="force"
          :onlySelfRelated="true"
          :isPotential="false"
          :showLegend="true"
          :showTooltip="true"
          :showChartText="true"
          :zoom="0.8"
          :degree="degree"
        />
        <mind v-else id="expandedMind" :mind-data="mindData" />
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElCarousel, ElCarouselItem, ElInputNumber, ElButton, ElButtonGroup, ElIcon, ElDialog, ElSegmented } from 'element-plus';
import { ZoomIn, ZoomOut, FullScreen } from '@element-plus/icons-vue';
import Mind from "@/components/mind/Mind.vue";
import KnowledgeNetworkChart from "./KnowledgeNetworkChart.vue";
import DocService from "@/service/DocService";
import MindNode from "@/dto/mind/MindNode";

const EMPTY_NODE = { id: '', topic: '', children: [], expanded: false, direction: 'left' } as MindNode;

export default defineComponent({
  name: "RightBottomPanel",
  components: {
    ElCarousel,
    ElCarouselItem,
    Mind,
    KnowledgeNetworkChart,
    ElInputNumber,
    ElButton,
    ElButtonGroup,
    ElIcon,
    ElDialog,
    ElSegmented,
    ZoomIn,
    ZoomOut,
    FullScreen
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
      minZoom: 0.1,
      maxZoom: 2,
      zoomStep: 0.1,
      currentIndex: 0,
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
      this.mindData = await DocService.generateMindData(doc);
    },
    zoomIn() {
      if (this.currentZoom < this.maxZoom) {
        this.currentZoom = Math.min(this.maxZoom, this.currentZoom + this.zoomStep);
      }
    },
    zoomOut() {
      if (this.currentZoom > this.minZoom) {
        this.currentZoom = Math.max(this.minZoom, this.currentZoom - this.zoomStep);
      }
    },
    onCarouselChange(index: number) {
      this.currentIndex = index;
    },
    openExpanded() {
      this.dialogTab = this.currentIndex === 0 ? 'graph' : 'mind';
      this.isExpanded = true;
    }
  }
});
</script>

<style lang="less" scoped>
.carousel-container {
  height: 100%;
  width: 100%;

  // 调整 Carousel 的样式以匹配原来的面板样式
  :deep(.el-carousel__container) {
    height: 100%;
  }

  :deep(.el-carousel__item) {
    background-color: transparent;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-carousel__indicators) {
    // 调整指示器的样式和位置
    margin-bottom: 10px;

    .el-carousel__indicator {
      // 指示器项的样式
      button {
        background-color: #d8dce5; // 默认指示器颜色
      }

      &.is-active {
        button {
          background-color: var(--primary-color); // 激活的指示器颜色
        }
      }
    }
  }

  // 为 Carousel 内容设置结构
  .carousel-item-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .carousel-label {
    padding: 8px 12px;
    font-size: 14px;
    font-weight: bold;
    background-color: rgba(245, 245, 245, 0.9);
    border-bottom: 1px solid #d8dce5;
    flex-shrink: 0; // 防止标签栏被压缩
  }

  .carousel-content {
    flex-grow: 1; // 占据剩余空间
    width: 100%;
  }
}

.right-bottom-panel {
  position: relative;
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-top-left-radius: 8px;
  border-radius: 8px;
  overflow: hidden;

  // 确保整个面板的高度被正确利用
  .carousel-container {
    height: 100%;
  }
}

// 暗色主题样式
body[theme=dark] .right-bottom-panel {
  background-color: var(--main-dark-bg-color);
  border-color: var(--second-dark-bg-color);

  .carousel-container {
    :deep(.el-carousel__indicators) {
      .el-carousel__indicator {
        button {
          background-color: var(--default-dark-border-color); // 暗色主题下的指示器颜色
        }

        &.is-active {
          button {
            background-color: var(--dark-primary-color); // 暗色主题下的激活指示器颜色
          }
        }
      }
    }

    .carousel-label {
      background-color: var(--second-dark-bg-color);
      border-bottom-color: var(--default-dark-border-color);
    }
  }
}

// 新增样式：使知识网络图表容器占满空间，并在左下角放置控制面板
.chart-container {
  position: relative;
  height: 100%;
  width: 100%;

  .knowledge-network-chart {
    height: 100%;
    width: 100%;
  }

  .control-panel {
    position: absolute;
    bottom: 10px;
    left: 10px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .degree-input {
      width: 74px;
    }
  }
}

// 右下角放大按钮
.expand-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 10;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

// 暗色主题下的控制面板样式
body[theme=dark] .right-bottom-panel .chart-container .control-panel {
  background: rgba(40, 40, 40, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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