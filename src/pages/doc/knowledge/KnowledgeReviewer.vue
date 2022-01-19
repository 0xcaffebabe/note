<template>
  <el-drawer v-model="showDrawer" size="25%" title="知识回顾" :lock-scroll="false" custom-class="knowledge-review">
    <el-select v-model="displayMode" placeholder="选择" size="mini" class="display-mode" @change="handleDisplayModeChange">
      <el-option
        label="倒序"
        value="倒序"
      />
      <el-option
        label="正序"
        value="正序"
      />
    </el-select>
    <div class="history-list">
      <el-timeline>
        <el-timeline-item
          v-for="item in docList"
          :key="item[0]"
          :timestamp="new Date(item[1].date).toLocaleString() + ' ' + item[1].message"
        >
          <a href="#" @click.prevent="$router.push('/doc/' + item[0])">{{docId2Url(item[0])}}</a>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import api from "@/api";
import CommitInfo from "@/dto/CommitInfo";
import DocUtils from "@/util/DocUtils";
import { defineComponent } from "vue";

export default defineComponent({
  setup() {},
  data() {
    return {
      displayMode: '倒序' as '正序' | '倒序',
      showDrawer: false as boolean,
      docList: [] as [string, CommitInfo][]
    };
  },
  methods: {
    docId2Url: DocUtils.docId2Url,
    docUrl2Id: DocUtils.docUrl2Id,
    show() {
      this.showDrawer = true;
    },
    hide() {
      this.showDrawer = false;
    },
    handleDisplayModeChange() {
      this.docList.reverse()
      document.querySelector('.knowledge-review .el-drawer__body')?.scrollTo(0,0)
    }
  },
  async created() {
    this.docList = await api.getDescCommitDocList()
  }
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
.display-mode {
  position: fixed;
  width: 80px;
  z-index: 998;
  top: 50px;
  right: 10px;
}
</style>
