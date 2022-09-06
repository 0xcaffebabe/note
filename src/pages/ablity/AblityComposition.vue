
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
            placement="right-start"
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
            v-else-if="calcIndex(scope.$index) >= 30 && calcIndex(scope.$index) < 60"
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
      <el-table-column label="数据">
        <template #default="scope">
          <span>总章节数: {{calcChapterCount(scope.$index)}}</span>
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
    <chapter-selector ref="chapterSelector" @onSave="handleChapterSave"/>
  </div>
</template>

<script lang="ts">
import DocUtils from "@/util/DocUtils";
import { defineComponent } from "vue";
import { Edit } from "@element-plus/icons-vue";
import ChapterSelector from "./ChapterSelector.vue";
import CategoryService from '@/service/CategoryService';
import Category from "@/dto/Category";
import DefaultAblity from './DefaultAblity'

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
      tableData: tableData.length != 0 ? tableData : DefaultAblity,
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
      const sorted = this.tableData
                      .map(v => v.chapterList)
                      .flatMap(v => v)
                      .map(v => CategoryService.getCategory(cate => v == cate.link)[0])
                      .map(v => Category.childrenSize(v))
                      .sort();
      let mid = -1;
      const midPos = Math.floor(sorted.length / 2)
      if (sorted.length % 2 == 0) {
        mid = (sorted[midPos] + sorted[midPos - 1]) / 2
      }else {
        mid = sorted[midPos]
      }
      const val = Math.floor(
        this.tableData[index].chapterList
        .map(v => CategoryService.getCategory(cate => v == cate.link)[0])
        .map(v => Category.childrenSize(v))
        .reduce((a,b) => a+b, 0)

        
        / mid * 100
        );
        return Math.min(100, val)
    },
    calcChapterCount(index: number): number {
      return this.tableData[index].chapterList
        .map(v => CategoryService.getCategory(cate => v == cate.link)[0])
        .map(v => Category.childrenSize(v))
        .reduce((a,b) => a+b, 0)
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