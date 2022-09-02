
<template>
  <div class="container">
    <h3>组合</h3>
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
              <span>{{ scope.row.chapterList.map(docUrl2Id)[0] }} <el-tag v-if="scope.row.chapterList.length > 1">+{{scope.row.chapterList.length - 1}}</el-tag></span>
            </template>
            <ul>
              <li v-for="item in scope.row.chapterList" :key="item">
                <el-link>{{ docUrl2Id(item) }}</el-link>
              </li>
            </ul>
          </el-popover>
          <el-button type="primary" circle style="float:right" size="small" @click="showChapterSelector(scope.$index)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" v-if="scope.$index > 0">上移</el-button>
          <el-button size="small" v-if="scope.$index < tableData.length - 1">下移</el-button>
          <el-button size="small" type="success">往下新增</el-button>
          <el-button size="small" type="danger">删除</el-button>
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
  data() {
    return {
      showSelector: false,
      chapterIndex: 0,
      tableData: [
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
    handleEdit(a: any, b: any) {},
    showChapterSelector(index: number) {
      this.chapterIndex = index;
      (this.$refs.chapterSelector as InstanceType<typeof ChapterSelector>).show(this.tableData[index].chapterList);
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
</style>