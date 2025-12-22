<template>
  <div class="tool-box" :style="{'top': parentShowHeader? '66px': '6px'}">
    <el-dropdown trigger="click" placement="bottom-end">
      <el-button 
        type="default" 
        size="small" 
        class="tool-button"
        :icon="Tools"
        circle
        title="工具栏"
      />
      <template #dropdown>
        <el-dropdown-menu class="dropdown-menu">
          <el-dropdown-item 
            v-for="action in actionList" 
            :key="action.name" 
            :divided="action.divided || false"
            class="dropdown-item"
          >
            <el-button
              class="action-btn"
              @click="action.local ? localActionDispatch(action.action) : $emit(action.action)"
              :type="action.type"
              size="default"
              >{{action.name}} 
              <span class="hotkey" v-if="action.hotkey">{{action.hotkey}}</span>
            </el-button>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
  <el-drawer
    v-model="showDrawer"
    title="更多设置"
    :lock-scroll="false"
    size="300px"
    class="setting-drawer"
  >
    <div class="more-setting-container">
      <div class="setting-item">
        <span class="setting-label">字体大小</span>
        <el-slider 
          v-model="fontSize" 
          :min="14" 
          :max="24" 
          :step="1" 
          @input="handleFontSizeChange"
          class="setting-slider"
        />
        <span class="setting-value">{{fontSize}}px</span>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {Tools} from '@element-plus/icons-vue'
import Category from "@/dto/Category";
import CategoryService from "@/service/CategoryService";
import DocUtils from "@/util/DocUtils";

function random(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type ActionType =
    'showReadingHistory' |
    'showMindGraph' |
    'showKnowledgeNetwork' |
    'showKnowledgeIndex' |
    'copyDocPath' |
    'copyDocContent' |
    'showLinkList' |
    'openInEditor' |
    'showLlm' |
    'handleRandomReview'

type LocalActionType = ActionType & 'showMoreSetting' & 'randomReview'

interface Action {
  name: string
  type: string
  action: ActionType
  hotkey?: string
  divided?: boolean
  local?: boolean
}

export default defineComponent({
  inject: ['showHeader'],
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
    'showKnowledgeIndex',
    'copyDocPath',
    'copyDocContent',
    'showLinkList',
    'goToDoc',
    'goToPpt',
    'showKnowledgeReviewer',
    'openInEditor',
    'showLlm',
    'handleRandomReview'
  ],
  data(){
    return {
      showDrawer: false,
      fontSize: 16,
      parentShowHeader: true,
      flatCategoryList: [] as Category[],
      actionList: [
        {name: '思维导图', type: 'success', action: 'showMindGraph', hotkey: 'alt + l'},
        {name: '知识网络', type: 'warning', action: 'showKnowledgeNetwork', hotkey: 'alt + k'},
        {name: '知识索引', type: 'primary', action: 'showKnowledgeIndex', hotkey: 'alt + j'},
        {name: '知识回顾', type: 'primary', action: 'showKnowledgeReviewer', hotkey: 'alt + r'},
        {name: '知识助手', type: 'warning', action: 'showLlm', hotkey: 'alt + i'},
        {name: '路径复制', type: 'success', action: 'copyDocPath', hotkey: 'alt + c', divided: true},
        {name: '知识复制', type: 'warning', action: 'copyDocContent', hotkey: 'alt + x'},
        {name: '在VSC打开', type: 'danger', action: 'openInEditor', hotkey: 'alt + v'},
        {name: '链接列表', type: 'primary', action: 'showLinkList',},
        {name: '随机复习', type: 'primary', action: 'randomReview' as LocalActionType, local: true, hotkey: 'alt + n'},
        {name: '更多设置', type: 'info', action: 'showMoreSetting' as LocalActionType, local: true, divided: true},
      ] as Action[]
    }
  },
  methods: {
    localActionDispatch(action: string){
      switch(action) {
        case 'showMoreSetting':
          this.showDrawer = true;
          break;
        case 'randomReview':
          this.handleRandomReview();
          break;
        default:
          break;
      }
    },
    handleRandomReview() {
      // 通过 emit 事件将处理逻辑交给父组件 (DocPage.vue)
      this.$emit('handleRandomReview');
    },
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
        const key = e.key.toLowerCase()
        const code = e.code.toLowerCase().replace('key', '')
        if (mainKeyPressed && [key,code].some(v => v == subKey.toLowerCase())) {
          if (!action.local) {
            this.$emit(action.action);
          }else {
            this.localActionDispatch(action.action);
          }
          return e.preventDefault();
        }
      }
    },
    handleFontSizeChange(val: number) {
      const dom: HTMLElement = document.querySelector('.main.markdown-section')!;
      dom.style.fontSize = val + 'px';
    }
  },
  setup() {
    return {
      Tools
    }
  },
  async created(){
    document.addEventListener('keydown', this.handleKeyDown);
    this.flatCategoryList = await CategoryService.getFlatCategoryList();;
  },
  unmounted(){
    document.removeEventListener('keydown', this.handleKeyDown);
  }
});
</script>

