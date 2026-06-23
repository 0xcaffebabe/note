<template>
  <el-skeleton
    :rows="24"
    animated
    :loading="loading"
    :throttle="50"
    style="max-width: 80%; padding: 20px"
  >
    <template #default>
      <!-- 目录内联过滤 -->
      <div class="category-filter">
        <el-input
          v-model="filterText"
          placeholder="筛选目录"
          clearable
          :prefix-icon="Search"
        />
      </div>
      <!-- key随过滤词变化重建菜单 使default-openeds在过滤时自动展开匹配路径 -->
      <el-menu
        :key="trimmedFilter ? 'filter:' + trimmedFilter : 'no-filter'"
        :unique-opened="false"
        :default-active="doc"
        :default-openeds="filterOpeneds"
        :background-color="isDark ? 'var(--card-bg-color)' : ''"
        :text-color="'var(--main-text-color)'"
        @open="handleOpen"
        @select="handleSelect"
      >
        <CategoryTree :menuList="displayCateList" :filterText="trimmedFilter" @contextmenu="handleContextMenu"/>
      </el-menu>
    </template>
  </el-skeleton>
  <link-popover ref="linkPopover"/>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Category from "@/core/domain/Category";
import CategoryTree from "./CategoryTree.vue";
import LinkPopover from '@/platform/web/pages/doc/LinkPopover.vue'
import { Search } from "@element-plus/icons-vue";
import { hashCode } from "@/core/util/StringUtils";
import { filterCategoryTree } from "@/core/util/CategoryUtils";

export default defineComponent({
  props: {
    doc: String,
  },
  components: {
    CategoryTree,
    LinkPopover
  },
  emits: ['firstLoad'],
  setup() {
    return { Search };
  },
  data() {
    return {
      cateList: [] as Category[],
      activeMenu: "" as string,
      loading: true as boolean,
      loaded: false,
      filterText: "" as string
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
    trimmedFilter(): string {
      return this.filterText.trim();
    },
    // 过滤后的目录树: 只保留自身匹配或后代匹配的节点 无过滤词时返回原树
    displayCateList(): Category[] {
      if (!this.trimmedFilter) {
        return this.cateList;
      }
      return this.filterTree(this.cateList, this.trimmedFilter);
    },
    // 过滤时需要默认展开的菜单index列表(匹配路径全展开)
    filterOpeneds(): string[] {
      if (!this.trimmedFilter) {
        return [];
      }
      const res: string[] = [];
      const walk = (list: Category[]) => {
        for (const cate of list) {
          if (cate.chidren.length != 0) {
            res.push(this.convertMenuIndex(cate) + 'p');
            walk(cate.chidren);
          }
        }
      };
      walk(this.displayCateList);
      return res;
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
    // menu index是文档id 由路由统一重定向到.html规范地址
    // 不用el-menu的router模式: history路由下相对路径push会按当前.html路径错误解析
    handleSelect(index: string) {
      this.$router.push("/doc/" + index);
    },
    handleContextMenu(e: MouseEvent,link: string) {
      (this.$refs.linkPopover as any).show(link, e.clientX, e.clientY)
      e.preventDefault()
    },
    // 过滤目录树 保留自身匹配或后代匹配的节点 返回克隆节点避免污染原树
    filterTree(list: Category[], kw: string): Category[] {
      return filterCategoryTree(list, c => this.$services.categoryService.categoryIsMatch(c, kw), true);
    },
    // 生成菜单index 逻辑与CategoryTree.convert保持一致
    convertMenuIndex(category: Category): string {
      if (category.link) {
        return this.$services.docService.docUrl2Id(category.link);
      }
      return category.name + '-' + hashCode(category.name);
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
        if (this.$services.docService.docUrl2Id(cate!.link) == doc) {
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
    this.cateList = await this.$services.categoryService.getCompiledCategoryList()
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

// 目录过滤输入框 贴合侧边栏卡片视觉
.category-filter {
  padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-xs);

  // 与顶栏搜索框同款视觉: 浅底 + 描边 + 聚焦主色光环
  :deep(.el-input__wrapper) {
    height: 36px;
    border-radius: var(--radius-lg);
    background-color: var(--main-bg-color);
    box-shadow: none;
    border: 1px solid var(--border-color);
    padding-left: var(--spacing-sm);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

    &:hover {
      border-color: var(--primary-color);
    }

    &.is-focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 15%, transparent);
    }
  }

  :deep(.el-input__inner) {
    font-size: var(--font-size-base);
    color: var(--main-text-color);
  }
}
</style>
