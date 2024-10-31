<template>
  <div ref="root" v-show="showAside">
    <el-aside width="280px" :lock-scroll="false">
      <div
        class="category-wrapper"
        :style="{ height: parentShowHeader ? 'calc(100% - 60px)' : '100%' }"
      >
        <keep-alive>
          <category-list ref="categoryList" :doc="doc" />
        </keep-alive>
      </div>
    </el-aside>
  </div>
    <el-affix :offset="384" style="height: 100px">
      <el-button
        class="cate-fix-btn"
        type="primary"
        size="small"
        @click="$emit('toggleAside')"
        :class="{ active: showAside }"
      >
        <el-icon>
          <arrow-left-bold v-if="showAside" />
          <arrow-right-bold v-else />
        </el-icon>
      </el-button>
    </el-affix>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CategoryList from "../category/CategoryList.vue";
import { ArrowLeftBold, ArrowRightBold } from "@element-plus/icons-vue";

export default defineComponent({
  components: {
    CategoryList,
    ArrowLeftBold,
    ArrowRightBold,
  },
  emits: ["toggleAside"],
  inject: ["showHeader"],
  props: {
    showAside: Boolean,
    doc: String,
  },
  data() {
    return {
      parentShowHeader: true,
    };
  },
  methods: {
    // 移动目录的滚动条 让当前选中菜单项处于可视区域
    syncCategoryListScrollBar() {
      const document = this.$refs.root as HTMLElement;
      const categoryWrapper: HTMLElement =
        document.querySelector(".category-wrapper")!;
      const activeMenu: HTMLElement = document.querySelector(
        ".el-menu-item.is-active"
      ) as HTMLElement;
      if (!activeMenu) {
        return
      }
      const y = activeMenu.getBoundingClientRect().y
      if (y > 0 && y < window.innerHeight) {
        return
      }
      activeMenu.scrollIntoView({behavior: 'smooth'})
    },
    updateCurrentCategory(doc: string) {
      const categoryListRef: any = this.$refs.categoryList;
      categoryListRef.updateCurrentCategory(doc);
    },
  },
  watch: {
    showHeader: {
      handler(val) {
        this.parentShowHeader = val;
      },
      immediate: true,
    },
  },
  setup() {},
});
</script>


<style lang="less" scoped>
.category-wrapper {
  transition: all 0.2s;
  position: fixed;
  overflow-y: scroll;
  width: 280px;
  box-shadow: 5px 0 5px -5px #bbb;
}
.cate-fix-btn {
  padding: 10px 8px;
  margin-left: 26px;
  box-shadow: 2px 2px 5px #bbb;
}
.el-affix .active {
  margin-left: 10px;
}
body[theme=dark] {
  .category-wrapper {
    box-shadow: 5px 0 13px -5px #111;
  }
  .cate-fix-btn{
    box-shadow: 2px 2px 5px #111;
  }
}
</style>