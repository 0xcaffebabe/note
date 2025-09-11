<template>
  <div position="top" :offset="20" class="tool-box">
    <el-dropdown>
      <div>

      <el-button type="primary" round size="small" class="fix-button">
        <el-icon style="vertical-align: middle"><tools /></el-icon> 工具栏
      </el-button>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="action in actionList" :key="action.name" :divided="action.divided || false"
            ><el-button
              class="box-item"
              @click="action.local ? localActionDispatch(action.action) : $emit(action.action)"
              :type="action.type"
              size="small"
              >{{action.name}} </el-button
            ></el-dropdown-item
          >
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
  <el-drawer
    v-model="showDrawer"
    title="更多设置"
    :lock-scroll="false"
  >
    <div class="more-setting-container">
      <div>
        <span>字体大小</span>
        <el-slider v-model="fontSize" :min="16" :max="48" :step="1" @input="handleFontSizeChange"></el-slider>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {Tools} from '@element-plus/icons-vue'

type ActionType = 
    'showMindGraph' |
    'showKnowledgeNetwork' |
    'showBookMarkAdder' |
    'showBookMarkList' |
    'copyDocPath' |
    'showLinkList' |
    'goToDoc' | 
    'goToPpt' |
    'showKwFinder' |
    'showLlm'

interface Action {
  name: string
  type: string
  action: ActionType
  divided?: boolean
  local?: boolean
}

export default defineComponent({
  components: {
    Tools
  },
  watch: {
    showHeader: {
      handler(val){
        this.parentShowHeader = val;
      },
      immediate: true
    }
  },
  emits: [
    'showReadingHistory',
    'showMindGraph',
    'showKnowledgeNetwork',
    'showBookMarkAdder',
    'showBookMarkList',
    'copyDocPath',
    'showLinkList',
    'goToDoc',
    'goToPpt',
    'showKnowledgeReviewer',
    'showKnowledgeRedundancy',
    'showKwFinder',
    'showLlm'
  ],
  data(){
    return {
      showDrawer: false,
      fontSize: 1,
      parentShowHeader: true,
      actionList: [
        {name: '思维导图', type: 'success', action: 'showMindGraph'},
        {name: '知识网络', type: 'warning', action: 'showKnowledgeNetwork'},
        {name: '知识回顾', type: 'primary', action: 'showKnowledgeReviewer'},
        {name: '知识助手', type: 'warning', action: 'showLlm', divided: true},
        {name: '文本搜索', type: 'warning', action: 'showKwFinder'},
      ] as Action[]
    }
  },
  methods: {
    localActionDispatch(action: string){
      switch(action) {
        case 'showMoreSetting':
          this.showDrawer = true;
          break;
        default:
          break;
      }
    },
    handleFontSizeChange(val: number) {
      const dom: HTMLElement = document.querySelector('.markdown-section')!;
      dom.style.fontSize = val + 'px';
    }
  },
  setup() {},
  created(){
  },
  unmounted(){
  }
});
</script>

<style lang="less" scoped>
.tool-box {
  transition: all 0.2s;
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
.box-item {
  width: 140px;
  padding: 6px 0;
}
.more-setting-container {
  padding: 10px;
}
.fix-button {
  box-shadow: 2px 2px 13px #bbb;
}

body[theme=dark] {
  .el-dropdown-menu {
    background-color: var(--second-dark-bg-color);
  }
  .el-dropdown-menu__item--divided {
    border-top: 1px solid var(--main-dark-bg-color);
  }
}
</style>

<style lang="less">
body[theme=dark] {
  .el-dropdown__popper {
    border-color: var(--default-dark-border-color)!important;
  }
  .el-dropdown-menu__item:focus, .el-dropdown-menu__item:not(.is-disabled):hover {
    background-color: var(--main-dark-bg-color);
  }
  .fix-button {
    box-shadow: 2px 2px 13px #111;
  }
}
</style>