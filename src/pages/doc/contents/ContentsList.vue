<template>
  <ul class="toc">
    <contents-tree :contentsList="contentsList" />
  </ul>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ContentsTree from "./ContentsTree.vue";

function registerWindowScrollListener() {
  document.addEventListener("scroll", (e) => {
    const idList = document.querySelectorAll(
      ".markdown-section h1, .markdown-section h2, .markdown-section h3, .markdown-section h4 .markdown-section h5, .markdown-section h6"
    );
    let node = null;
    for (let i = 0; i < idList.length; i++) {
      const elm = idList[i];
      if (elm instanceof HTMLElement) {
        if (window.scrollY > elm.offsetTop - 160) {
          node = elm;
        }
      }
      // 滚动到顶部特殊处理
      if (window.scrollY == 0) {
        node = idList[0];
      }
    }
    if (node != null) {
      const previousNode = document.querySelector(".toc .active");
      if (previousNode !== null) {
        previousNode.classList.remove("active");
      }
      document.querySelector(`.toc a[href='#${node.id}']`)?.classList.add("active");
    }
  });
  // 判断激活的目录item是否不可见 不可见则滚动到可见
  document.addEventListener('scroll', (e) => {
    const tocElm: HTMLElement | null = document.querySelector('.toc')
    const activeTocItem: HTMLElement | null = document.querySelector('.toc .active')
    if (activeTocItem && tocElm) {
      const topBound = tocElm.scrollTop
      const bottomBound = tocElm.scrollTop + tocElm.offsetHeight
      const itemPos = activeTocItem.offsetTop
      // 位置超出下边界
      if (itemPos > bottomBound) {
        tocElm.scrollTo(0, itemPos / 2)
      }
      // 位置超出上边界
      if (itemPos < topBound) {
        tocElm.scrollTo(0, (itemPos / 2) - topBound)
      }
    }
  })
}

export default defineComponent({
  props: {
    contentsList: Array,
  },
  components: {
    ContentsTree,
  },
  created(){
    registerWindowScrollListener()
  },
  unmounted(){
    document.onscroll = null
  }
});
</script>

<style lang="less" scoped>
.toc {
  max-width: 300px;
  overflow-y: auto;
  border-left: 1px solid #ccc;
  overflow-y: hidden;
  max-height: calc(100% - 100px);
}
.toc:hover {
  overflow-y: auto;
  max-width: 306px;
}
.toc :deep(a) {
  color: rgb(116, 129, 141);
  text-decoration: none;
  font-weight: 400;
  font-size: 14px;
  text-decoration: none;
}
:deep(a:hover) {
  color: #3e90e8 !important;
}
:deep(.active) {
  color: #3e90e8 !important;
  font-weight: 550 !important;
}
ul,
:deep(ul) {
  padding: 0 24px;
  list-style: none;
}
:deep(li) {
  padding: 4px 0;
}
.toc:first-child:before {
  content: "📋 目录列表";
  color: rgb(116, 129, 141);
}
</style>
