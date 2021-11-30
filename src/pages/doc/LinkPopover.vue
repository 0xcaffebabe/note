<template>
  <transition name="fade">
    <div id="markdownLinkPopover" v-show="visible">
      <el-button class="close-button" size="mini" circle @click="hide">
        <el-icon><close-bold /></el-icon>
      </el-button>
      <category-item-content
        :category-link="docLink"
        category-name="test"
        ref="categoryItemContent"
      />
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { CloseBold } from "@element-plus/icons";
import CategoryItemContent from "./category/CategoryItemContent.vue";

export default defineComponent({
  components: {
    CloseBold,
    CategoryItemContent,
  },
  data() {
    return {
      docLink: "",
      visible: false,
    };
  },
  methods: {
    show(docLink: string, x: number, y: number) {
      this.docLink = docLink;
      (this.$refs.categoryItemContent as any).init(docLink);
      const popover = document.getElementById("markdownLinkPopover")!;
      this.visible = true;
      popover.style.top = y + "px";
      popover.style.left = x + "px";
    },
    hide() {
      this.visible = false;
      (this.$refs.categoryItemContent as any).destroy();
    },
  },
  setup() {},
});
</script>

<style lang="less" scoped>
#markdownLinkPopover {
  transition: all 0.2s;
  background-color: #fff;
  width: 200px;
  position: fixed;
  top: 80px;
  left: 400px;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 999;
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

body[theme=dark] {
  #markdownLinkPopover {
    background-color: var(--second-dark-bg-color);
  }
  .el-button {
    opacity: 0.75;
  }
}
</style>