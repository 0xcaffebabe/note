<template>
  <div v-if="flatContent" class="root">
    <el-button @click="previous" class="previous-btn">
      <el-icon><arrow-left-bold /></el-icon>
    </el-button>
    <el-button @click="next" class="next-btn">
      <el-icon><arrow-right-bold /></el-icon>
    </el-button>

    <h1
      :class="{
        'main-heading': flatContent[currentIndex] && !flatContent[currentIndex].content,
      }"
    >
      {{ flatContent[currentIndex] && flatContent[currentIndex].title }}
    </h1>
    <div class="outline markdown-section" v-if="flatContent[currentIndex] && !flatContent[currentIndex].content">
      <u>
        <li v-for="item in flatContent[currentIndex].children || []" :key="item.id">
          {{item.title}}
        </li>
      </u>
    </div>
    <div
      v-html="flatContent[currentIndex] && flatContent[currentIndex].content"
      class="markdown-section"
    ></div>
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

export default defineComponent({
  components: {
    ArrowLeftBold,
    ArrowRightBold,
  },
  data() {
    return {
      doc: "",
      headingId: "",
      file: null as DocFileInfo | null,
      currentIndex: 0,
    };
  },
  methods: {
    async showPpt() {
      this.file = await api.getDocFileInfo(this.doc);
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
  },
  computed: {
    content(): DocSegement[] {
      if (!this.file) {
        return [];
      }
      return DocService.renderMdWithStructed(this.file);
    },
    flatContent(): DocSegement[] {
      function flat(segement: DocSegement[]): DocSegement[] {
        const list: DocSegement[] = [];
        for (let i of segement) {
          list.push(...flat(i.children || []));
        }
        return [...segement, ...list];
      }
      return flat(this.content);
    },
  },
  created() {
    this.doc = this.$route.params.doc.toString();
    this.headingId = this.$route.query.headingId?.toString() || "";
    this.showPpt();
  },
});
</script>


<style lang="less" scoped>
.root {
  padding: 0 80px;
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
.outline {
  ul {
    list-style: none;
  }
}
</style>