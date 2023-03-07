<template>
  <div position="bottom" :offset="20" class="tool-box" :style="{'top': parentShowHeader? '66px': '6px'}">
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
              >{{action.name}} <kbd v-if="action.hotkey">{{action.hotkey}}</kbd> </el-button
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
import {random} from 'lodash'
import Category from "@/dto/Category";
import CategoryService from "@/service/CategoryService";
import DocUtils from "@/util/DocUtils";

type ActionType = 
    'showReadingHistory' |
    'showMindGraph' |
    'showKnowledgeNetwork' |
    'showBookMarkAdder' |
    'showBookMarkList' |
    'copyDocPath' |
    'showLinkList' |
    'showKnowledgeSystem' | 
    'goToDoc' | 
    'goToPpt' |
    'downloadPdf' |
    'showKnowledgeSystem' | 
    'openInEditor' | 
    'showKnowledgeAblity'

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
    'showKnowledgeSystem',
    'goToDoc',
    'goToPpt',
    'downloadPdf',
    'showKnowledgeReviewer',
    'showKnowledgeTrend',
    'showKnowledgeRedundancy',
    'openInEditor',
    'showKnowledgeAblity'
  ],
  data(){
    return {
      showDrawer: false,
      fontSize: 1,
      parentShowHeader: true,
      flatCategoryList: [] as Category[],
      actionList: [
        {name: '阅读历史', type: 'primary', action: 'showReadingHistory'},
        {name: '思维导图', type: 'success', action: 'showMindGraph', hotkey: 'alt + l'},
        {name: '知识网络', type: 'warning', action: 'showKnowledgeNetwork', hotkey: 'alt + k'},
        {name: '知识体系', type: 'success', action: 'showKnowledgeSystem', },
        {name: '知识回顾', type: 'primary', action: 'showKnowledgeReviewer', hotkey: 'alt + r'},
        {name: '知识趋势', type: 'danger', action: 'showKnowledgeTrend', hotkey: 'alt + t'},
        {name: '知识冗余', type: 'success', action: 'showKnowledgeRedundancy'},
        {name: '知识能力', type: 'primary', action: 'showKnowledgeAblity', hotkey: 'alt + a'},
        {name: '添加书签', type: 'danger', action: 'showBookMarkAdder', divided: true},
        {name: '路径复制', type: 'success', action: 'copyDocPath', hotkey: 'alt + c'},
        {name: '在VSC打开', type: 'danger', action: 'openInEditor', hotkey: 'alt + v'},
        {name: '书签列表', type: 'info', action: 'showBookMarkList'},
        {name: '链接列表', type: 'primary', action: 'showLinkList',},
        {name: '去到DOC', type: 'info', action: 'goToDoc', divided: true},
        {name: '去到PPT', type: 'danger', action: 'goToPpt'},
        {name: '下载pdf', type: 'success', action: 'downloadPdf'},
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
      const category = this.flatCategoryList[random(0, this.flatCategoryList.length - 1)];
      this.$router.push("/doc/" + DocUtils.docUrl2Id(category.link));
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
        if (mainKeyPressed && e.key.toUpperCase() == subKey.toUpperCase()) {
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
      const dom: HTMLElement = document.querySelector('.markdown-section')!;
      dom.style.fontSize = val + 'px';
    }
  },
  setup() {},
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
  transition: all 0.2s;
  position: fixed;
  right: 300px;
  z-index: 1000;
}

@media screen and(max-width: 1366px) {
  .tool-box {
    right: 74px;
  }
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