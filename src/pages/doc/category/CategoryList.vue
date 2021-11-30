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
      >
        <CategoryTree :menuList="cateList" />
      </el-menu>
    </template>
  </el-skeleton>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import categoryService from "@/service/CategoryService";
import docService from "@/service/DocService";
import Category from "@/dto/Category";
import CategoryTree from "./CategoryTree.vue";

export default defineComponent({
  props: {
    doc: String,
  },
  components: {
    CategoryTree,
  },
  setup() {},
  data() {
    return {
      cateList: [] as Category[],
      activeMenu: "" as string,
      loading: true as boolean,
    };
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    },
  },
  methods: {
    handleOpen(index: string) {
      if (index) {
        console.log(index);
        // 由于带有孩子目录的父级目录的index后缀带了一个p 所有这里要去掉
        const doc = index.substring(0, index.length - 1);
        this.showDoc(doc);
      }
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
  },
  async created() {
    this.loading = true;
    this.cateList = await categoryService.getCategoryList();
    this.updateCurrentCategory(this.doc!);
    this.$nextTick(() => {
      this.loading = false;
    });
    this.loading = false;
  },
});
</script>

<style lang="less" scoped>
body[theme="dark"] {
  .el-menu {
    border-right-color: var(--default-dark-border-color) !important;
  }
}
</style>
