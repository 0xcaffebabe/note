<template>
  <ul class="toc" ref="toc">
    <contents-tree
      :contentsList="contentList"
      @item-click="handleTocItemClick"
    />
  </ul>
</template>

<script lang="ts">
import Category from "@/dto/Category";
import { defineComponent } from "vue";
import ContentsTree from "./ContentsTree.vue";
import ContentList from "./ContentsList.vue";
import DocService from "@/service/DocService";

function hightHeading(instance: InstanceType<typeof ContentList>) {
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
    // 高亮当前标题
    document
      .querySelector(`.toc a[href='#${node.id}']`)
      ?.classList.add("active");
    // 记录当前标题
    instance.$store.commit("setCurrentHeading", node.id);
  }
}

// 判断激活的目录item是否不可见 不可见则滚动到可见
function syncHeadingVisible(instance: InstanceType<typeof ContentList>) {
  const tocElm: HTMLElement | null = document.querySelector(".toc");
  const activeTocItem: HTMLElement | null =
    document.querySelector(".toc .active");
  if (activeTocItem && tocElm) {
    const topBound = tocElm.scrollTop;
    const bottomBound = tocElm.scrollTop + tocElm.offsetHeight;
    const itemPos = activeTocItem.offsetTop;
    // 位置超出下边界
    if (itemPos > bottomBound) {
      tocElm.scrollTo(0, itemPos / 2);
    }
    // 位置超出上边界
    if (itemPos < topBound) {
      tocElm.scrollTo(0, itemPos / 2 - topBound);
    }
  }
}

export default defineComponent({
  props: {
    doc: {
      type: String,
      required: true,
    },
    // 是否启用滚动事件监听
    withEvent: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["item-click"],
  components: {
    ContentsTree,
  },
  data() {
    return {
      contentList: [] as Category[],
      currentId: ''
    };
  },
  watch: {
    doc: {
      immediate: true,
      async handler() {
        if (!this.doc) {
          return;
        }
        this.contentList = await DocService.getContentByDocId(this.doc);
        // 高亮当前heading
        this.$nextTick(() => {
          if (this.currentId) {
            this.hilight(this.currentId)
          }
        })
      },
    },
  },
  methods: {
    registerWindowScrollListener() {
      let lastTime = new Date().getTime();
      document.addEventListener("scroll", (e) => {
        // 两次触发的间隔至少200ms
        const currentTime = new Date().getTime();
        if (currentTime < lastTime + 200) {
          return;
        }
        hightHeading(this);
        syncHeadingVisible(this);
        lastTime = new Date().getTime();
      });
    },
    handleTocItemClick(id: string) {
      this.$emit("item-click", id);
    },
    // 高亮指定标题
    hilight(id: string) {
      this.currentId = id;
      const document = this.$refs.toc as HTMLElement;
      const previousNode = document.querySelector(".toc .active");
      if (previousNode !== null) {
        previousNode.classList.remove("active");
      }
      // 高亮当前标题
      document.querySelector(`.toc a[href='#${id}']`)?.classList.add("active");
      syncHeadingVisible(this);
    },
  },
  created() {
    if (this.withEvent) {
      this.registerWindowScrollListener();
    }
  },
  unmounted() {
    document.onscroll = null;
  },
});
</script>

<style lang="less" scoped>
.toc {
  width: 220px;
  overflow-y: auto;
  border-left: 1px solid #ccc;
  overflow-y: hidden;
  max-height: calc(100% - 40px);
  margin: 0;
  margin-top: 8px;
}
.toc:hover {
  overflow-y: auto;
  // max-width: 306px;
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
  font-weight: 600;
}
:deep(.active) {
  transition: all 0.2s;
  color: #3e90e8 !important;
  font-weight: 600 !important;
}
ul,
:deep(ul) {
  padding: 0 12px;
  list-style: none;
}
:deep(li) {
  padding: 4px 0;
  white-space: nowrap;
  word-wrap: break-word;
  word-break: break-all;
  text-overflow: ellipsis;
  overflow: hidden;
}
.toc:first-child:before {
  content: "📋 目录列表";
  color: rgb(116, 129, 141);
}

.progress {
  text-align: center;
}

body[theme="dark"] {
  .toc {
    border-left: 1px solid var(--default-dark-border-color);
  }
  .toc :deep(a) {
    color: var(--main-dark-text-color);
  }
  .progress {
    opacity: 0.75;
  }
}
</style>
