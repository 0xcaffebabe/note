<template>
  <el-drawer v-model="showDrawer" size="20%" title="阅读历史">
    <div class="history-list">
      <el-timeline>
        <el-timeline-item
          v-for="item in readHistoryList"
          :key="item.doc"
          :timestamp="item.time"
        >
          <a href="#" @click.prevent="$router.push('/doc/' + item.doc)">{{docId2Url(item.doc)}}</a>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import ReadHistoryItem from "@/dto/ReadHistoryItem";
import DocService from "@/service/DocService";
import DocUtils from "@/util/DocUtils";
import { defineComponent } from "vue";

export default defineComponent({
  setup() {},
  data() {
    return {
      showDrawer: false as boolean,
      readHistoryList: [] as ReadHistoryItem[]
    };
  },
  methods: {
    docId2Url: DocUtils.docId2Url,
    show() {
      this.showDrawer = true;
      this.readHistoryList = DocService.getReadHistoryList()
    },
    hide() {
      this.showDrawer = false;
    },
  },
});
</script>

<style lang="less" scoped>
.history-list {
  a {
    text-decoration: none;
    color: #74818d;
    font-weight: 400;
    font-size: 14px;
  }
  a:hover {
    color: #3E90E8 !important;
  }
  :deep(.el-timeline-item:hover .el-timeline-item__node) {
    background-color: #3E90E8 !important;
    border-color: #3E90E8 !important;
  }
}
</style>
