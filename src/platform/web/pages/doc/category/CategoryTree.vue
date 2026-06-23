<template>
  <template v-for="value in menuList">
    <el-sub-menu
      :index="convert(value) + 'p'"
      v-if="value.chidren.length != 0"
      :key="convert(value) + 'p'"
    >
      <template #title>
        <div>
          <span v-html="renderName(value)"></span>
          <el-badge
            :max="500"
            :value="childrenSize(value)"
            class="item"
            type="primary"
            style="margin-left: 8px"
          />
        </div>
      </template>
      <category-item :value="value" v-if="value.link" :isParent="true" @contextmenu="handleContextMenu($event, value.link)" :title="value.link"/>
      <!-- 如果当前菜单没有展开 则不渲染子菜单 -->
      <category-tree v-if="value.show || currentOpenedMenu.has(convert(value) + 'p')" :menuList="value.chidren" :filterText="filterText" @contextmenu="handleContextMenu"></category-tree>
    </el-sub-menu>
    <!-- 过滤态叶子节点 名称需要高亮 改为内联渲染 -->
    <el-menu-item
      v-else-if="filterText"
      :index="convert(value)"
      :key="convert(value) + 'f'"
      :disabled="!value.link"
      @click="handleFilteredItemClick(value)"
      @contextmenu="handleContextMenu($event, value.link)"
    >
      <template #title>
        <div>
          <span v-html="renderName(value)"></span>
        </div>
      </template>
    </el-menu-item>
    <category-item v-else :value="value" :key="convert(value)" @contextmenu="handleContextMenu($event, value.link)"/>
  </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Category from "@/core/domain/Category";
import CategoryItem from './CategoryItem.vue'
import { hashCode, escapeAttr, escapeRegExp } from '@/core/util/StringUtils'

export default defineComponent({
  components: {
    CategoryItem
  },
  props: {
    menuList: {
      type: Array as PropType<Category[]>,
      required: true
    },
    // 过滤关键词 非空时叶子节点内联渲染并对命中名称做高亮
    filterText: {
      type: String,
      default: ''
    },
  },
  emits: ['contextmenu'],
  data() {
    return {
      currentOpenedMenu: this.$store.state.currentOpenedMenu
    }
  },
  methods: {
    uuid(): string {
      return Math.random().toString();
    },
    // 生成目录的唯一ID
    convert(category: Category): string {
      if (category.link) {
        return this.$services.docService.docUrl2Id(category.link);
      }
      return category.name + '-' + hashCode(category.name)
    },
    handleContextMenu(e: MouseEvent, link: string) {
      this.$emit('contextmenu', e, link)
    },
    // 过滤态叶子节点点击 与CategoryItem行为保持一致
    handleFilteredItemClick(value: Category) {
      this.$store.commit("setCurrentCategory", value);
    },
    // 渲染目录名: 字面命中部分用mark高亮 仅拼音命中(无法定位字面位置)时整个名称用主色显示
    renderName(value: Category): string {
      const name = escapeAttr(value.name || '')
      const kw = (this.filterText || '').trim()
      if (!kw) {
        return name
      }
      let literalHit = false
      let html = name
      for (const k of kw.split(" ").filter(v => v)) {
        const reg = new RegExp(escapeRegExp(escapeAttr(k)), 'gi')
        html = html.replace(reg, (str: string) => {
          literalHit = true
          return `<mark>${str}</mark>`
        })
      }
      if (literalHit) {
        return html
      }
      // 自身经拼音(或链接)命中 整名主色提示
      if (this.$services.categoryService.categoryIsMatch(value, kw)) {
        return `<span class="pinyin-hit">${name}</span>`
      }
      return name
    },
    handleChildrenContextMenu(e: MouseEvent, link: string) {

    },
    childrenSize(value: Category): number {
      return Category.childrenSize(value)
    },
  },
  setup() {},
});
</script>

<style lang="less" scoped>
.el-menu-item.is-active {
  transition: all 0.2s;
  background-color: var(--primary-light-color) !important;
  border-left: 3px solid var(--primary-color);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

:deep(.el-sub-menu__title *) {
  vertical-align: middle!important;
}

:deep(.el-menu) {
  border-right: none;
  background-color: transparent;
}

:deep(.el-menu-item) {
  border-radius: var(--radius-sm);
  margin: 2px 8px;
  transition: all 0.2s ease;
  height: 40px;
  display: flex;
  align-items: center;

  &:hover {
    background-color: var(--hover-bg-color);
  }
}

:deep(.el-sub-menu__title) {
  border-radius: var(--radius-sm);
  margin: 2px 8px;
  transition: all 0.2s ease;
  height: 40px;
  display: flex;
  align-items: center;

  &:hover {
    background-color: var(--hover-bg-color);
  }
}

// 过滤命中高亮: 字面命中片段
:deep(mark) {
  background-color: var(--primary-light-color);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
}

// 过滤命中高亮: 拼音命中无法定位字面位置 整名主色
:deep(.pinyin-hit) {
  color: var(--primary-color);
}

// 暗色专属: 仅暗色把EP默认0.3s的箭头旋转过渡缩短为0.2s 非颜色样式无法令牌化 并入亮色会改变亮色动效
body[theme=dark] {
  :deep(.el-sub-menu__icon-arrow) {
    transition: transform 0.2s ease;
  }
}
</style>