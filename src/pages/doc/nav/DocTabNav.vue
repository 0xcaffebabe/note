<template>
  <div class="tab-container" ref="tabContainer" :style="{top: parentShowHeader? 66 + 'px': 6 + 'px', position: fixed? 'fixed': 'absolute'}">
    <el-button
      class="nav-item"
      size="mini"
      v-for="cate in cateList"
      :key="cate"
      @contextmenu="handleContextMenuEvent(cate, $event)"
      :type="
        docUrl2Id(currentCate.link) == docUrl2Id(cate) ? 'primary' : 'default'
      "
      @click="$router.push('/doc/' + docUrl2Id(cate))"
      @dblclick="$emit('dbclick')"
    >
      {{ cateName(cate) }}
    </el-button>
  </div>
  <tab-nav-context-menu ref="contextMenu" @toggle-fixed="fixed = !fixed" :fixed="fixed"/>
</template>

<script lang="ts">
import Category from "@/dto/Category";
import DocUtils from "@/util/DocUtils";
import { defineComponent } from "vue";
import TabNavContextMenu from "./TabNavContextMenu.vue";

export default defineComponent({
  inject: ['showHeader'],
  emits: ['dbclick'],
  components: {
    TabNavContextMenu
  },
  data(){
    return {
      parentShowHeader: true,
      fixed: true
    }
  },
  watch: {
    showHeader: {
      handler(val){
        this.parentShowHeader = val;
      },
      immediate: true,
    }
    
  },
  mounted() {
    const dom  = this.$refs.tabContainer as HTMLElement
    dom.addEventListener('wheel', (e: WheelEvent) => {
      dom.scrollTo(dom.scrollLeft + e.deltaY,0)
      e.stopPropagation()
      return e.preventDefault()
    })
  },
  setup() {},
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
  box-shadow: 2px 0 13px #bbb;
}
.tab-container::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}
.tab-container:hover {
  overflow-x: auto;
}
.nav-item {
  padding: 10px 14px;
  margin: 0;
  border-radius: 1px;
}
body[theme="dark"] {
  .tab-container {
    box-shadow: 2px 0 13px #111;
  }
}
</style>