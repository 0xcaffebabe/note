<template>
  <el-breadcrumb separator="/">
            <template v-for="item in displayChainList" :key="item.key">
              <!-- 链路超过4级时折叠的中间层级 悬浮展示完整路径 -->
              <el-breadcrumb-item v-if="item.ellipsis">
                <el-tooltip :content="fullChainPath" placement="bottom">
                  <span class="chain-ellipsis">…</span>
                </el-tooltip>
              </el-breadcrumb-item>
              <!-- 有link的层级跳转.html规范地址 无link的父分类渲染为不可点击的纯文本 -->
              <el-breadcrumb-item
                v-else
                :to="item.link ? { path: docHtmlPath(item.link) } : undefined"
              ><span class="chain-name" :class="{last: item.isLast, plain: !item.link}"><span v-if="item.isLast" class="hash-prefix"># </span>{{ item.name }}</span></el-breadcrumb-item>
            </template>
          </el-breadcrumb>
</template>

<script lang="ts">
import Category from '@/dto/Category';
import DocUtils from '@/util/DocUtils';
import { defineComponent } from 'vue'

// 面包屑展示项 ellipsis为true时表示折叠的中间层级占位
interface BreadcrumbDisplayItem {
  key: string;
  name: string;
  link: string;
  isLast: boolean;
  ellipsis: boolean;
}

export default defineComponent({
  setup() {

  },
  methods: {
    // 解析层级链接为.html规范地址 直接命中静态化路由 避免/doc/:id的一次重定向
    docHtmlPath(link: string) {
      return DocUtils.docId2HtmlPath(DocUtils.docUrl2Id(link));
    },
    getCategoryChain(value: Category) {
      const chainList: Category[] = [value];
      while (value.parent) {
        chainList.push(value.parent);
        value = value.parent;
      }
      return chainList.reverse();
    },
    // 分类节点转展示项 link可能为空(纯分类节点) 此时不渲染链接
    toDisplayItem(category: Category, index: number): BreadcrumbDisplayItem {
      return {
        key: category.name + '-' + index,
        name: category.name,
        link: category.link || '',
        isLast: index == this.categoryChainList.length - 1,
        ellipsis: false,
      };
    },
  },
  computed: {
    currentCategory(): Category {
      return this.$store.state.currentCategory;
    },
    categoryChainList(): Category[] {
      if (!this.currentCategory) {
        return [];
      }
      return this.getCategoryChain(this.currentCategory);
    },
    // 完整链路文案 折叠时由tooltip展示
    fullChainPath(): string {
      return this.categoryChainList.map(c => c.name).join(' / ');
    },
    // 超过4级时折叠中间层级: 首级 / … / 倒数第二级 / 当前级
    displayChainList(): BreadcrumbDisplayItem[] {
      const chain = this.categoryChainList;
      if (chain.length <= 4) {
        return chain.map((c, index) => this.toDisplayItem(c, index));
      }
      return [
        this.toDisplayItem(chain[0], 0),
        { key: 'ellipsis', name: '', link: '', isLast: false, ellipsis: true },
        this.toDisplayItem(chain[chain.length - 2], chain.length - 2),
        this.toDisplayItem(chain[chain.length - 1], chain.length - 1),
      ];
    },
  }
})
</script>

<style lang="less" scoped>
.hash-prefix {
  color: var(--primary-color);
  font-weight: 600;
  margin-right: 1px;
}

.chain-name {
  color: var(--main-text-color);
}
.chain-name.last {
  color: var(--secondary-text-color);
}
// 无link的父分类: 纯文本展示 不可点击
.chain-name.plain {
  color: var(--secondary-text-color);
  cursor: default;
}
.chain-name:hover:not(.last):not(.plain) {
  transition: all 0.2s;
  color: var(--el-color-primary);
}

// 折叠占位的省略号
.chain-ellipsis {
  color: var(--secondary-text-color);
  cursor: help;
}
</style>
