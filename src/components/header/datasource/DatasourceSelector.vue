<template>
  <div style="display: inline-block">
    <span class="datasource-text">数据源:</span>
    <el-select
      v-model="currentDatasource"
      placeholder="数据源"
      size="small"
      popper-class="datasource-popper-list"
      style="width: 120px; margin-left: 10px"
      @change="handleDatasourceChange"
    >
      <el-option
        v-for="item in datasourceList"
        :key="item.id"
        :label="item.id"
        :value="item.id"
        :disabled="isDisabled(item)"
      >
        <el-badge
          value="only-http"
          class="protocol"
          type="warning"
          v-if="item.url.startsWith('http://')"
        />
        <el-badge
          value="only-https"
          class="protocol"
          type="danger"
          v-if="item.url.startsWith('https://')"
        />
        <el-badge
          value="https+http"
          class="protocol"
          type="success"
          v-if="item.url.startsWith('//')"
        />
        <el-badge
          value="nolimit"
          class="protocol"
          type="success"
          v-else-if="item.url.startsWith('/')"
        />
        <span class="text" style="margin-left: 4px">
          {{ item.id }}
        </span>

        <span
          class="text"
          style="
            margin-left: 20px;
            color: var(--el-text-color-secondary);
            font-size: 13px;
          "
          >{{ item.desc }}
          <span class="delay">{{ delay[item.id] }} ms</span>
          <el-badge class="last-update" :value="lastUpdateMap[item.id] ? new Date(lastUpdateMap[item.id]).toLocaleString(): '未知'" type="primary"/>
        </span>
      </el-option>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DatasourceService from "@/service/DatasourceService";
import DatasourceItem from "@/dto/DatasourceItem";

export default defineComponent({
  setup() {},
  computed: {
    datasourceList(): DatasourceItem[] {
      return DatasourceService.listDatasourceList();
    },
    currentDatasource(): string {
      return DatasourceService.getCurrentDatasource().id;
    },
  },
  data() {
    return {
      delay: {} as any,
      lastUpdateMap: {} as any
    };
  },
  watch: {
    datasourceList: {
      immediate: true,
      handler(val: DatasourceItem[]) {
        for (let i of val) {
          DatasourceService.testDelay(i.id).then(
            (data) => {
              this.delay[i.id] = data[0];
              this.lastUpdateMap[i.id] = data[1];
            }
          );
        }
      },
    },
  },
  methods: {
    handleDatasourceChange(id: string) {
      DatasourceService.setCurrentDatasource(
        this.datasourceList.filter((v) => v.id == id)[0]
      );
      window.location.reload();
    },
    isDisabled(datasource: DatasourceItem): boolean{
      return datasource.url.startsWith('http:') && window.location.protocol == 'https:'
    }
  },
});
</script>

<style lang="less" scoped>
.delay {
  color: var(--el-color-danger);
}
.protocol {
  margin-left: -4px;
}
.last-update {
  margin-left: 4px;
  float:right;
}
.datasource-text {
  color: #606266;
  font-size: 14px
}

body[theme=dark] {
  .datasource-text {
    color: var(--main-dark-text-color);
  }
}
</style>

<style lang="less">
.datasource-popper-list {
  max-width: 100%!important;
}
body[theme=dark] {
  .text {
    color: var(--main-dark-text-color)!important;
  }
}
</style>