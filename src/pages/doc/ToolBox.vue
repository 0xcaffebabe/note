<template>
  <div position="bottom" :offset="20" class="tool-box">
    <el-dropdown>
      <el-button type="primary" round size="mini">
        <el-icon style="vertical-align: middle"><tools /></el-icon> 工具栏
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="action in actionList" :key="action.name"
            ><el-button
              @click="$emit(action.action)"
              :type="action.type"
              size="mini"
              >{{action.name}}</el-button
            ></el-dropdown-item
          >
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {Tools} from '@element-plus/icons'

export default defineComponent({
  components: {
    Tools
  },
  data(){
    return {
      actionList: [
        {name: '阅读历史', type: 'primary', action: 'showReadingHistory'},
        {name: '思维导图', type: 'success', action: 'showMindGraph'},
        {name: '知识网络', type: 'warning', action: 'showKnowledgeNetwork'},
        {name: '添加书签', type: 'danger', action: 'showBookMarkAdder'},
        {name: '书签列表', type: 'info', action: 'showBookMarkList'},
      ]
    }
  },
  setup() {},
});
</script>

<style lang="less" scoped>
.tool-box {
  position: fixed;
  right: 300px;
  top: 100px;
}
</style>