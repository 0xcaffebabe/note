<template>
  <el-drawer
    v-model="showCategory"
    direction="rtl"
    :with-header="false"
    size="64%"
    :close-on-click-modal="true"
    :append-to-body="false"
    custom-class="category-drawer"
  >
    <div class="category-wrapper" style="height:100%">
      <category-list :doc="doc" @first-load="handleFirstLoad"/>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CategoryList from "../../category/CategoryList.vue";
import { ArrowRightBold } from "@element-plus/icons-vue";

export default defineComponent({
  props: {
    doc: {
      required: true,
      type: String,
    },
  },
  computed: {
    showCategory: {
      get() {
        return this.$store.state.showCategory
      },
      set(newVal: boolean) {
        this.$store.commit('setShowCategory', newVal)
      }
    }
  },
  watch: {
    showCategory() {
      if (this.showCategory) {
        this.$nextTick(() => {
          this.syncCategoryListScrollBar()
        })
      }
    }
  },
  methods: {
    handleFirstLoad() {
      this.$nextTick(() => {
        this.syncCategoryListScrollBar()
      })
    },
    // 移动目录的滚动条 让当前选中菜单项处于可视区域
    syncCategoryListScrollBar() {
      const categoryWrapper: HTMLElement =
        document.querySelector('.el-drawer__body')!
      const activeMenu: HTMLElement = document.querySelector(
        ".el-menu-item.is-active"
      ) as HTMLElement;
      const activeMenuPos: number = activeMenu.getBoundingClientRect().y;
      const amount = activeMenuPos < 350 ? -50 : 50;
      let timer = setInterval(() => {
        const activeMenuPos1: number = activeMenu.getBoundingClientRect().y;
        if (
          (activeMenuPos1 >= 350 &&
            activeMenuPos1 <= categoryWrapper.offsetHeight - 350) ||
          categoryWrapper.scrollTop + amount < 0
        ) {
          clearInterval(timer);
          return;
        }
        categoryWrapper.scrollTo(0, categoryWrapper.scrollTop + amount);
      }, 4);
    },
  },
  components: { CategoryList, ArrowRightBold },
  data() {
    return {
    };
  },
});
</script>

<style lang="less">
.category-drawer .el-drawer__body {
  padding: 0 !important;
}
</style>
<style lang="less" scoped>
.category-wrapper {
  height: 100%;
  min-width: 64%;
}
.cate-fix-btn {
  padding: 10px 8px;
  margin-left: -13px;
}
</style>