<style lang="less" scoped>
.tool-box {
  transition: all 0.3s ease;
  position: fixed;
  right: 360px;
  z-index: 1000;
  padding: 4px;
}

@media screen and(max-width: 1366px) {
  .tool-box {
    right: 74px;
  }
}

.tool-button {
  width: 36px;
  height: 36px;
  padding: 8px;
  border: none;
  box-shadow: var(--shadow-md);
  background-color: var(--card-bg-color);
  transition: all 0.25s ease;
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
    background-color: var(--hover-bg-color);
  }
}

.dropdown-menu {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  padding: var(--spacing-sm) 0;
}

.dropdown-item {
  padding: 0;
  margin: 2px 0;
  
  &:first-child {
    margin-top: 0;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
}

.action-btn {
  width: 100%;
  justify-content: space-between;
  border-radius: var(--radius-md);
  margin: 0 var(--spacing-xs);
  padding: 8px 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  
  &:not(.is-disabled):hover {
    background-color: var(--hover-bg-color);
    border-color: var(--border-color);
  }
  
  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  body[theme=dark] & {
    &:not(.is-disabled):hover {
      background-color: var(--dark-hover-bg-color);
      border-color: var(--default-dark-border-color);
    }
  }
}

.hotkey {
  font-size: 12px;
  background-color: var(--hover-bg-color);
  color: var(--secondary-text-color);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.more-setting-container {
  padding: var(--spacing-md);
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.setting-label {
  min-width: 60px;
  margin-right: var(--spacing-md);
  color: var(--secondary-text-color);
}

.setting-slider {
  flex: 1;
  margin-right: var(--spacing-md);
}

.setting-value {
  min-width: 30px;
  text-align: left;
  color: var(--primary-color);
  font-weight: 500;
}

body[theme=dark] {
  .dropdown-menu {
    background-color: var(--dark-card-bg-color);
    border: 1px solid var(--default-dark-border-color);
  }
  
  .dropdown-item {
    .el-dropdown-menu__item:focus, 
    .el-dropdown-menu__item:not(.is-disabled):hover {
      background-color: var(--dark-hover-bg-color);
    }
  }
  
  .hotkey {
    background-color: var(--dark-hover-bg-color);
    color: var(--dark-secondary-text-color);
    border: 1px solid var(--default-dark-border-color);
  }
  
  .setting-label {
    color: var(--dark-secondary-text-color);
  }
  
  .setting-value {
    color: var(--primary-color);
  }
  
  .tool-button {
    background-color: var(--dark-card-bg-color);
    border: 1px solid var(--default-dark-border-color);
    
    &:hover {
      background-color: var(--dark-hover-bg-color);
    }
  }
}
</style>