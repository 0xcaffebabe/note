<template>
  <el-scrollbar wrap-class="tab-container-wrapper" class="tab-container" ref="tabContainer" :style="{top: parentShowHeader? 66 + 'px': 6 + 'px', position: fixed? 'fixed': 'absolute'}">
    <el-button
      class="nav-item"
      size="small"
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
      <div>
      {{ cateName(cate) }}
      <span class="nav-item-sign">{{findRootCategoryFirstLetter(cate)}}</span>
      <span class="close-btn" @click.prevent.stop="close(cate)" v-if="cateList.length > 1">
        <el-icon><close-bold /></el-icon>
      </span>
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
      while(root.parent) {
        root = root?.parent
      }
      for(let i of root.name) {
        return i
      }
      return root.name.substring(0, 1)

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
  transition: all 0.2s;
  max-width: 60%;
  height: 32px;
  white-space: nowrap;
  overflow-x: hidden;
  overflow-y: hidden;
  z-index: 999;
  :deep(.el-scrollbar__bar.is-vertical) {
    display: none;
  }
}

@media screen and(max-width: 1366px) {
  .tab-container {
    max-width: 44%;
  }
}

.nav-item {
  display: inline-block;
  position: relative;
  cursor: pointer;
  border-radius: 0;
  border-right-width: 0;
  padding: 0px 28px;
  height: 28px;
  font-size: 14px;
  margin-left: 0!important;
  .close-btn {
    position: absolute;
    right: 10px;
    bottom: 4px;
    display: none;
    border-radius: 4px;
  }
  .nav-item-sign {
    position: absolute;
    left: 8px;
    font-weight: 700;
    color: #ddf;
  }
  .close-btn:hover {
    background-color: #ddd;
  }
}
.nav-item:last-child {
  border-right-width: 1px !important;
}
.nav-item.active {
  background: rgba(64,158,255,.8);
  color: white;
  .close-btn {
    display: inline-block;
  }
}
.nav-item:hover {
  background: rgba(64,158,255,.8);
  color: white;
  .close-btn {
    display: inline-block;
  }
}
body[theme="dark"] {
  .nav-item {
    background-color: var(--second-dark-bg-color);
    color: var(--main-dark-text-color);
  }
  .nav-item.active {
    background-color: var(--main-dark-bg-color);
  }
  .nav-item:hover {
    background-color: var(--main-dark-bg-color);
  }
}
</style>