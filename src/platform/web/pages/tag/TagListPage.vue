<template>
  <div class="tag-page" ref="container">
    <h1 class="page-title">标签</h1>
    <div class="search-box">
      <el-input v-model="kw" placeholder="搜索标签" size="large" clearable>
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 已选工具条: 有选中时才出现, 提供数量提示与一键清除 -->
    <div class="tag-toolbar" v-if="selectedCount">
      <span>已选 {{ selectedCount }} 个标签</span>
      <button class="tag-clear" @click="clearSelection">清除</button>
    </div>

    <transition-group name="list" tag="div" class="tag-zone">
      <button
        v-for="item in filtedTags"
        :key="item.tag"
        class="tag-chip"
        :class="{ 'is-active': checkedMap[item.tag] }"
        :style="chipStyle(item)"
        :aria-pressed="!!checkedMap[item.tag]"
        @click="handleTagClick(item.tag)"
      >
        {{ item.tag }}<span class="tag-chip-count">{{ item.count }}</span>
      </button>
    </transition-group>
    <p v-if="!filtedTags.length" class="tag-empty">未找到匹配标签</p>

    <!-- 数据展示区: 选中标签后展示并集文章, 否则给出引导 -->
    <div class="data-container">
      <tag-chapter-zone v-if="chapters.length" :chapters="chapters" />
      <p v-else class="data-hint">选择上方标签查看相关文章</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import TagChapterZone from './TagChapterZone.vue'
</script>

<script lang="ts">
import { useServices } from '@/platform/web/app/useServices'
const { api } = useServices()
import { defineComponent } from "vue";
import TouchUtils from "@/platform/web/util/TouchUtils";
import { SysUtils } from "@/platform/web/util/SysUtils";

interface TagItem {
  tag: string
  count: number
  chapters: string[]
  size: number   // 按文档数加权的字号
  color: string  // 按文档数加权的品牌色(冷→灰 热→主色)
}

// 标签字号区间(px): 文档越多越大
const MIN_SIZE = 13
const MAX_SIZE = 26

export default defineComponent({
  data() {
    return {
      tags: [] as TagItem[],
      // 记录标签是否被选中
      checkedMap: {} as Record<string, boolean>,
      kw: "" as string,
    };
  },
  methods: {
    handleTagClick(tag: string) {
      this.checkedMap[tag] = !this.checkedMap[tag];
    },
    clearSelection() {
      this.checkedMap = {};
    },
    // 未选中: 应用加权字号+品牌色; 选中: 仅保留字号, 配色交给 .is-active 类(主色实底)
    chipStyle(item: TagItem) {
      return this.checkedMap[item.tag]
        ? { fontSize: item.size + 'px' }
        : { fontSize: item.size + 'px', color: item.color };
    },
  },
  computed: {
    selectedCount(): number {
      return Object.values(this.checkedMap).filter(Boolean).length;
    },
    filtedTags(): TagItem[] {
      // 大小写不敏感: 搜 SQL/java/NoSQL 也能命中
      const kw = this.kw.toLowerCase();
      return this.tags.filter((v) => v.tag.toLowerCase().includes(kw));
    },
    chapters(): string[] {
      // 并集: 选中任一标签的文章都列出, 去重
      const list: string[] = this.tags
        .filter((v) => this.checkedMap[v.tag])
        .flatMap((v) => v.chapters)
      return Array.from(new Set(list))
    },
  },
  async created() {
    // 数据缺失时优雅降级(留空标签云), 避免未捕获 rejection
    try {
      const list = (await api.getTagMapping()).map((v) => ({
        tag: v[0],
        count: v[1].length,
        chapters: v[1],
      }));
      // 全量 min/max 用于加权(与搜索过滤解耦, 过滤时字号不抖动)
      const counts = list.map((v) => v.count)
      const max = Math.max(...counts, 1)
      // 不给 min 播 0 种子: 否则等量数据集会 ratio 恒为 1 全部放大(语义反转)
      const min = Math.min(...counts)
      this.tags = list.map((v) => {
        const ratio = (v.count - min) / (max - min || 1)
        const size = Math.round(MIN_SIZE + ratio * (MAX_SIZE - MIN_SIZE))
        // color-mix: 冷标签偏正文色(高对比), 热标签偏主色; 暗色下同令牌自动适配
        const pct = Math.round(35 + ratio * 55)
        const color = `color-mix(in srgb, var(--primary-color) ${pct}%, var(--main-text-color))`
        return { tag: v.tag, count: v.count, chapters: v.chapters, size, color }
      });
      // url query.tag 预选: 校验标签存在, 避免不存在/拼错时产生"幽灵选中态"
      const pre = this.$route.query.tag?.toString()
      if (pre && this.tags.some((t) => t.tag === pre)) {
        this.checkedMap[pre] = true
      }
    } catch { /* 标签数据缺失时留空 */ }
  },
  mounted() {
    SysUtils.setDocTitle('标签')
    // 右滑返回手势($refs 在 mounted 阶段已就绪)
    TouchUtils.onSwipe(this.$refs.container as HTMLElement, (direction, delta) => {
      if (direction[0] == 'right' && delta[0] > 150) {
        history.back()
      }
    })
  },
});
</script>

<style lang="less" scoped>
.tag-page {
  max-width: var(--home-max);
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--content-pad) var(--spacing-3xl);
  min-height: 70vh;
}

.page-title {
  text-align: center;
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--main-text-color);
  margin: 0 0 var(--spacing-lg);
}

.search-box {
  max-width: 560px;
  margin: 0 auto var(--spacing-xl);

  // 圆角搜索框: 走令牌, 取代写死的 24px/12px 24px/icon margin hack
  :deep(.el-input__wrapper) {
    border-radius: var(--radius-xl);
    padding: 4px var(--spacing-md);
  }
}

.tag-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--secondary-text-color);
}
.tag-clear {
  border: none;
  background: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--hover-bg-color);
  }
}

.tag-zone {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center; // 不同字号胶囊在行内居中对齐, 不被 stretch 拉成等高
  gap: var(--spacing-sm);
  max-width: var(--content-max);
  margin: 0 auto var(--spacing-2xl);
}

.tag-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: 999px; // 胶囊形
  background-color: var(--card-bg-color);
  line-height: 1.4;
  cursor: pointer;
  transition: border-color var(--transition-fast), background-color var(--transition-fast),
    color var(--transition-fast), transform var(--transition-fast);

  &:hover {
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }

  &.is-active {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
  }
}
.tag-chip-count {
  font-size: var(--font-size-xs);
  opacity: 0.65;
}

.tag-empty,
.data-hint {
  text-align: center;
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
  margin: 0;
}

// 数据卡: 与首页卡片语言一致
.data-container {
  max-width: 760px;
  margin: 0 auto;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--card-pad);
  box-shadow: var(--shadow-sm);
}

// 大屏宽档: 标签云/数据卡呼吸; 匹配文章列表分两栏(仅本页用, 不波及 TagList 悬浮层复用)
@media (min-width: @bp-wide) {
  .tag-zone {
    max-width: 1100px;
  }
  .data-container {
    max-width: 960px;
  }
  :deep(.chapter-list) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px var(--spacing-lg);
  }
}

// 标签进出场动画
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: @bp-mobile) {
  .tag-page {
    padding-top: var(--spacing-lg);
  }
}
</style>
