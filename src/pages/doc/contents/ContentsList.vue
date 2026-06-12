<template>
  <div class="toc-container">
    <!-- 阅读进度指示 -->
    <div class="toc-progress" v-if="withEvent">
      <div class="toc-progress-bar" :style="{ width: readingProgress + '%' }"></div>
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
import Content from "@/dto/Content";
import { defineComponent } from "vue";
import ContentsTree from "./ContentsTree.vue";
import DocService from "@/service/DocService";
import { ElMessage } from "element-plus";

// 文档主体标题选择器
const HEADING_SELECTOR =
  ".main.markdown-section h1, .main.markdown-section h2, .main.markdown-section h3, .main.markdown-section h4, .main.markdown-section h5, .main.markdown-section h6";
// 顶栏高度 用于IntersectionObserver的上偏移与回退判断
const HEADER_OFFSET = 80;

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
      contentList: [] as Content[],
      currentId: '',
      // 阅读进度百分比(0-100)
      readingProgress: 0,
      scrollHandler: null as ((e: Event) => void) | null,
      // 标题可见性观察器
      headingObserver: null as IntersectionObserver | null,
      // 标题DOM尚未就绪时的重建定时器与重试计数
      rebuildTimer: null as ReturnType<typeof setTimeout> | null,
      rebuildRetryCount: 0,
    };
  },
  watch: {
    doc: {
      immediate: true,
      async handler() {
        if (!this.doc) {
          return;
        }
        try {
          this.contentList = await DocService.getContentByDocId(this.doc);
        } catch (e: any) {
          ElMessage.error(e.message);
        }
        this.$nextTick(() => {
          // 高亮当前heading
          if (this.currentId) {
            this.hilight(this.currentId)
          }
          // 文档切换后标题DOM会整体替换 需要重建observer
          if (this.withEvent) {
            this.rebuildRetryCount = 0;
            this.setupHeadingObserver();
            this.updateReadingProgress();
          }
        })
      },
    },
  },
  methods: {
    registerWindowScrollListener() {
      // 定义节流的滚动处理器(仅用于更新阅读进度 标题高亮交由IntersectionObserver处理)
      let lastTime = 0;
      this.scrollHandler = () => {
        const currentTime = new Date().getTime();
        if (currentTime < lastTime + 50) {
          return;
        }
        this.updateReadingProgress();
        lastTime = new Date().getTime();
      };

      // 添加滚动事件监听器
      document.addEventListener("scroll", this.scrollHandler);
    },
    // 更新阅读进度(当前文档滚动百分比)
    updateReadingProgress() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        this.readingProgress = 0;
        return;
      }
      const percent = (window.scrollY / scrollable) * 100;
      this.readingProgress = Math.min(100, Math.max(0, percent));
    },
    // 构建标题可见性观察器 取视口内最上方的标题为active
    setupHeadingObserver() {
      this.teardownHeadingObserver();
      const headings = Array.from(document.querySelectorAll(HEADING_SELECTOR)) as HTMLElement[];
      if (headings.length === 0) {
        // 文档主体可能尚未渲染完成 稍后重试(最多重试10次)
        if (this.rebuildRetryCount < 10) {
          this.rebuildRetryCount++;
          this.rebuildTimer = setTimeout(() => this.setupHeadingObserver(), 200);
        }
        return;
      }
      // 当前处于视口内的标题集合
      const visibleHeadings = new Set<HTMLElement>();
      this.headingObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleHeadings.add(entry.target as HTMLElement);
          } else {
            visibleHeadings.delete(entry.target as HTMLElement);
          }
        }
        this.updateActiveHeading(headings, visibleHeadings);
      }, {
        // 上偏移顶栏高度 避免被固定顶栏遮挡的标题被误判为可见
        rootMargin: `-${HEADER_OFFSET}px 0px 0px 0px`,
        threshold: 0,
      });
      headings.forEach(heading => this.headingObserver!.observe(heading));
    },
    // 销毁观察器与待执行的重建任务
    teardownHeadingObserver() {
      if (this.headingObserver) {
        this.headingObserver.disconnect();
        this.headingObserver = null;
      }
      if (this.rebuildTimer) {
        clearTimeout(this.rebuildTimer);
        this.rebuildTimer = null;
      }
    },
    // 根据可见标题集合计算active标题并高亮
    updateActiveHeading(headings: HTMLElement[], visibleHeadings: Set<HTMLElement>) {
      let activeNode: HTMLElement | null = null;
      if (visibleHeadings.size > 0) {
        // 取视口内最上方的标题
        for (const heading of visibleHeadings) {
          if (activeNode === null
            || heading.getBoundingClientRect().top < activeNode.getBoundingClientRect().top) {
            activeNode = heading;
          }
        }
      } else {
        // 视口内没有标题时 回退到最后一个位于视口上方的标题
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top < HEADER_OFFSET) {
            activeNode = heading;
          } else {
            break;
          }
        }
      }
      if (activeNode === null) {
        return;
      }
      // 获取标题的ID并清理可能存在的mark标签
      const id = activeNode.id.replace(/<mark>/gi, '').replace(/<\/mark>/gi, '');
      if (!id) {
        return;
      }
      this.applyActiveClass(id);
      // 记录当前标题
      this.currentId = id;
      this.$store.commit("setCurrentHeading", id);
    },
    // 高亮TOC中对应的项 并保证其在TOC可视区内
    applyActiveClass(id: string) {
      const tocElm = this.$refs.toc as HTMLElement;
      if (!tocElm) {
        return;
      }
      const previousActive = tocElm.querySelector(".active");
      const tocLink = tocElm.querySelector(`a[href='#${id}']`);
      if (previousActive === tocLink) {
        return;
      }
      if (previousActive) {
        previousActive.classList.remove("active");
      }
      if (tocLink) {
        tocLink.classList.add("active");
        this.scrollTocToActive(tocLink as HTMLElement);
      }
    },
    // 仅滚动TOC自身的滚动容器 且仅当active项不在容器可视区内才滚动 避免与用户滚动抢控制权
    scrollTocToActive(activeItem: HTMLElement) {
      const container = this.$refs.toc as HTMLElement;
      if (!container || container.scrollHeight <= container.clientHeight) {
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      // active项已完整可见则不滚动
      if (itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom) {
        return;
      }
      // 计算item相对容器内容的偏移 将其滚动到容器中部
      const offsetInContainer = itemRect.top - containerRect.top + container.scrollTop;
      container.scrollTop = offsetInContainer - container.clientHeight / 2 + activeItem.offsetHeight / 2;
    },
    handleTocItemClick(id: string) {
      this.$emit("item-click", id);
    },
    // 高亮指定标题
    hilight(id: string) {
      this.currentId = id;
      this.applyActiveClass(id);
    },
  },
  created() {
    if (this.withEvent) {
      this.registerWindowScrollListener();
    }
  },
  unmounted() {
    // 移除滚动事件监听器
    if (this.scrollHandler) {
      document.removeEventListener("scroll", this.scrollHandler);
      this.scrollHandler = null;
    }
    // 销毁标题观察器
    this.teardownHeadingObserver();
  },
});
</script>

<style lang="less" scoped>
.toc-container {
  width: 100%; /* 宽度与父组件一致 */
  // 撑满外层wrapper高度 滚动只发生在内部.toc上(唯一滚动条)
  height: 100%;
  min-width: 200px; /* 设置最小宽度 */
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all 0.3s ease;
}

@media (max-width: 1180px) {
  .toc-container {
    // position: fixed;
    // right: 10px;
    // top: 50%;
    // transform: translateY(-50%);
    // height: calc(100vh - 200px);
    // z-index: 998;
  }
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

// 阅读进度指示
.toc-progress {
  flex: 0 0 auto;
  height: 2px;
  width: 100%;
  background-color: var(--border-color);

  .toc-progress-bar {
    height: 100%;
    width: 0;
    background-color: var(--primary-color);
    transition: width var(--transition-fast);
  }
}

.toc {
  flex: 1;
  // 高度由flex布局决定(容器已撑满wrapper) 不再用视口魔法数字限高
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-sm) 0;
  width: 100%; /* 确保与父容器同宽 */

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
</style>
