<template>
  <div class="doc-tags">
    <el-popover
    popper-class="tag-popover"
    :width="400"
    v-for="item in tagList"
    :key="item"
    trigger="hover"
    @show="handleChpaterShow(item)"
  >
    <template #reference>
      <el-tag
      size="small"
      :type="calcTagType(item)"
      @click="$router.push('/tag?tag=' + item)"
      effect="dark"
      >{{ item }}
        <span v-if="predictTags.indexOf(item) != -1 && tags.indexOf(item) == -1">(预测)</span>
      </el-tag
    >
    </template>
    <div style="height:220px;overflow-y:scroll">
      <tag-chapter-zone :chapters="chapters"/>
    </div>
  </el-popover>
    
  </div>
</template>

<script lang="ts" setup>
import TagChapterZone from '@/platform/web/pages/tag/TagChapterZone.vue'
</script>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import TagUtils from "@/core/util/TagUtils";

const SIMLIARY_DOC = '相关文档'

export default defineComponent({
  props: {
    tags: {
      required: true,
      type: Object as PropType<string[]>
    },
    doc: {
      required: true,
      type: String
    }
  },
  watch: {
    async doc() {
      this.simliaryDoc = await this.$services.docService.getSimliarDoc(this.doc)
      this.predictTags = await this.$services.tagService.getPredictTag(this.doc)
    }
  },
  data() {
    return {
      tag: '',
      simliaryDoc: [] as string[],
      predictTags: [] as string[],
    }
  },
  computed: {
    tagList() {
      if (!this.tags) {
        return [SIMLIARY_DOC, ...this.predictTags]
      }
      return [SIMLIARY_DOC, ...this.tags, ...(this.predictTags.filter(v => this.tags.indexOf(v) == -1))]
    },
    chapters() {
      if (!this.tag) {
        return []
      }
      if (this.tag == SIMLIARY_DOC) {
        return this.simliaryDoc
      }
      return this.$services.tagService.getListByTag(this.tag)
    }
  },
  async mounted() {
    this.simliaryDoc = (await this.$services.docService.getSimliarDoc(this.doc)).reverse()
    this.predictTags = await this.$services.tagService.getPredictTag(this.doc)
  },
  methods: {
    // 计算标签的颜色
    calcTagType(tag: string): string {
      return TagUtils.calcTagType(tag);
    },
    handleChpaterShow(tag: string) {
      this.tag = tag
    }
  }
});
</script>

<style lang="less" scoped>
.doc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  // 与正文版心及其内边距一致，宽度随阅读区域和视口变化。
  max-width: var(--reading-measure);
  margin: 0 auto 4px;
  padding-inline: var(--spacing-xl);
}

@media (max-width: @bp-mobile) {
  .doc-tags {
    padding-inline: var(--spacing-sm);
  }
}

.el-tag {
  cursor: pointer;
}

</style>
<style lang="less">
.tag-popover {
  z-index: var(--z-popup) !important;
}
</style>
