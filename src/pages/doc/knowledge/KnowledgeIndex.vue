<template>
  <el-drawer
    v-model="showDrawer"
    :size="$isMobile() ? '50%' : '44%'"
    :direction="$isMobile() ? 'btt': 'rtl'"
    :with-header="false"
    :modal="false"
    modal-penetrable
    resizable
    class="knowledge-index-drawer"
    title="知识索引"
    @close="$emit('close')"
    :lock-scroll="false"
  >
    <div class="knowledge-index-content">
      <div class="knowledge-index-toolbar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索知识索引..."
          prefix-icon="el-icon-search"
          clearable
          @input="filterCategories"
        />
        <el-button @click="showDrawer = false" class="close-btn" plain>
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <div class="knowledge-index-main">
        <div
          class="index-body"
          :style="{ height: indexBodyHeight + 'px' }"
        >
          <el-tree
            v-if="filteredCategories.length > 0"
            :data="filteredCategories"
            :props="treeProps"
            :filter-node-method="filterNode"
            @node-click="handleNodeClick"
            class="knowledge-index-tree"
            node-key="link"
            default-expand-all
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <span class="node-label" :title="data.name">{{ data.name }}</span>
              </span>
            </template>
          </el-tree>

          <div v-else class="empty-state">
            <el-empty description="暂无知识索引" />
          </div>
        </div>

        <!-- 拖拽分割线 -->
        <div
          class="resize-divider"
          @mousedown="startResize"
          :style="{ top: indexBodyHeight + 'px' }"
        >
          <div class="divider-line"></div>
          <div class="divider-handle">
            <el-icon><More /></el-icon>
          </div>
        </div>

        <div
          v-if="currentContent"
          class="knowledge-content-panel"
          :style="{ height: `calc(100% - ${indexBodyHeight}px - 30px)` }"
        >
          <div class="content-header">
            <h3>{{ currentTitle }}</h3>
            <el-button @click="currentContent = null" size="small" type="primary">
              关闭内容
            </el-button>
          </div>
          <div class="content-body" v-html="currentContent" @click="handleContentClick"></div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElTree, ElInput, ElButton, ElIcon, ElEmpty, ElDrawer } from "element-plus";
import { Close, More } from "@element-plus/icons-vue";
import CategoryService from '@/service/CategoryService';
import Category from '@/dto/Category';
import DocService from '@/service/DocService';
import DocUtils from "@/util/DocUtils";

