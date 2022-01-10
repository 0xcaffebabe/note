<template>
  <el-popover
    placement="right-start"
    :width="200"
    trigger="hover"
    :hide-after="100"
    @show="handlePopoverShow"
    @hide="handlePopoverHide"
    :disabled="!value.link"
  >
    <template #reference>
      <el-menu-item
        :index="convert(value.link)"
        @click="handleMenuItemClick(value)"
        :class="{ hilight: isParent }"
        :disabled="!value.link"
      >
        <template #title>
          <div>
            <span>{{ value.name }}</span>
          </div>
        </template>
      </el-menu-item>
    </template>
    <category-item-content
      v-if="value.link"
      :category-name="value.name"
      :category-link="value.link"
      ref="categoryItemContent"
    />
  </el-popover>
</template>

<script lang="ts">
import Category from "@/dto/Category";
import { defineComponent, PropType } from "vue";
import DocService from "@/service/DocService";
import CategoryItemContent from "./CategoryItemContent.vue";

export default defineComponent({
  components: {
    CategoryItemContent,
  },
  props: {
    value: {
      type: Category as PropType<Category>,
      required: true,
    },
    isParent: {
      type: Boolean,
      deault: false,
    },
  },
  data() {
    return {
      pastDays: 999,
    };
  },
  methods: {
    // 将doc链接转为 x-x-x 形式的id
    convert(link: string): string {
      return DocService.docUrl2Id(link);
    },
    async handlePopoverShow() {
      (this.$refs.categoryItemContent as any).init();
    },
    handlePopoverHide() {
      (this.$refs.categoryItemContent as any).destroy();
    },
    handleMenuItemClick(value: Category) {
      this.$store.commit("setCurrentCategory", value);
    }
  },
});
</script>

<style lang="less" scoped>
.hilight {
  font-weight: 650;
}

.newly-flag :deep(.el-badge__content) {
  vertical-align: middle;
  margin-left: 8px;
}

body[theme="dark"] {
  .el-menu-item:hover {
    background-color: var(--main-dark-bg-color);
  }
}
</style>

<style lang="less">
body[theme="dark"] {
  .el-popover {
    background-color: var(--second-dark-bg-color);
    border: 1px solid var(--default-dark-border-color) !important;
    color: var(--main-dark-text-color);
  }
}
</style>