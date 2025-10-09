<template>
  <div class="toc-container">
    <div class="toc-header">
      <h3 class="toc-title">文档目录</h3>
    </div>
    <ul class="toc" ref="toc">
      <contents-tree
        :contentsList="contentList"
        @item-click="handleTocItemClick"
      />
    </ul>
  </div>
</template>

<script lang="ts">
import Category from "@/dto/Category";
import { defineComponent } from "vue";
import ContentsTree from "./ContentsTree.vue";
import ContentList from "./ContentsList.vue";
import DocService from "@/service/DocService";

function highlightHeading(instance: InstanceType<typeof ContentList>) {
  const idList = document.querySelectorAll(
    ".main.markdown-section h1, .main.markdown-section h2, .main.markdown-section h3, .main.markdown-section h4, .main.markdown-section h5, .main.markdown-section h6"
  );
  let node = null;
  // 滚动到顶部特殊处理
  if (window.scrollY == 0) {
      node = idList[0];
  } else {
    for (let i = 0; i < idList.length; i++) {
      const elm = idList[i];
      if (elm instanceof HTMLElement) {
        if (window.scrollY > elm.offsetTop - 160) {
          node = elm;
        }
      }
    }
  }
  if (node != null) {
    const previousNode = document.querySelector(".toc .active");
    if (previousNode !== null) {
      previousNode.classList.remove("active");
    }
    // 高亮当前标题
    const id = node.id.replace(/<mark>/gi, '').replace(/<\/mark>/gi, '')
    document
      .querySelector(`.toc a[href='#${id}']`)
      ?.classList.add("active");
    // 记录当前标题
    instance.$store.commit("setCurrentHeading", id);
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
        // 两次触发的间隔至少50ms
        const currentTime = new Date().getTime();
        if (currentTime < lastTime + 50) {
          return;
        }
        highlightHeading(this)
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
.toc-container {
  width: 260px;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all 0.3s ease;
}

.toc-header {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  
  .toc-title {
    margin: 0;
    font-size: 1.1em;
    font-weight: 600;
    color: var(--main-text-color);
  }
}

.toc {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm) 0;
  max-height: calc(100vh - 250px);
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0,0,0,0.2);
  }
  
  &:hover {
    overflow-y: auto;
  }
}

.toc :deep(a) {
  display: block;
  color: var(--secondary-text-color);
  text-decoration: none;
  font-weight: 400;
  font-size: 14px;
  padding: 6px var(--spacing-md);
  margin: 2px 0;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &:hover {
    color: var(--primary-color) !important;
    background-color: var(--hover-bg-color);
    font-weight: 500;
    transform: translateX(4px);
  }
}

:deep(.active) {
  transition: all 0.2s ease;
  color: var(--primary-color) !important;
  font-weight: 600 !important;
  background-color: var(--primary-light-color) !important;
  border-left: 3px solid var(--primary-color);
  margin-left: 4px;
}

ul,
:deep(ul) {
  padding: 0;
  list-style: none;
}

:deep(li) {
  list-style: none;
  margin: 0;
}

.progress {
  text-align: center;
}

body[theme="dark"] {
  .toc-container {
    background-color: var(--dark-card-bg-color);
  }
  
  .toc-header {
    border-bottom: 1px solid var(--default-dark-border-color);
    
    .toc-title {
      color: var(--dark-text-color);
    }
  }
  
  .toc :deep(a) {
    color: var(--dark-secondary-text-color);
    
    &:hover {
      color: var(--primary-color) !important;
      background-color: var(--dark-hover-bg-color);
    }
  }
  
  :deep(.active) {
    background-color: rgba(64, 158, 255, 0.1) !important;
    border-left: 3px solid var(--primary-color);
  }
  
  .progress {
    opacity: 0.75;
  }
}
</style>