export default defineComponent({
  components: {
    ElTree,
    ElInput,
    ElButton,
    ElIcon,
    Close,
    More,
    ElEmpty,
    ElDrawer
  },
  props: {
    doc: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showDrawer: false,
      allCategories: [] as Category[],
      filteredCategories: [] as Category[],
      searchQuery: '',
      currentContent: '',
      currentTitle: '',
      treeProps: {
        children: 'chidren',
        label: 'name',
        disabled: 'disabled'
      },
      indexBodyHeight: 200, // 默认高度
      isResizing: false,
      initialHeight: 0, // 初始高度
      initialY: 0, // 初始鼠标Y位置
      minHeight: 100, // 最小高度
      maxHeight: 500, // 最大高度
      storageKey: 'knowledge-index-body-height' // 存储高度的键
    };
  },
  methods: {
    show() {
      this.showDrawer = true;
      this.loadSavedHeight(); // 从localStorage加载高度
      this.init();
    },

    loadSavedHeight() {
      try {
        const savedHeight = localStorage.getItem(this.storageKey);
        if (savedHeight) {
          const height = parseInt(savedHeight, 10);
          // 验证高度在有效范围内
          if (height >= this.minHeight && height <= this.maxHeight) {
            this.indexBodyHeight = height;
          }
        }
      } catch (error) {
        console.error('加载保存的高度失败:', error);
      }
    },

    saveCurrentHeight() {
      try {
        localStorage.setItem(this.storageKey, this.indexBodyHeight.toString());
      } catch (error) {
        console.error('保存高度到localStorage失败:', error);
      }
    },

    startResize(event: MouseEvent) {
      event.preventDefault();
      this.isResizing = true;

      // 记录初始状态
      this.initialHeight = this.indexBodyHeight;
      this.initialY = event.clientY;

      // 添加全局事件监听器
      document.addEventListener('mousemove', this.handleResize);
      document.addEventListener('mouseup', this.stopResize);

      // 防止文本选择
      document.body.style.userSelect = 'none';
    },

    handleResize(event: MouseEvent) {
      if (!this.isResizing) return;

      // 获取容器元素
      const drawerElement = document.querySelector('.knowledge-index-content') as HTMLElement;
      if (!drawerElement) return;

      // 计算鼠标移动的偏移量
      const deltaY = event.clientY - this.initialY;
      const newHeight = this.initialHeight + deltaY;

      // 更新高度，确保在最小值和最大值之间
      let finalHeight = Math.max(this.minHeight, Math.min(newHeight, this.maxHeight));

      // 确保剩余空间足够显示内容面板
      const totalHeight = drawerElement.clientHeight;
      if (totalHeight - finalHeight < 100) { // 至少留100px给内容面板
        finalHeight = totalHeight - 100;
      }

      this.indexBodyHeight = finalHeight;
    },

    stopResize() {
      if (this.isResizing) {
        this.isResizing = false;

        // 移除全局事件监听器
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.stopResize);

        // 恢复文本选择
        document.body.style.userSelect = '';

        // 保存当前高度到localStorage
        this.saveCurrentHeight();
      }
    },

    async init() {
      try {
        // 获取所有目录
        const allCategories = await CategoryService.getCompiledCategoryList();
        // 过滤出以知识索引开头的目录
        this.allCategories = this.filterKnowledgeIndexCategories(allCategories);
        this.filteredCategories = this.allCategories;
      } catch (error) {
        console.error('获取知识索引目录失败:', error);
      }
    },

    filterKnowledgeIndexCategories(categories: Category[]): Category[] {
      // 过滤出知识索引相关的目录
      // 支持多种命名约定和路径模式
      return categories.filter(category => {
        const lowerName = category.name.toLowerCase();
        const lowerLink = category.link?.toLowerCase() || '';

        // 检查目录名或链接是否包含知识索引相关的关键词
        const hasKnowledgeIndexKeywords =
               lowerName.includes('知识索引') ||
               lowerName.includes('knowledge index') ||
               lowerName.includes('index') ||
               lowerLink.includes('知识索引') ||
               lowerLink.includes('knowledge-index') ||
               lowerLink.includes('index') ||
               lowerLink.includes('/index/');

        // 如果当前节点匹配关键词，直接返回true
        if (hasKnowledgeIndexKeywords) {
          return true;
        }

        // 如果当前节点不匹配，但子节点中有匹配的，也返回true
        return this.hasKnowledgeIndexChildren(category.chidren);
      });
    },

    hasKnowledgeIndexChildren(categories: Category[]): boolean {
      // 检查子节点中是否包含知识索引相关的节点
      for (const child of categories) {
        const lowerName = child.name.toLowerCase();
        const lowerLink = child.link?.toLowerCase() || '';

        if (lowerName.includes('知识索引') ||
            lowerName.includes('knowledge index') ||
            lowerName.includes('index') ||
            lowerLink.includes('知识索引') ||
            lowerLink.includes('knowledge-index') ||
            lowerLink.includes('index') ||
            lowerLink.includes('/index/')) {
          return true;
        }

        // 递归检查子节点
        if (this.hasKnowledgeIndexChildren(child.chidren)) {
          return true;
        }
      }
      return false;
    },

    filterNode(value: string, data: Category) {
      if (!value) return true;
      return data.name.toLowerCase().indexOf(value.toLowerCase()) !== -1;
    },

    filterCategories() {
      if (!this.searchQuery) {
        this.filteredCategories = this.allCategories;
      } else {
        // 递归过滤匹配的节点及其父节点
        this.filteredCategories = this.filterTreeByQuery(this.allCategories, this.searchQuery);
      }
    },

    filterTreeByQuery(categories: Category[], query: string): Category[] {
      const result: Category[] = [];

      for (const category of categories) {
        // 检查当前节点是否匹配
        const isMatch = category.name.toLowerCase().includes(query.toLowerCase());

        // 检查子节点是否有匹配
        const matchedChildren = this.filterTreeByQuery(category.chidren, query);

        // 如果当前节点匹配或子节点中有匹配的，则添加到结果中
        if (isMatch || matchedChildren.length > 0) {
          const nodeCopy = { ...category };
          nodeCopy.chidren = isMatch ? category.chidren : matchedChildren;
          result.push(nodeCopy);
        }
      }

      return result;
    },

    async handleNodeClick(data: Category) {
      if (data.link) {
        try {
          // 获取文件内容
          const fileInfo = await DocService.getDocFileInfo(DocUtils.docUrl2Id(data.link));
          // 使用 DocService 的渲染方法来渲染 Markdown
          this.currentContent = DocService.renderMd(fileInfo);
          this.currentTitle = data.name;
        } catch (error) {
          console.error('获取文档内容失败:', error);
          this.currentContent = '<p>内容加载失败</p>';
          this.currentTitle = data.name;
        }
      }
    },

    handleContentClick(event: Event) {
      // 处理内容中的链接点击
      const target = event.target as HTMLElement;
      if (target.tagName === 'A') {
        event.preventDefault();
        let href = target.getAttribute('href');
        if (href) {
          // 处理相对链接和绝对链接
          if (href.startsWith('#')) {
            // 内部锚点链接，滚动到对应位置
            const element = document.querySelector(href);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } else {
            // 发送导航事件到父组件
            this.$router.push("/doc/" + DocUtils.docUrl2Id(target.getAttribute('origin-link') || ''));
          }
        }
      }
    }
  },
  watch: {
    searchQuery(val) {
      this.$nextTick(() => {
        // 在搜索框更新后过滤节点
        this.filterCategories();
      });
    }
  },
  beforeUnmount() {
    // 清理事件监听器
    if (this.isResizing) {
      document.removeEventListener('mousemove', this.handleResize);
      document.removeEventListener('mouseup', this.stopResize);
      document.body.style.userSelect = '';
    }

    // 重置状态
    this.isResizing = false;
    this.initialHeight = 0;
    this.initialY = 0;
  }
});
</script>

