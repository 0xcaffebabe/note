
<template>
  <div class="container">
    <h3>目标组合</h3>
    <el-table :data="tableData" table-layout="auto" class="table">
      <el-table-column label="名称" width="180">
        <template #default="scope">
          <el-input v-model="scope.row.name" />
        </template>
      </el-table-column>
      <el-table-column label="章节" width="500">
        <template #default="scope">
          <el-popover
            placement="top-start"
            :title="scope.row.name"
            :width="400"
            trigger="hover"
          >
            <template #reference>
              <span class="chapter-sum">{{ scope.row.chapterList.map(docUrl2Id)[0] }} <el-tag v-if="scope.row.chapterList.length > 1">+{{scope.row.chapterList.length - 1}}</el-tag></span>
            </template>
            <ul class="chapter-list">
              <li v-for="item in scope.row.chapterList" :key="item">
                <el-link @click="$emit('chapterClick', item)">{{ docUrl2Id(item) }}</el-link>
              </li>
            </ul>
          </el-popover>
          <el-button type="primary" circle style="float:right" size="small" @click="showChapterSelector(scope.$index)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="目标红绿灯">
        <template #default="scope">
          <el-progress
            :text-inside="true"
            :stroke-width="24"
            :percentage="calcIndex(scope.$index)"
            v-if="calcIndex(scope.$index) >= 60"
            status="success"
          />
          <el-progress
            :text-inside="true"
            :stroke-width="24"
            :percentage="calcIndex(scope.$index)"
            v-else-if="calcIndex(scope.$index) >= 30 && calcIndex(scope.$index) < 30"
            status="warning"
          />
          <el-progress
            :text-inside="true"
            :stroke-width="24"
            :percentage="calcIndex(scope.$index)"
            v-else
            status="exception"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" v-if="scope.$index > 0" @click="swapOrder(scope.$index, scope.$index-1)">上移</el-button>
          <el-button size="small" v-if="scope.$index < tableData.length - 1" @click="swapOrder(scope.$index, scope.$index+1)">下移</el-button>
          <el-button size="small" type="success" @click="appendRow(scope.$index)">往下新增</el-button>
          <el-button size="small" type="danger" @click="removeRow(scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <chapter-selector :showSelector="showSelector" ref="chapterSelector" @onSave="handleChapterSave"/>
  </div>
</template>

<script lang="ts">
import DocUtils from "@/util/DocUtils";
import { defineComponent } from "vue";
import { Edit } from "@element-plus/icons-vue";
import ChapterSelector from "./ChapterSelector.vue";

export default defineComponent({
  components: {
    Edit,
    ChapterSelector
  },
  watch: {
    tableData: {
      handler: function() {
        localStorage.setItem("ablity::data", JSON.stringify(this.tableData));
      },
      deep: true,
    }
  },
  emits: ['chapterClick'],
  data() {
    const tableData: {name: string, chapterList:string[]}[] = JSON.parse(localStorage.getItem("ablity::data") || "[]")
    return {
      showSelector: false,
      chapterIndex: 0,
      tableData: tableData || [
        {
          name: "Java",
          chapterList: [
            "./%E7%BC%96%E7%A8%8B%E8%AF%AD%E8%A8%80/JAVA/%E8%AF%AD%E8%A8%80%E5%9F%BA%E7%A1%80.md",
          ],
        },
        {
          name: "系统设计",
          chapterList: [
            "./%E8%BD%AF%E4%BB%B6%E5%B7%A5%E7%A8%8B/%E6%9E%B6%E6%9E%84/%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1/%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1.md",
            "./%E8%BD%AF%E4%BB%B6%E5%B7%A5%E7%A8%8B/%E6%9E%B6%E6%9E%84/%E6%9E%B6%E6%9E%84%E6%80%9D%E7%BB%B4.md",
          ],
        },
      ],
    };
  },
  methods: {
    docUrl2Id: DocUtils.docUrl2Id,
    showChapterSelector(index: number) {
      this.chapterIndex = index;
      (this.$refs.chapterSelector as InstanceType<typeof ChapterSelector>).show(this.tableData[index].chapterList);
    },
    swapOrder(index1: number, index2: number) {
      const t = this.tableData[index1];
      this.tableData[index1] = this.tableData[index2];
      this.tableData[index2] = t;
    },
    appendRow(index: number) {
      this.tableData.splice(index + 1, 0, {
        name: "",
        chapterList:[]
      });
    },
    calcIndex(index: number): number {
      const count = this.tableData.map(v => v.chapterList).flatMap(v => v).length;
      return Math.floor(this.tableData[index].chapterList.length / count * 100);
    },
    removeRow(index: number) {
      this.tableData.splice(index, 1);
    },
    handleChapterSave(value: string[]) {
      this.tableData[this.chapterIndex].chapterList = value;
    }
  },
});
</script>

<style lang="less" scoped>
.container {
  padding: 0 100px;
}
.table {
  width: 100%;
}
.chapter-list {
  max-height: 400px;
  overflow-y: scroll;
}
.chapter-sum {
  cursor: pointer;
}
</style>