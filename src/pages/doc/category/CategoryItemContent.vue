<template>
  <div class="container">
    <el-skeleton :rows="1" animated :loading="loading" :throttle="500">
      <template #default>
        <p>{{ filename }}</p>
        <p class="full-id" :title="docId">
          <el-link :href="'/doc/' + docId" @click.prevent="$router.push('/doc/' + docId)" type="primary">{{ docId }}</el-link>
        </p>
        <el-badge
          :value="lastPastDays + '天前更新'"
          class="item"
          :type="calcUpdateType(lastPastDays)"
        ></el-badge>
        <el-badge
          :value="wordCount + '字'"
          class="item"
          type="primary"
        ></el-badge>
        <tag-list :tags="tags" />
        <el-alert :closable="false" v-if="docMetadata.books && docMetadata.books.length > 0">
          <template #default>
            <p>相关书籍</p>
            <p v-for="book in docMetadata.books" :key="book.name">
              <el-popover
                ref="popover"
                placement="right"
                :title="book.name"
                trigger="hover"
              >
                <template #reference>
                  <el-link @click="openBook(book.name)">{{book.name}}</el-link>
                </template>
                <el-image v-if="book.name" :src="'https://search.ismy.wang/book/img?name=书 ' + book.name" alt="" style="width:100px;height:150px" fit="cover" />
              </el-popover>
              <el-tag size="mini" v-for="chapter in book.chapters" :key="chapter">{{chapter}}</el-tag>
            </p>
          </template>
        </el-alert>
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
import {DocMetadata, EMPTY_DOC_METADATA} from "@/dto/doc/DocMetadata";
import {ElMessage} from 'element-plus'
import EnhancerService from '@/service/EnhancerService'
import TagList from '@/pages/doc/tag/TagList.vue'

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
        this.file = await DocService.getDocFileInfo(DocUtils.docUrl2Id(docLink));
      } else {
        this.file = await DocService.getDocFileInfo(
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
      const lastUpdateDate = this.file.commitList
        .map((v) => v.date)
        .map(Date.parse)
        .sort((a, b) => a - b)
        .reverse()[0];
      return Math.ceil(
        (new Date().getTime() - lastUpdateDate) / (3600 * 24 * 1000)
      );
    },
    // 计算更新日期颜色
    calcUpdateType(days: number): string {
      if (days <= 10){
        return 'danger'
      }else if(days > 10 && days <= 30){
        return 'warning'
      }else if(days > 30 && days <= 100){
        return 'success'
      }else if(days > 100 && days <= 300){
        return 'default'
      }
      return 'primary';
    },
    async openBook(bookName: string) {
      try {
        const success = await EnhancerService.openBook(bookName)
        if (!success) {
          ElMessage.error("打开书籍失败")
        }
      }catch(err: any) {
        ElMessage.error(`打开书籍失败: ${err}`)
      }
    }
  },
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
  setup() {},
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

body[theme=dark] {
  .container {
    background-color:var(--second-dark-bg-color);
    color: var(--main-dark-text-color);
  }
}
</style>