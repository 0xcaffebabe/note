<template>
  <div class="tool-box" :class="{ 'is-mobile': isMobile }" :style="deskStyle">
    <el-dropdown trigger="click" :placement="isMobile ? 'top-end' : 'bottom-end'">
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
          <!-- 点击直接绑定在菜单项上: 消除按钮嵌套带来的键盘焦点割裂与点击死区 -->
          <el-dropdown-item
            v-for="action in visibleActions"
            :key="action.name"
            :divided="action.divided || false"
            class="dropdown-item"
            @click="action.local ? localActionDispatch(action.action) : $emit(action.action)"
          >
            <span class="action-row">
              <el-icon class="action-icon" :class="'tone-' + action.type">
                <component :is="action.icon" />
              </el-icon>
              <span class="action-name">{{action.name}}</span>
              <!-- 快捷键提示仅在有物理键盘(非触屏)时展示 -->
              <span class="action-keys" v-if="action.hotkey && !isTouch">
                <kbd v-for="(k, i) in action.hotkey.split('+').map(s => s.trim())" :key="i">{{ k }}</kbd>
              </span>
            </span>
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
          :min="fontMin"
          :max="fontMax"
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
import { defineComponent, markRaw } from "vue";
import {
  Tools, Share, Connection, DataAnalysis, MagicStick,
  Position, CopyDocument, EditPen, Refresh, Setting
} from '@element-plus/icons-vue'
import Category from "@/dto/Category";
import CategoryService from "@/service/CategoryService";
import ConfigService from "@/service/ConfigService";
import { isMobile, isTouch, isFull } from "@/composables/useBreakpoint";

type ActionType =
    'showMindGraph' |
    'showKnowledgeNetwork' |
    'showKnowledgeReviewer' |
    'copyDocPath' |
    'copyDocContent' |
    'openInEditor' |
    'showLlm' |
    'handleRandomReview'

type LocalActionType = ActionType & 'showMoreSetting' & 'randomReview'

interface Action {
  name: string
  type: string
  action: ActionType
  icon?: any
  hotkey?: string
  divided?: boolean
  local?: boolean
  // 仅 full 档(宽桌面)展示: 如"在VSC打开"对移动端无意义
  fullOnly?: boolean
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
    'showMindGraph',
    'showKnowledgeNetwork',
    'showKnowledgeReviewer',
    'copyDocPath',
    'copyDocContent',
    'openInEditor',
    'showLlm',
    'handleRandomReview'
  ],
  data(){
    return {
      showDrawer: false,
      fontSize: (ConfigService.get('fontSize') as number) || 16,
      parentShowHeader: true,
      flatCategoryList: [] as Category[],
      actionList: [
        {name: '思维导图', type: 'success', action: 'showMindGraph', icon: markRaw(Share), hotkey: 'alt + l'},
        {name: '知识网络', type: 'warning', action: 'showKnowledgeNetwork', icon: markRaw(Connection), hotkey: 'alt + k'},
        {name: '知识回顾', type: 'primary', action: 'showKnowledgeReviewer', icon: markRaw(DataAnalysis), hotkey: 'alt + r'},
        {name: '知识助手', type: 'warning', action: 'showLlm', icon: markRaw(MagicStick), hotkey: 'alt + i'},
        {name: '路径复制', type: 'success', action: 'copyDocPath', icon: markRaw(Position), hotkey: 'alt + c', divided: true},
        {name: '知识复制', type: 'warning', action: 'copyDocContent', icon: markRaw(CopyDocument), hotkey: 'alt + x'},
        {name: '在VSC打开', type: 'danger', action: 'openInEditor', icon: markRaw(EditPen), hotkey: 'alt + v', fullOnly: true},
        {name: '随机复习', type: 'primary', action: 'randomReview' as LocalActionType, icon: markRaw(Refresh), local: true, hotkey: 'alt + n'},
        {name: '更多设置', type: 'info', action: 'showMoreSetting' as LocalActionType, icon: markRaw(Setting), local: true, divided: true},
      ] as Action[]
    }
  },
  computed: {
    isMobile(): boolean {
      return isMobile.value;
    },
    isTouch(): boolean {
      return isTouch.value;
    },
    // VSC 等 full-only 动作仅在宽桌面档展示
    visibleActions(): Action[] {
      return this.actionList.filter(a => !a.fullOnly || isFull.value);
    },
    // 移动端字号上限更高(单栏阅读) 桌面端区间更克制
    fontMin(): number {
      return this.isMobile ? 16 : 14;
    },
    fontMax(): number {
      return this.isMobile ? 48 : 24;
    },
    // 桌面端按顶栏显隐微调纵向锚点; 移动端用 CSS 固定 FAB 定位
    deskStyle(): Record<string, string> {
      return this.isMobile ? {} : { top: this.parentShowHeader ? '66px' : '6px' };
    },
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
      const actions = this.visibleActions.filter(v => v.hotkey)
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
      const dom: HTMLElement | null = document.querySelector('.main.markdown-section');
      if (dom) {
        dom.style.fontSize = val + 'px';
      }
      ConfigService.set('fontSize', val);
    }
  },
  setup() {
    return {
      Tools
    }
  },
  async created(){
    // 快捷键层仅在有物理键盘(非触屏)时挂载, 避免触屏设备空挂监听
    if (!isTouch.value) {
      document.addEventListener('keydown', this.handleKeyDown);
    }
    this.flatCategoryList = await CategoryService.getFlatCategoryList();
  },
  unmounted(){
    document.removeEventListener('keydown', this.handleKeyDown);
  }
});
</script>

