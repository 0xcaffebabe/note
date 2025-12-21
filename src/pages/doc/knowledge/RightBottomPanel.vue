<template>
  <div class="right-bottom-panel">
    <!-- Carousel 组件替换原来的 Tabs -->
    <el-carousel
      class="carousel-container"
      height="100%"
      direction="vertical"
      :autoplay="false">
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
              :zoom="0.6"
              :degree="degree"
            />
            <div class="control-panel">
              <el-input-number
                v-model="degree"
                :min="1"
                :max="10"
                label="度数"
                size="small"
                class="degree-input"
              />
            </div>
          </div>
        </div>
      </el-carousel-item>
      <el-carousel-item>
        <div class="carousel-item-content">
          <mind-note class="carousel-content" />
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElCarousel, ElCarouselItem, ElInputNumber } from 'element-plus';
import MindNote from "../mind/MindNote.vue";
import KnowledgeNetworkChart from "./KnowledgeNetworkChart.vue";

export default defineComponent({
  name: "RightBottomPanel",
  components: {
    ElCarousel,
    ElCarouselItem,
    MindNote,
    KnowledgeNetworkChart,
    ElInputNumber
  },
  props: {
    doc: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      degree: 1 // 默认度数为1
    };
  },
  // 移除了 activeTab，因为 Carousel 有自己的内部状态管理
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
    position: fixed;
    bottom: 10px;
    left: 10px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px;

    .degree-input {
      width: 74px;
    }
  }
}
</style>