<template>
  <div class="tab-container">
    <el-button
      size="mini"
      v-for="cate in cateList"
      :key="cate"
      @contextmenu="handleContextMenuEvent(cate, $event)"
      :type="
        docUrl2Id(currentCate.link) == docUrl2Id(cate) ? 'primary' : 'default'
      "
      @click="$router.push('/doc/' + docUrl2Id(cate))"
    >
      {{ cateName(cate) }}
    </el-button>
  </div>
  <tab-nav-context-menu ref="contextMenu"/>
</template>

<script lang="ts">
import Category from "@/dto/Category";
import DocUtils from "@/util/DocUtils";
import { defineComponent } from "vue";
import TabNavContextMenu from "./TabNavContextMenu.vue";

export default defineComponent({
  components: {
    TabNavContextMenu
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
  width: 72%;
  height: 30px;
  white-space: nowrap;
  overflow-x: hidden;
  overflow-y: hidden;
  margin-bottom: 10px;
}
.tab-container::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}
.tab-container:hover {
  overflow-x: auto;
}
</style>