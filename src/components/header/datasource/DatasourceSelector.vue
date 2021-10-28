<template>
  <div style="display: inline-block">
    <span style="color: #606266; font-size: 14px">数据源:</span>
    <el-select
      v-model="currentDatasource"
      placeholder="数据源"
      size="mini"
      style="width: 120px; margin-left: 10px"
      @change="handleDatasourceChange"
    >
      <el-option
        v-for="item in datasourceList"
        :key="item.id"
        :label="item.id"
        :value="item.id"
      >
        <span style="float: left">{{ item.id }}</span>
        <span
          style="
            float: right;
            margin-left: 10px;
            color: var(--el-text-color-secondary);
            font-size: 13px;
          "
          >{{ item.desc }}</span
        >
      </el-option>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DatasourceService from "@/service/DatasourceService";
import DatasourceItem from "@/dto/DatasourceItem";

export default defineComponent({
  setup() {
    
  },
  computed: {
    datasourceList(): DatasourceItem[] {
      return DatasourceService.listDatasourceList();
    },
    currentDatasource(): string {
      return DatasourceService.getCurrentDatasource().id;
    }
  },
  methods: {
    handleDatasourceChange(id: string){
      DatasourceService.setCurrentDatasource(this.datasourceList.filter(v => v.id == id)[0])
      window.location.reload()
    }
  }
})
</script>

<style lang="less" scoped>

</style>