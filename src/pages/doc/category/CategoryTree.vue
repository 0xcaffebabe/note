<template>
  <template v-for="value in menuList">
    <el-sub-menu
      :index="convert(value.link) + 'p'"
      v-if="value.chidren.length != 0"
      :key="convert(value.link) + 'p'"
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
      <category-item :value="value" :isParent="true"/>

      <category-tree :menuList="value.chidren"></category-tree>
    </el-sub-menu>
    <category-item v-else :value="value" :key="convert(value.link)"/>
  </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Category from "@/dto/Category";
import CategoryItem from './CategoryItem.vue'
import DocService from "@/service/DocService";

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
  methods: {
    uuid(): string {
      return Math.random().toString();
    },
    // 将doc链接转为 x-x-x 形式的id
    convert(link: string): string {
      return DocService.docUrl2Id(link);
    },
    childrenSize(value: Category): number {
      if (value.chidren.length == 0) {
        return 0;
      }
      let size: number = value.chidren.length;
      for (let i of value.chidren) {
        size += this.childrenSize(i);
      }
      return size;
    },
  },
  setup() {},
});
</script>

<style lang="less" scoped>
.el-menu-item.is-active {
  transition: all 0.2s;
  border-left: 4px solid #409eef;
  padding-left: 36px !important;
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