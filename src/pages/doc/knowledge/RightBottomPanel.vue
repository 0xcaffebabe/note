<template>
  <div class="right-bottom-panel">
    <el-tabs v-model="activeTab" class="tabs-container" type="border-card" tab-position="left">
      <el-tab-pane label="知识导图" name="mind-note">
        <mind-note class="tab-content" />
      </el-tab-pane>
      <el-tab-pane label="知识网络" name="knowledge-network">
        <knowledge-network-chart
          class="tab-content"
          :doc="doc"
          mode="force"
          :onlySelfRelated="true"
          :isPotential="false"
          :showLegend="false"
          :degree="3"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElTabs, ElTabPane } from 'element-plus';
import MindNote from "../mind/MindNote.vue";
import KnowledgeNetworkChart from "./KnowledgeNetworkChart.vue";

export default defineComponent({
  name: "RightBottomPanel",
  components: {
    ElTabs,
    ElTabPane,
    MindNote,
    KnowledgeNetworkChart
  },
  props: {
    doc: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'mind-note' as 'mind-note' | 'knowledge-network',
    };
  }
});
</script>

<style lang="less" scoped>
.tabs-container {
  height: 100%;
}
.right-bottom-panel {
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-bottom: none;
  border-right: none;
  border-top-left-radius: 8px;
  overflow: hidden;

  :deep(.el-tabs) {
    height: 100%;
    border: none;
    background: transparent;

    &.el-tabs--border-card {
      height: 100%;
      background: transparent;
      border: none;

      > .el-tabs__header {
        background: transparent;
        border: none;
        margin: 0;

        .el-tabs__nav {
          border: none;

          .el-tabs__item {
            border: 1px solid transparent;
            border-bottom: 1px solid #d8dce5;
            background-color: rgba(245, 245, 245, 0.9);

            &:first-child {
              border-left: 1px solid #d8dce5;
            }

            &:last-child {
              border-right: 1px solid #d8dce5;
            }

            &.is-active {
              background-color: var(--primary-color);
              color: white;
              border: 1px solid #d8dce5;
              border-bottom: 1px solid var(--primary-color);
            }
          }
        }
      }

      > .el-tabs__content {
        height: calc(100% - 40px); // 减去标签头的高度
        padding: 0;
      }
    }

    .el-tab-pane {
      height: 100%;
    }
  }

  .tab-content {
    height: 100%;
    width: 100%;

    :deep(.mind-note) {
      position: static !important;  /* 覆盖 MindNote 的固定定位 */
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      background: transparent !important;
      z-index: auto !important;
    }
  }
}

body[theme=dark] .right-bottom-panel {
  background-color: var(--main-dark-bg-color);
  border-color: var(--second-dark-bg-color);

  :deep(.el-tabs) {
    &.el-tabs--border-card {
      > .el-tabs__header {
        .el-tabs__nav {
          .el-tabs__item {
            background-color: var(--second-dark-bg-color);
            border-color: var(--default-dark-border-color);

            &.is-active {
              background-color: var(--dark-primary-color);
              border-color: var(--default-dark-border-color);
              border-bottom-color: var(--dark-primary-color);
            }
          }
        }
      }
    }
  }
}
</style>