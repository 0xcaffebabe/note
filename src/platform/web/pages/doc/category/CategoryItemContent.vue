<template>
  <div class="container">
    <el-skeleton :rows="1" animated :loading="loading" :throttle="500">
      <template #default>
        <p>{{ filename }}</p>
        <p class="full-id" :title="docId">
          <el-link :href="'/doc/' + docId" @click.prevent="$router.push('/doc/' + docId)" type="primary">{{ docId }}</el-link>
        </p>
        <el-badge
          :value="'⏰' + lastPastDays + '天前更新'"
          class="item"
          :type="calcUpdateType(lastPastDays)"
        ></el-badge>
        <el-badge
          :value="'✏️' + wordCount + '字'"
          class="item"
          type="primary"
        ></el-badge>
        <el-badge
          :value="'⚽' + quality"
          class="item"
          type="warning"
        ></el-badge>
        <tag-list :tags="tags" :doc="docId"/>
      </template>
    </el-skeleton>
  </div>
</template>

<script lang="ts">
import DocFileInfo from "@/core/domain/DocFileInfo";
import { defineComponent, PropType } from "vue";
import { cleanText } from "@/core/util/StringUtils";
import DocUtils from "@/core/util/DocUtils";
import {DocMetadata, EMPTY_DOC_METADATA} from "@/core/domain/doc/DocMetadata";
import { ceilDaysSinceLatest, updateBadgeType } from "@/core/util/DateUtils";
import TagList from '@/platform/web/pages/doc/tag/TagList.vue'

export default defineComponent({
  components: {
    TagList
  },
  props: {
    categoryLink: {
      type: String,
      required: true,
    },
  },
  emits: ['pastdays-change'],
  data() {
    return {
      loading: true as boolean,
      file: null as DocFileInfo | null,
      // 标签
      tags: [] as string[],
      // 离最后一次更新过去几天
      lastPastDays: 0 as number,
      // 文档元数据
      docMetadata: EMPTY_DOC_METADATA as DocMetadata
    };
  },
  computed: {
    wordCount() {
      return cleanText(this.file?.content).length;
    },
    filename() {
      return this.file?.name;
    },
    docId(){
      return DocUtils.docUrl2Id(this.categoryLink);
    },
    quality() {
      return this.$services.docService.calcQuanlityStr(this.docId)
    }
  },
  methods: {
    // 初始化内容
    async init(docLink?: string) {
      this.loading = true;
      if (docLink) {
        this.file = await this.$services.docService.getDocFileInfo(DocUtils.docUrl2Id(docLink));
      } else {
        this.file = await this.$services.docService.getDocFileInfo(
          DocUtils.docUrl2Id(this.categoryLink)
        );
      }
      this.docMetadata = this.file.formattedMetadata
      this.tags = this.file.formattedMetadata.tags;
      this.lastPastDays = this.calcLastUpdate();
      this.loading = false;
    },
    // 结束展示
    destroy() {},
    // 计算最后更新于
    calcLastUpdate() {
      if (!this.file) {
        return -1;
      }
      return ceilDaysSinceLatest(this.file.commitList.map((v) => v.date));
    },
    // 计算更新日期颜色
    calcUpdateType(days: number): string {
      return updateBadgeType(days);
    }
  }
});
</script>


<style lang="less" scoped>
.full-id {
  font-size: 12px;
  padding-top: 0;
  margin-top:0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>