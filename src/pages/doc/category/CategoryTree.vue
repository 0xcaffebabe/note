<template>
  <template v-for="value in menuList">
    <el-sub-menu
      :index="convert(value) + 'p'"
      v-if="value.chidren.length != 0"
      :key="convert(value) + 'p'"
    >
      <template #title>
        <div>
          <span>{{ value.name }}</span>
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
      <category-tree v-if="value.show || currentOpenedMenu.has(convert(value) + 'p')" :menuList="value.chidren" @contextmenu="handleContextMenu"></category-tree>
    </el-sub-menu>
    <category-item v-else :value="value" :key="convert(value)" @contextmenu="handleContextMenu($event, value.link)"/>
  </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Category from "@/dto/Category";
import CategoryItem from './CategoryItem.vue'
import DocService from "@/service/DocService";

function hashCode(str: string){
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+code;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

export default defineComponent({
  components: {
    CategoryItem
  },
  props: {
    menuList: {
      type: Array as PropType<Category[]>,
      required: true
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
        return DocService.docUrl2Id(category.link);
      }
      return category.name + '-' + hashCode(category.name)
    },
    handleContextMenu(e: MouseEvent, link: string) {
      this.$emit('contextmenu', e, link)
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
  border-left: 4px solid #409eef;
}
:deep(.el-sub-menu__title *) {
  vertical-align: middle!important;
}

body[theme=dark] {
  .el-menu-item:hover {
    background-color: var(--main-dark-bg-color);
  }
  :deep(.el-sub-menu .el-sub-menu__title:hover) {
    background-color: var(--main-dark-bg-color)!important;
  }
  :deep(.el-icon.el-sub-menu__icon-arrow) {
    background-color: var(--main-dark-text-color)!important;
  }
}
</style>

<style lang="less">
body[theme=dark] {
  .el-sub-menu .el-sub-menu__title:hover {
    background-color: var(--main-dark-bg-color)!important;
  }
}
</style>