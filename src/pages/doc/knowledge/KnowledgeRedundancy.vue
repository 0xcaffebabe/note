<template>
  <el-drawer
    v-model="showDrawer"
    size="64%"
    :with-header="false"
    title="知识冗余检测"
    @close="$emit('close')"
    :lock-scroll="true"
    modal-class="drawer-modal-class"
  >
    <el-table :data="similarList" style="width: 100%">
      <el-table-column type="expand">
        <template #default="scope">
          <div style="padding-left:40px">
            <p>源文本: {{scope.row.sourceText}}</p>
            <p>目标文本: {{scope.row.targetText}}</p>
            <p>
              <span :class="{removed: part.removed, added: part.added}" v-for="part in diff(scope.row.sourceText, scope.row.targetText)" :key="part">{{part.value}}</span>
            </p>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="源文件">
        <template #default="scope">
          <el-link>{{docUrl2Id(scope.row.source)}}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="target" label="目标文件" >
        <template #default="scope">
          <el-link>{{docUrl2Id(scope.row.target)}}</el-link>
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<script lang="ts">
import api from '@/api'
import { SimilarItem } from '@/dto/doc/SimilarItem'
import DocUtils from '@/util/DocUtils'
import { defineComponent } from 'vue'
import {diffChars} from 'diff'

export default defineComponent({
  data() {
    return {
      showDrawer: false,
      similarList: [] as SimilarItem[]
    }
  },
  async created() {
    this.similarList = await api.getTextSimilar()
  },
  methods: {
    docUrl2Id(url: string): string {
      return DocUtils.docUrl2Id(url)
    },
    show() {
      this.showDrawer = true
    },
    diff(source: string, target: string){
      return diffChars(source, target)
    }
  }
})
</script>

<style lang="less">
.added {
  color: green;
}
.removed {
  color: red;
}
</style>