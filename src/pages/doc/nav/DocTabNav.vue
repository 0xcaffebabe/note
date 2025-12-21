<template>
  <el-scrollbar 
    wrap-class="tab-container-wrapper" 
    class="tab-container" 
    v-bind="$attrs"
    ref="tabContainer" 
    :style="{top: parentShowHeader? 66 + 'px': 6 + 'px', position: fixed? 'fixed': 'absolute'}"
  >
    <el-button
      class="nav-tab-item"
      size="default"
      v-for="cate in cateList"
      :key="cate"
      :url="cate"
      @contextmenu="handleContextMenuEvent(cate, $event)"
      :class="{
        'active': docUrl2Id(currentCate.link) == docUrl2Id(cate)
      }"
      @click="$router.push('/doc/' + docUrl2Id(cate))"
      @dblclick="$emit('dbclick')"
    >
      <div class="tab-content">
        <span class="tab-name">{{ cateName(cate) }}</span>
        <span class="tab-category">{{findRootCategoryFirstLetter(cate)}}</span>
        <el-icon 
          v-if="cateList.length > 1" 
          class="close-btn" 
          @click.prevent.stop="close(cate)"
        >
          <close-bold />
        </el-icon>
      </div>
    </el-button>
  </el-scrollbar>
  <tab-nav-context-menu ref="contextMenu" @toggle-fixed="fixed = !fixed" :fixed="fixed"/>
</template>

<script lang="ts" setup>
import {CloseBold} from '@element-plus/icons-vue'
</script>

<script lang="ts">
import Category from "@/dto/Category";
import DocUtils from "@/util/DocUtils";
import { defineComponent } from "vue";
import TabNavContextMenu from "./TabNavContextMenu.vue";
import CategoryService from '@/service/CategoryService';
import { ElScrollbar } from 'element-plus';

export default defineComponent({
  inject: ['showHeader'],
  emits: ['dbclick'],
  components: {
    TabNavContextMenu
  },
  data(){
    return {
      parentShowHeader: true,
      fixed: true,
      allCateList: [] as Category[]
    }
  },
  watch: {
    showHeader: {
      handler(val){
        this.parentShowHeader = val;
      },
      immediate: true,
    },
    currentCate() {
      this.$nextTick(() => {
        const activeTab = document.querySelector(`.tab-container-wrapper [url="${this.currentCate.link}"]`) as HTMLElement
        if (!activeTab) {
          return
        }
        activeTab.scrollIntoView()
      })
      
    }
    
  },
  mounted() {
    const dom  = document.querySelector('.tab-container-wrapper') as HTMLElement
    dom.addEventListener('wheel', (e: WheelEvent) => {
      dom.scrollTo(dom.scrollLeft + e.deltaY,0)
      e.stopPropagation()
      return e.preventDefault()
    })
  },
  async created() {
    this.allCateList = await CategoryService.getCategoryList()
  },
  methods: {
    docUrl2Id: DocUtils.docUrl2Id,
    cateName(url: string): string {
      const arr = this.docUrl2Id(url).split("-");
      return arr[arr.length - 1];
    },
    handleContextMenuEvent(cateLink: string, e: MouseEvent) {
      (this.$refs.contextMenu as any).show(cateLink, e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();
    },
    close(cateLink: string) {
      (this.$refs.contextMenu as InstanceType<typeof TabNavContextMenu>).close(cateLink)
    },
    findRootCategoryFirstLetter(cateLink: string): string {
      function findTarget(cateList: Category[]): Category | null {
        if (!cateList) {
          return null
        }
        for(let cate of cateList) {
          if (cate.link == cateLink) {
            return cate
          }
          const fromChildren = findTarget(cate.chidren)
          if (fromChildren) {
            return fromChildren
          }
        }
        return null
      }
      let root = findTarget(this.allCateList)
      if (!root) {
        return '📋'
      }
      return Array.from(root.name)[0] || '📋';
    }
  },
  computed: {
    cateList() {
      return this.$store.state.currentCategoryList;
    },
    currentCate(): Category {
      return this.$store.state.currentCategory;
    },
  },
});
</script>

<style lang="less" scoped>
.tab-container {
  transition: all 0.3s ease;
  // max-width: 60%;
  height: 40px;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  z-index: 999;
  padding: 4px 0;
  
  :deep(.el-scrollbar__bar.is-vertical) {
    display: none;
  }
  
  :deep(.el-scrollbar__wrap) {
    display: flex;
    align-items: center;
  }
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0,0,0,0.2);
  }
}

@media screen and(max-width: 1366px) {
  .tab-container {
    max-width: 44%;
  }
}

.nav-tab-item {
  display: inline-flex;
  align-items: center;
  height: 32px;
  min-width: 120px;
  max-width: 200px;
  margin: 0 4px;
  padding: 0 12px;
  background-color: var(--hover-bg-color);
  color: var(--secondary-text-color);
  font-size: 13px;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  
  &:first-child {
    margin-left: 8px;
  }
  
  &:last-child {
    margin-right: 8px;
  }
  
  &:hover {
    color: var(--main-text-color);
    background-color: var(--card-bg-color);
    border-color: var(--border-color);
    
    .close-btn {
      opacity: 1;
      visibility: visible;
    }
  }
  
  &.active {
    color: var(--primary-color);
    background-color: var(--card-bg-color);
    border-color: var(--border-color);
    border-bottom: 1px solid var(--card-bg-color) !important;
    font-weight: 500;
    
    .tab-category {
      background-color: var(--primary-color);
      color: white;
    }
  }
}

.tab-content {
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
}

.tab-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 6px;
}

.tab-category {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--primary-light-color);
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.close-btn {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-left: 6px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  color: var(--secondary-text-color);
  
  &:hover {
    background-color: var(--hover-bg-color);
    color: var(--main-text-color);
  }
}

body[theme="dark"] {
  
  .nav-tab-item {
    background-color: var(--dark-hover-bg-color);
    color: var(--dark-secondary-text-color);
    border-color: var(--default-dark-border-color);
    
    &:hover {
      color: var(--dark-text-color);
      background-color: var(--dark-card-bg-color);
      border-color: var(--default-dark-border-color);
    }
    
    &.active {
      color: var(--primary-color);
      background-color: var(--dark-card-bg-color);
      border-color: var(--default-dark-border-color);
      border-bottom: 1px solid var(--dark-card-bg-color) !important;
    }
  }
  
  .close-btn {
    &:hover {
      background-color: var(--dark-hover-bg-color);
      color: var(--dark-text-color);
    }
  }
}
</style>