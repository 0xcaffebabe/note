<template>
  <div>
    <el-skeleton :rows="1" animated :loading="loading" :throttle="500">
      <template #default>
        <p>{{ filename }}</p>
        <p class="full-id" :title="docId"> {{ docId }}</p>
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
</template>

<script lang="ts">
import DocFileInfo from "@/dto/DocFileInfo";
import { defineComponent, PropType } from "vue";
import { cleanText } from "@/util/StringUtils";
import api from "@/api";
import DocService from "@/service/DocService";
import DocUtils from "@/util/DocUtils";
import TagUtils from "@/pages/tag/TagUtils";

export default defineComponent({
  props: {
    categoryLink: {
      type: String,
      required: true,
    },
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
    }
  },
  methods: {
    // 初始化内容
    async init(docLink?: string) {
      this.loading = true;
      if (docLink) {
        this.file = await api.getDocFileInfo(DocUtils.docUrl2Id(docLink));
      } else {
        this.file = await api.getDocFileInfo(
          DocUtils.docUrl2Id(this.categoryLink)
        );
      }
      this.tags = DocService.resolveTagList(this.file);
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
      const lastUpdateDate = this.file.commitList
        .map((v) => v.date)
        .map(Date.parse)
        .sort((a, b) => a - b)
        .reverse()[0];
      return Math.ceil(
        (new Date().getTime() - lastUpdateDate) / (3600 * 24 * 1000)
      );
    },
    // 计算标签的颜色
    calcTagType(tag: string): string {
      return TagUtils.calcTagType(tag);
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
  setup() {},
});
</script>


<style lang="less" scoped>
.el-tag {
  cursor: pointer;
  margin-left: 4px;
  margin-bottom: 4px;
}
.full-id {
  font-size: 12px;
  padding-top: 0;
  margin-top:0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>