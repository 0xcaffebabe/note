<template>
  <tool-box @go-to-doc="$router.push('/doc/' + doc)"/>
  <div class="toc-wrapper" :style="{'top': parentShowHeader ? '66px': '6px', 'height': parentShowHeader ? 'calc(100% - 60px)': '100%'}">
    <contents-list
      :doc="doc"
      :with-event="false"
      @item-click="handleContentsItemClick"
      ref="contentList"
    />
  </div>
  <div v-if="flatContent" class="root">
    <el-button @click="previous" class="previous-btn">
      <el-icon><arrow-left-bold /></el-icon>
    </el-button>
    <el-button @click="next" class="next-btn">
      <el-icon><arrow-right-bold /></el-icon>
    </el-button>
    <div class="markdown-section">
      <h1
        :class="{
          'main-heading':
            flatContent[currentIndex] && !flatContent[currentIndex].content,
        }"
      >
        {{ flatContent[currentIndex] && flatContent[currentIndex].title }}
      </h1>
      <div
        class="outline"
        v-if="flatContent[currentIndex] && !flatContent[currentIndex].content"
      >
        <u>
          <li
            v-for="item in flatContent[currentIndex].children || []"
            :key="item.id"
          >
            {{ item.title }}
          </li>
        </u>
      </div>
      <div
        v-html="flatContent[currentIndex] && flatContent[currentIndex].content"
      ></div>
    </div>
  </div>
  <image-viewer ref="imageViewer" />
</template>

<script lang="ts">
import api from "@/api";
import DocSegement from "@/dto/doc/DocSegement";
import { ArrowLeftBold, ArrowRightBold } from "@element-plus/icons";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";
import { defineComponent } from "vue";
import "../doc/markdown-v1.less";
import "../doc/code-hl-vsc.css";
import ContentsList from "../doc/contents/ContentsList.vue";
import ToolBox from "../doc/ToolBox.vue";
import PptPageEventManager from "./PptPageEventManager";
import ImageViewer from "@/components/ImageViewer.vue";

export default defineComponent({
  inject: ['showHeader'],
  components: {
    ArrowLeftBold,
    ArrowRightBold,
    ContentsList,
    ToolBox,
    ImageViewer
},
  data() {
    return {
      doc: "",
      headingId: "",
      file: null as DocFileInfo | null,
      currentIndex: 0,
      showImageViewer: false,
      imageUrlList: [] as string[],
      eventManager: null as PptPageEventManager | null,
      parentShowHeader: true as boolean,
    };
  },
  watch: {
    currentIndex: {
      immediate: true,
      handler() {
        this.hilightCurrent();
      },
    },
    showHeader: {
      handler(val){
        this.parentShowHeader = val;
      },
      immediate: true,
    }
  },
  methods: {
    async showPpt() {
      this.file = await api.getDocFileInfo(this.doc);
      if (this.headingId) {
        const index = this.flatContent.findIndex(v => v.id == this.headingId)
        if (index != -1) {
          this.currentIndex = index
        }
      }
      this.hilightCurrent()
      this.$nextTick(() => {
        // 渲染mermaid
        this.eventManager!.renderMermaid()
      })
    },
    hilightCurrent() {
      const segement = this.flatContent[this.currentIndex];
      if (segement) {
        (this.$refs.contentList as InstanceType<typeof ContentsList>).hilight(
          segement.id
        );
      }
    },
    previous() {
      if (this.currentIndex <= 0) {
        return;
      }
      this.currentIndex--;
    },
    next() {
      if (this.currentIndex >= this.flatContent.length - 1) {
        return;
      }
      this.currentIndex++;
    },
    handleContentsItemClick(id: string) {
      this.currentIndex = this.flatContent.findIndex((v) => v.id == id);
    },
  },
  computed: {
    content(): DocSegement[] {
      if (!this.file) {
        return [];
      }
      return DocService.renderMdWithStructed(this.file);
    },
    flatContent(): DocSegement[] {
      const list: DocSegement[] = [];
      function flat(segement: DocSegement) {
        list.push(segement);
        segement.children?.forEach((e) => flat(e));
      }
      this.content.forEach((e) => flat(e));
      return list;
    },
  },
  created() {
    this.doc = this.$route.params.doc.toString();
    this.headingId = this.$route.query.headingId?.toString() || "";
    this.showPpt();

    // 快捷键
    document.addEventListener("keydown", (e) => {
      if (e.key == "ArrowRight") {
        this.next();
        e.preventDefault();
      }
      if (e.key == "ArrowLeft") {
        this.previous();
        e.preventDefault();
      }
    });
  },
  mounted() {
    this.eventManager = new PptPageEventManager(this);
    this.eventManager.registerImageClick(document.querySelector('.markdown-section')!);
  }
});
</script>


<style lang="less" scoped>
.root {
  padding-top: 0;
  margin-top: 0;
  padding: 0 80px;
  max-width: 74%;
}
.main-heading {
  font-size: 4rem;
}
.previous-btn {
  position: fixed;
  left: 10px;
  top: 50%;
}
.next-btn {
  position: fixed;
  right: 10px;
  top: 50%;
}
.previous-btn,
.next-btn {
  padding: 0 4px;
}
.toc-wrapper {
  transition: all 0.2s;
  position: fixed;
  right: 16px;
}
.outline {
  ul {
    list-style: none;
  }
}
</style>