<template>
  <el-skeleton
    :rows="24"
    animated
    :loading="loading"
    :throttle="50"
    style="max-width: 80%; padding: 20px"
  >
    <template #default>
      <el-menu
        :unique-opened="false"
        :default-active="doc"
        :router="true"
        :background-color="isDark ? 'var(--second-dark-bg-color)' : ''"
        :text-color="isDark ? 'var(--main-dark-text-color)' : ''"
        @open="handleOpen"
      >
        <CategoryTree :menuList="cateList" @contextmenu="handleContextMenu"/>
      </el-menu>
    </template>
  </el-skeleton>
  <link-popover ref="linkPopover"/>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import categoryService from "@/service/CategoryService";
import docService from "@/service/DocService";
import Category from "@/dto/Category";
import CategoryTree from "./CategoryTree.vue";
import LinkPopover from '@/pages/doc/LinkPopover.vue'

export default defineComponent({
  props: {
    doc: String,
  },
  components: {
    CategoryTree,
    LinkPopover
  },
  emits: ['firstLoad'],
  setup() {},
  data() {
    return {
      cateList: [] as Category[],
      activeMenu: "" as string,
      loading: true as boolean,
      loaded: false
    };
  },
  watch: {
    doc() {
      this.markShowCateChain()
    }
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    },
  },
  methods: {
    handleOpen(index: string) {
      this.$store.commit('addOpenedMenu', index)
      console.log(index)
      if (!this.loaded) {
        this.loaded = true
        this.$emit('firstLoad')
      }
    },
    handleContextMenu(e: MouseEvent,link: string) {
      (this.$refs.linkPopover as any).show(link, e.clientX, e.clientY)
      e.preventDefault()
    },
    showDoc(index: string) {
      this.updateCurrentCategory(index);
      this.$router.push("/doc/" + index);
    },
    findCategoryById(doc: string) {
      const arr = doc.split("-");
      const cateList = [...this.cateList];
      while (cateList.length > 0) {
        const cate = cateList.pop();
        if (docService.docUrl2Id(cate!.link) == doc) {
          return cate;
        }
        cateList.push(...cate!.chidren);
      }
      return null;
    },
    updateCurrentCategory(doc: string) {
      const currentCate = this.findCategoryById(doc);
      if (!currentCate) {
        console.warn(`${this.doc} 无法找寻到相关目录!`);
      } else {
        this.$store.commit("setCurrentCategory", currentCate);
      }
    },
    // 标记当前目录展示链
    markShowCateChain() {
      let cate = this.findCategoryById(this.doc!)
      console.log(cate)
      while(cate) {
        cate.show = true
        cate = cate.parent
      }
    }
  },
  async created() {
    this.loading = true
    this.cateList = await categoryService.getCompiledCategoryList()
    this.markShowCateChain()
    this.updateCurrentCategory(this.doc!)
    this.$nextTick(() => {
      this.loading = false;
    });
    this.loading = false;
  },
});
</script>

<style lang="less" scoped>
.el-skeleton {
  padding: var(--spacing-sm);
}

.el-menu {
  border-right: none;
  background-color: transparent;
  padding: 0;
}

body[theme="dark"] {
  .el-menu {
    background-color: transparent;
  }
}
</style>