<style lang="less" scoped>
.tool-box {
  transition: all var(--transition-normal);
  position: fixed;
  // TOC列宽300 + 20留白
  right: 320px;
  z-index: var(--z-overlay);
  padding: 4px;
}

// 移动端: 右下角悬浮 FAB, 避让底部操作栏并适配安全区
.tool-box.is-mobile {
  top: auto;
  right: 16px;
  bottom: calc(72px + env(safe-area-inset-bottom));
  padding: 0;

  .tool-button {
    width: 44px;
    height: 44px;
    box-shadow: var(--shadow-lg);
  }
}

@media screen and (max-width: @bp-desktop) {
  .tool-box:not(.is-mobile) {
    right: 74px;
  }
}

// 大屏宽档: 居中壳使盈余分到两侧, 浮动工具栏须随壳右缘内移(否则 2560 下被甩进右侧死白)
// = 壳右外边距((100vw-壳)/2) + 原 320 偏移, 始终贴住 TOC/正文交界
@media (min-width: @bp-wide) {
  .tool-box:not(.is-mobile) {
    right: calc((100vw - var(--doc-shell-max)) / 2 + var(--doc-toc-w) + 20px);
  }
}

// 超宽档: 工具栏须再让过第4列(关联)宽度
@media (min-width: @bp-ultra) {
  .tool-box:not(.is-mobile) {
    right: calc((100vw - var(--doc-shell-max)) / 2 + var(--doc-toc-w) + var(--doc-related-w) + 20px);
  }
}

// 工具栏按钮: 桌面与移动端统一为同一描边 + 卡片底样式(深色图标落浅色卡片底, 静置即可见);
// 移动端仅尺寸/定位不同(见 .tool-box.is-mobile). 早前移动端曾用 type=primary 蓝底,
// 但通用底色规则特异度更高盖住蓝底, 致白色图标"隐形"唤起后才显形, 故回归桌面端一致样式。
.tool-button {
  width: 36px;
  height: 36px;
  padding: 8px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  background-color: var(--card-bg-color);
  transition: all var(--transition-normal);

  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
    background-color: var(--card-bg-color);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
}

.dropdown-menu {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  padding: var(--spacing-sm) 0;
}

.dropdown-item {
  margin: 2px var(--spacing-xs);
  padding: 6px 10px;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);

  &:first-child {
    margin-top: 0;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.action-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  min-width: 172px;
}

// 图标按 type 着语义色 让一长串菜单项一眼可分组
.action-icon {
  flex-shrink: 0;
  font-size: 16px;

  &.tone-success { color: var(--success-color); }
  &.tone-warning { color: var(--warning-color); }
  &.tone-primary { color: var(--primary-color); }
  &.tone-danger  { color: var(--danger-color); }
  &.tone-info    { color: var(--secondary-text-color); }
}

.action-name {
  flex: 1;
  color: var(--main-text-color);
  font-size: var(--font-size-base);
}

// 快捷键拆成键帽 与命令面板(CommandPalette)风格统一
.action-keys {
  display: flex;
  gap: 3px;
  flex-shrink: 0;

  kbd {
    display: inline-block;
    min-width: 18px;
    padding: 1px 5px;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.4;
    text-align: center;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    background-color: var(--hover-bg-color);
    border: 1px solid var(--border-color);
    border-bottom-width: 2px;
    border-radius: var(--radius-sm);
  }
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
</style>
