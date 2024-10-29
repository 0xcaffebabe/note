<template>
  <transition name="fade">
    <div ref="popover" class="popover" v-show="visible">
      <div class="drag-bar" ref="bar"></div>
      <el-button class="close-button" size="small" circle @click="hide0">
        <el-icon><close-bold /></el-icon>
      </el-button>
      <el-button size="small" circle @click="pin = true" style="float:right;margin-right: 10px">
        <el-icon><place /></el-icon>
      </el-button>
      <category-item-content
        :category-link="docLink"
        category-name="test"
        ref="categoryItemContent"
      />
      <div class="markdown-section preview-markdown" v-html="contentHtml" draggable="false"></div>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { CloseBold, Place } from "@element-plus/icons-vue";
import CategoryItemContent from "./category/CategoryItemContent.vue";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";
import DocUtils from "@/util/DocUtils";

export default defineComponent({
  components: {
    CloseBold,
    Place,
    CategoryItemContent,
  },
  data() {
    return {
      docLink: "",
      visible: false,
      file: new DocFileInfo() as DocFileInfo,
      pin: false,
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
      this.pin = false
      this.initDoc();
      (this.$refs.categoryItemContent as any).init(docLink);
      const popover = this.$refs.popover as HTMLElement;
      this.visible = true;
      popover.style.top = y + "px";
      popover.style.left = x + "px";

      /* 拖拽支持 */
      const bar = this.$refs.popover as HTMLElement
      let inDrag = false;
      let currentX = x;
      let currentY = y;
      bar.onmousedown = (e: MouseEvent) => {
        if (e.button == 1) {
          currentX = e.clientX, currentY = e.clientY;
          inDrag = true;
          e.preventDefault()
        }
      }
      bar.onmousemove = (e: MouseEvent) => {
        if (inDrag) {
			    const disX = e.clientX - currentX, disY = e.clientY - currentY;
          popover.style.top = (y + disY) + "px";
          popover.style.left = (x + disX) + "px";
          e.preventDefault()
        }
      }
      bar.onmouseup = () => {
        inDrag = false;
        y = (parseInt(popover.style.top.replace('px', '')))
        x = (parseInt(popover.style.left.replace('px', '')))
      }
    },
    async initDoc() {
      this.file = await DocService.getDocFileInfo(DocUtils.docUrl2Id(this.docLink));
    },
    hide() {
      if (this.pin) {
        return
      }
      this.hide0()
    },
    hide0() {
      this.visible = false;
      (this.$refs.categoryItemContent as any).destroy();
    }
  },
  mounted() {
    document.addEventListener('scroll', this.hide)
  },
  unmounted() {
    document.removeEventListener('scroll', this.hide)
  }
});
</script>

<style lang="less" scoped>
.popover {
  // transition: all 0.2s;
  background-color: #fff;
  width: 400px;
  position: fixed;
  top: 80px;
  left: 400px;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 9999;
}
.preview-markdown {
  max-height: 100%;
}
@media screen and(max-width: 800px) {
  .popover {
    width: 80%;
  }
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
  margin-top: 10px!important;
  padding-left: 10px;
  padding-right: 10px;
  max-height: 600px;
  overflow: scroll;
  cursor: default;
}
.drag-bar {
  width: 100%;
  height: 20px;
  position: absolute;
  cursor: move;
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