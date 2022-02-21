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
        type="default"
        size="mini"
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
import { ArrowLeftBold, ArrowRightBold } from "@element-plus/icons";

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
      const activeMenuPos: number = activeMenu.getBoundingClientRect().y;
      const amount = activeMenuPos < 350 ? -50 : 50;
      let timer = setInterval(() => {
        const activeMenuPos1: number = activeMenu.getBoundingClientRect().y;
        if (
          (activeMenuPos1 >= 350 &&
            activeMenuPos1 <= categoryWrapper.offsetHeight) ||
          categoryWrapper.scrollTop + amount < 0
        ) {
          clearInterval(timer);
          return;
        }
        categoryWrapper.scrollTo(0, categoryWrapper.scrollTop + amount);
      }, 4);
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
  overflow-y: hidden;
  width: 280px;
}
.category-wrapper:hover {
  overflow-y: scroll;
}
.cate-fix-btn {
  padding: 7px 2px;
  margin-left: 26px;
}
.el-affix .active {
  margin-left: -26px;
}
</style>