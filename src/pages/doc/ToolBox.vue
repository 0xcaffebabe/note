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
              class="box-item"
              @click="$emit(action.action)"
              :type="action.type"
              size="mini"
              >{{action.name}} <kbd v-if="action.hotkey">{{action.hotkey}}</kbd> </el-button
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
        {name: '思维导图', type: 'success', action: 'showMindGraph', hotkey: 'alt + l'},
        {name: '知识网络', type: 'warning', action: 'showKnowledgeNetwork', hotkey: 'alt + k'},
        {name: '添加书签', type: 'danger', action: 'showBookMarkAdder'},
        {name: '书签列表', type: 'info', action: 'showBookMarkList'},
        {name: '路径复制', type: 'success', action: 'copyDocPath'},
      ]
    }
  },
  methods: {
    handleKeyDown(e: KeyboardEvent){
      const actions = this.actionList.filter(v => v.hotkey)
      for(let action of actions) {
        const mainKey = action.hotkey!.split('+')[0].trim();
        const subKey = action.hotkey!.split('+')[1].trim();
        let mainKeyPressed = false;
        if (mainKey == 'alt') {
          mainKeyPressed = e.altKey;
        }
        if (mainKey == 'ctrl') {
          mainKeyPressed = e.ctrlKey;
        }
        if (mainKey == 'shift') {
          mainKeyPressed = e.shiftKey;
        }
        if (mainKeyPressed && e.key.toUpperCase() == subKey.toUpperCase()) {
          this.$emit(action.action);
          return e.preventDefault();
        }
      }
    }
  },
  setup() {},
  created(){
    console.log('register action listener')
    document.addEventListener('keydown', this.handleKeyDown);
  },
  unmounted(){
    console.log('remove action listener')
    document.removeEventListener('keydown', this.handleKeyDown);
  }
});
</script>

<style lang="less" scoped>
.tool-box {
  position: fixed;
  right: 300px;
  top: 100px;
}
.box-item {
  width: 140px;
}
</style>