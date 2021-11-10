<template>
  <el-popover
    placement="right-start"
    :width="200"
    trigger="hover"
    :hide-after="100"
    @show="handlePopoverShow"
    @hide="handlePopoverHide"
    content="this is content, this is content, this is content"
  >
    <template #reference>
      <el-menu-item
        :index="convert(value.link)"
        @click="handleMenuItemClick(value)"
        :class="{ hilight: isParent }"
      >
        <template #title>
          <span>{{ value.name }}</span>
        </template>
      </el-menu-item>
    </template>
    <div>
      <el-skeleton :rows="1" animated :loading="loading" :throttle="500">
        <template #default>
          <p>{{ value.name }}</p>
          <el-badge
            :value="lastPastDays + '天前更新'"
            class="item"
            type="warning"
          ></el-badge>
          <el-badge
            :value="wordCount + '字'"
            class="item"
            type="primary"
          ></el-badge>
          <div>
            <el-tag
              v-for="item in tags"
              :key="item"
              size="mini"
              :type="calcTagType(item)"
              @click="$router.push('/tag?tag=' + item)"
              effect="dark"
              >{{ item }}</el-tag
            >
          </div>
        </template>
      </el-skeleton>
    </div>
  </el-popover>
</template>

<script lang="ts">
import Category from "@/dto/Category";
import { defineComponent, PropType } from "vue";
import categoryService from "@/service/CategoryService";
import api from "@/api";
import DocFileInfo from "@/dto/DocFileInfo";
import { cleanText } from "@/util/StringUtils";
import DocService from "@/service/DocService";
import TagUtils from "@/pages/tag/TagUtils";

export default defineComponent({
  props: {
    value: Object as PropType<Category>,
    isParent: {
      type: Boolean,
      deault: false,
    },
  },
  data() {
    return {
      loading: true as boolean,
      file: null as DocFileInfo | null,
      // 标签
      tags: [] as string[],
      // 离最后一次更新过去几天
      lastPastDays: 0 as number,
    };
  },
  computed: {
    wordCount() {
      return cleanText(this.file?.content).length;
    },
  },
  setup() {},
  methods: {
    calcTagType(tag: string): string {
      return TagUtils.calcTagType(tag);
    },
    // 将doc链接转为 x-x-x 形式的id
    convert(link: string): string {
      return DocService.docUrl2Id(link);
    },
    async handlePopoverShow() {
      this.file = await api.getDocFileInfo(this.convert(this.value!.link));
      this.tags = DocService.resolveTagList(this.file);
      this.lastPastDays = this.calcLastUpdate();
      this.loading = false;
    },
    handlePopoverHide() {
      this.loading = true;
    },
    handleMenuItemClick(value: Category) {
      this.$store.commit("setCurrentCategory", value);
    },
    calcLastUpdate() {
      if (!this.file) {
        return -1;
      }
      const lastUpdateDate = this.file.commitList
        .map((v) => v.date)
        .map(Date.parse)
        .sort((a, b) => a - b)
        .reverse()[0];
      return Math.ceil(
        (new Date().getTime() - lastUpdateDate) / (3600 * 24 * 1000)
      );
    },
  },
});
</script>

<style lang="less" scoped>
.hilight {
  font-weight: 650;
}
.el-tag {
  cursor: pointer;
  margin-left: 4px;
  margin-bottom: 4px;
}
</style>