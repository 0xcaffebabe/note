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
      <div class="markdown-section preview-markdown" ref="previewSection" v-html="contentHtml" draggable="false"></div>
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
import DocPostRender from "@/render/DocPostRender";

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
        // 左键拖拽(0) 符合常规拖拽习惯
        if (e.button == 0) {
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
      this.$nextTick(() => {
        // 预览内容的代码块高亮
        DocPostRender.highlightCode(this.$refs.previewSection as HTMLElement);
      });
    },
    hide() {
      if (this.pin) {
        return
      }
      this.hide0()
    },
    handleKeydown(e: KeyboardEvent) {
      // Esc 关闭预览(忽略pin锁定)
      if (e.key == 'Escape' && this.visible) {
        this.hide0()
      }
    },
    hide0() {
      this.visible = false;
      (this.$refs.categoryItemContent as any).destroy();
    }
  },
  mounted() {
    document.addEventListener('scroll', this.hide)
    document.addEventListener('keydown', this.handleKeydown)
  },
  unmounted() {
    document.removeEventListener('scroll', this.hide)
    document.removeEventListener('keydown', this.handleKeydown)
  }
});
</script>

<style lang="less" scoped>
.popover {
  // transition: all 0.2s;
  background-color: var(--elevated-bg-color);
  width: 400px;
  position: fixed;
  top: 80px;
  left: 400px;
  padding: 10px;
  box-shadow: var(--shadow-md);
  z-index: 9999;
}
.preview-markdown {
  max-height: 100%;
}
@media screen and (max-width: 800px) {
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

// 暗色专属: 暗色下降低按钮不透明度以减弱视觉强度 opacity非颜色属性 无法用语义令牌表达
body[theme=dark] {
  .el-button {
    opacity: 0.75;
  }
}
</style>