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
          <!-- 点击直接绑定在菜单项上: 消除按钮嵌套带来的键盘焦点割裂与点击死区 -->
          <el-dropdown-item
            v-for="action in actionList"
            :key="action.name"
            :divided="action.divided || false"
            @click="action.local ? localActionDispatch(action.action) : $emit(action.action)"
          >
            <span class="box-item">{{action.name}}</span>
          </el-dropdown-item>
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
import ConfigService from '@/service/ConfigService'

type ActionType =
    'showMindGraph' |
    'showKnowledgeNetwork' |
    'showBookMarkAdder' |
    'showBookMarkList' |
    'copyDocPath' |
    'goToDoc' |
    'goToPpt' |
    'showKwFinder' |
    'showLlm' |
    'showMoreSetting'

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
      fontSize: (ConfigService.get('fontSize') as number) || 16,
      parentShowHeader: true,
      actionList: [
        {name: '思维导图', type: 'success', action: 'showMindGraph'},
        {name: '知识网络', type: 'warning', action: 'showKnowledgeNetwork'},
        {name: '知识回顾', type: 'primary', action: 'showKnowledgeReviewer'},
        {name: '知识助手', type: 'warning', action: 'showLlm', divided: true},
        {name: '更多设置', type: 'info', action: 'showMoreSetting', local: true, divided: true},
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
      const dom: HTMLElement | null = document.querySelector('.markdown-section');
      if (dom) {
        dom.style.fontSize = val + 'px';
      }
      ConfigService.set('fontSize', val);
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
  transition: var(--transition-smooth);
  position: fixed;
  // 避让底部操作栏 并适配安全区
  bottom: calc(72px + env(safe-area-inset-bottom));
  right: 16px;
  z-index: var(--z-overlay);
}
.box-item {
  display: inline-block;
  min-width: 120px;
  padding: 4px 0;
}
.more-setting-container {
  padding: 10px;
}
.fix-button {
  box-shadow: var(--shadow-md);
}
</style>