<style lang="less" scoped>
.knowledge-index-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
  position: relative; /* 为分割线定位做准备 */
}

.knowledge-index-toolbar {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  background: var(--bg-color);

  .el-input {
    flex: 1;
    margin-right: 12px;
  }

  .close-btn {
    padding: 8px;
  }
}

.knowledge-index-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.index-body {
  overflow: auto;
  padding: 12px;
  min-height: 100px; /* 确保最小高度 */

  .knowledge-index-tree {
    :deep(.el-tree-node__content) {
      height: 36px;
    }

    :deep(.tree-node) {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      padding-right: 8px;

      .node-label {
        max-width: calc(100% - 20px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }
}

/* 拖拽分割线样式 */
.resize-divider {
  position: absolute;
  left: 0;
  right: 0;
  height: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ns-resize; /* 南北调整光标，显示上下双箭头 */
  z-index: 10;
  background: var(--bg-color-2);

  .divider-line {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--border-color);
  }

  .divider-handle {
    position: relative;
    width: 40px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-color-2);
    z-index: 11;
    color: var(--text-color-3);
    border-radius: 12px;
    box-shadow: 0 0 2px rgba(0,0,0,0.1);
    transition: all 0.2s ease;

    .el-icon {
      font-size: 14px;
    }
  }

  &:hover {
    .divider-handle {
      color: var(--primary-color);
      background: var(--bg-color);
      box-shadow: 0 0 6px rgba(0,0,0,0.15);
      transform: scale(1.1);
    }
  }
}

.knowledge-content-panel {
  background: var(--bg-color);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出 */

  .content-header {
    padding: 12px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .content-body {
    flex: 1;
    padding: 15px;
    overflow: auto;
    font-size: 14px;

    :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
      margin-top: 1.2em;
      margin-bottom: 0.8em;
    }

    :deep(p) {
      line-height: 1.6;
      margin-bottom: 1em;
    }

    :deep(a) {
      color: var(--primary-color);
      cursor: pointer;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    :deep(img) {
      max-width: 100%;
    }

    :deep(pre) {
      background: var(--bg-color-2);
      padding: 10px;
      border-radius: 4px;
      overflow: auto;
    }

    :deep(code) {
      font-family: monospace;
      background: var(--bg-color-2);
      padding: 2px 4px;
      border-radius: 3px;
    }

    :deep(blockquote) {
      border-left: 4px solid var(--border-color);
      padding-left: 16px;
      margin: 16px 0;
      color: var(--text-color-2);
    }

    :deep(ul), :deep(ol) {
      padding-left: 20px;
      margin: 10px 0;
    }
  }
}
</style>