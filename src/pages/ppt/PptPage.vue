<template>
  <tool-box @go-to-doc="$router.push('/doc/' + doc)"/>
  <div class="toc-wrapper">
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

export default defineComponent({
  components: {
    ArrowLeftBold,
    ArrowRightBold,
    ContentsList,
    ToolBox
  },
  data() {
    return {
      doc: "",
      headingId: "",
      file: null as DocFileInfo | null,
      currentIndex: 0,
    };
  },
  watch: {
    currentIndex: {
      immediate: true,
      handler() {
        this.hilightCurrent();
      },
    },
  },
  methods: {
    async showPpt() {
      this.file = await api.getDocFileInfo(this.doc);
      this.hilightCurrent();
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
  position: absolute;
  left: 10px;
  top: 50%;
}
.next-btn {
  position: absolute;
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
  height: calc(100% - 60px);
}
.outline {
  ul {
    list-style: none;
  }
}
</style>