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

      <div class="knowledge-index-body">
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

      <div v-if="currentContent" class="knowledge-content-panel">
        <div class="content-header">
          <h3>{{ currentTitle }}</h3>
          <el-button @click="currentContent = null" size="small" type="info" plain>
            关闭内容
          </el-button>
        </div>
        <div class="content-body" v-html="currentContent" @click="handleContentClick"></div>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElTree, ElInput, ElButton, ElIcon, ElEmpty, ElDrawer } from "element-plus";
import { Close } from "@element-plus/icons-vue";
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
      }
    };
  },
  methods: {
    show() {
      this.showDrawer = true;
      this.init();
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
  }
});
</script>

<style lang="less" scoped>
.knowledge-index-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.knowledge-index-toolbar {
  padding: 10px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  background: var(--bg-color);

  .el-input {
    flex: 1;
    margin-right: 10px;
  }

  .close-btn {
    padding: 8px;
  }
}

.knowledge-index-body {
  flex: 1;
  overflow: auto;
  padding: 10px;

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

.knowledge-content-panel {
  border-top: 1px solid var(--border-color);
  background: var(--bg-color);
  display: flex;
  flex-direction: column;
  max-height: 50%;

  .content-header {
    padding: 10px;
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