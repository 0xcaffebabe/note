<template>
  <transition name="fade">
    <div ref="popover" class="popover" v-show="visible">
      <el-button class="close-button" size="small" circle @click="hide">
        <el-icon><close-bold /></el-icon>
      </el-button>
      <category-item-content
        :category-link="docLink"
        category-name="test"
        ref="categoryItemContent"
      />
      <div class="markdown-section preview-markdown" v-html="contentHtml"></div>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { CloseBold } from "@element-plus/icons-vue";
import CategoryItemContent from "./category/CategoryItemContent.vue";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";
import DocUtils from "@/util/DocUtils";

export default defineComponent({
  components: {
    CloseBold,
    CategoryItemContent,
  },
  data() {
    return {
      docLink: "",
      visible: false,
      file: new DocFileInfo() as DocFileInfo,
    };
  },
  computed: {
    contentHtml(): string {
      return DocService.renderMd(this.file);
    }
  },
  methods: {
    show(docLink: string, x: number, y: number) {
      this.docLink = docLink;
      this.initDoc();
      (this.$refs.categoryItemContent as any).init(docLink);
      const popover = this.$refs.popover as HTMLElement;
      this.visible = true;
      popover.style.top = y + "px";
      popover.style.left = x + "px";
    },
    async initDoc() {
      this.file = await DocService.getDocFileInfo(DocUtils.docUrl2Id(this.docLink));
    },
    hide() {
      this.visible = false;
      (this.$refs.categoryItemContent as any).destroy();
    },
  },
  mounted() {
    const popover = this.$refs.popover as HTMLElement;
    document.addEventListener('scroll', this.hide)
  },
  unmounted() {
    document.removeEventListener('scroll', this.hide)
  }
});
</script>

<style lang="less" scoped>
.popover {
  transition: all 0.2s;
  background-color: #fff;
  width: 400px;
  position: fixed;
  top: 80px;
  left: 400px;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 9999;
}
.close-button {
  float: right;
}

// 动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.markdown-section {
  margin-top: 20px;
  padding-left: 10px;
  padding-right: 10px;
  max-height: 600px;
  overflow: scroll;
}

body[theme=dark] {
  #markdownLinkPopover {
    background-color: var(--second-dark-bg-color);
  }
  .el-button {
    opacity: 0.75;
  }
  .popover {
    background-color: var(--second-dark-bg-color);
    box-shadow: 2px 2px 13px var(--main-dark-bg-color);
  }
}
</style>