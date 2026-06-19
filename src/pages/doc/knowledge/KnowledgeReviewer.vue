<template>
  <el-drawer
    v-model="showDrawer"
    class="knowledge-review"
    :size="$isMobile() ? '90%' : '84%'"
    :with-header="false"
    :lock-scroll="true"
    resizable
  >
    <div class="review-panel">
      <div class="review-header">
        <span class="panel-title">知识回顾</span>
        <span class="panel-sub">质量 × 时间分布 · 共 {{ docList.length }} 篇</span>
        <button type="button" class="panel-close" title="关闭 (Esc)" aria-label="关闭知识回顾" @click="hide">
          <el-icon><close /></el-icon>
        </button>
      </div>

      <div class="review-body">
        <div class="review-scatter">
          <knowledge-scatter ref="knowledgeScatter" :doc="doc" @focus-doc="onScatterFocus" />
        </div>

        <aside class="review-side">
          <div class="review-controls">
            <div class="control-block">
              <div class="control-label">时间范围</div>
              <el-slider v-model="rangeValue" range :max="20" :show-tooltip="false" :marks="marks" />
            </div>
            <div class="control-block control-row">
              <div class="control-field">
                <span class="control-label">排序依据</span>
                <el-radio-group v-model="sort" size="small" @change="handleDisplayModeChange">
                  <el-radio-button value="时间">时间</el-radio-button>
                  <el-radio-button value="质量">质量</el-radio-button>
                </el-radio-group>
              </div>
              <div class="control-field">
                <span class="control-label">顺序</span>
                <el-radio-group v-model="displayMode" size="small" @change="handleDisplayModeChange">
                  <el-radio-button value="倒序">倒序</el-radio-button>
                  <el-radio-button value="正序">正序</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </div>

          <div class="review-timeline" ref="timelineEl">
            <el-timeline v-if="filterDocList.length">
              <el-timeline-item
                v-for="item in filterDocList"
                :key="item[0]"
                placement="top"
                :timestamp="formatRelative(item[1].date)"
              >
                <div
                  class="doc-item"
                  :class="{ current: item[0] === doc, focused: item[0] === focusedId }"
                  @mouseenter="onItemEnter(item[0])"
                  @mouseleave="onItemLeave"
                >
                  <a class="doc-name" href="#" @click.prevent="go(item[0])">{{ docName(item[0]) }}</a>
                  <span v-if="item[0] === doc" class="doc-current-tag">当前</span>
                  <span class="doc-quality" :title="quality(item[0])">⚽ {{ qualityScore(item[0]) }}</span>
                </div>
                <a
                  v-if="item[1].message"
                  class="doc-commit"
                  :href="repoUrl + '/commit/' + item[1].hash"
                  target="_blank"
                  :title="item[1].message"
                >{{ item[1].message }}</a>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="该时间范围内暂无文档" :image-size="80" />
          </div>
        </aside>
      </div>
    </div>
  </el-drawer>
</template>


<script lang="ts">
import api from "@/api";
import CommitInfo from "@/dto/CommitInfo";
import DocUtils from "@/util/DocUtils";
import { defineComponent, CSSProperties } from "vue";
import { Close } from "@element-plus/icons-vue";
import config from "@/config";
import DocService from "@/service/DocService";
import KnowledgeScatter from './KnowledgeScatter.vue'

interface Mark {
  style: CSSProperties
  label: string
}
type Marks = Record<number, Mark | string>

export default defineComponent({
  props: {
    doc: {
      type: String,
      required: true
    }
  },
  components: {
    KnowledgeScatter,
    Close
  },
  data() {
    return {
      displayMode: '倒序' as '正序' | '倒序',
      sort: '时间' as '时间' | '质量',
      showDrawer: false as boolean,
      repoUrl: config.repositoryUrl,
      rangeValue: [0, 20],
      docList: [] as [string, CommitInfo][],
      focusedId: '' as string, // 散点悬停联动: 时间线里高亮/定位的文档id

      marks: {
        0: '现在',
        1: {
          style: {
            "margin-top": '-24px'
          },
          label: '1天内'
        },
        3: '1周内',
        6: {
          style: {
            "margin-top": '-24px'
          },
          label: '1月内'
        },
        10: {
          style: {
          },
          label: '6月内',
        },
        20: '最远'
      } as Marks
    };
  },
  watch: {
    // 抽屉打开后定位到当前文档(数据可能尚在加载 created完成后会再滚一次)
    showDrawer(val: boolean) {
      if (val) {
        this.$nextTick(() => this.scrollToCurrent());
      }
    }
  },
  computed: {
    filterDocList(): [string, CommitInfo][]{
      const now = new Date().getTime()
      let left = this.rangeMapping(this.rangeValue[0])
      let right = this.rangeMapping(this.rangeValue[1])
      const startTime = now - left * 3600 * 1000 * 24
      const endTime = now - right * 3600 * 1000 * 24

      return this.docList.filter((v : [string, CommitInfo]) => {
        const time = new Date(v[1].date).getTime()
        return time >= endTime && time <= startTime
      })
    }
  },
  methods: {
    docId2Url: DocUtils.docId2Url,
    docUrl2Id: DocUtils.docUrl2Id,
    // 文档展示名: 路径还原后去后缀 (字面'-'已由docId2Url转义处理)
    docName(id: string): string {
      return this.docId2Url(id).replace(/\.(md|html)$/i, '');
    },
    go(id: string) {
      this.$router.push('/doc/' + id);
    },
    // 相对时间: 列表里比完整时间戳更易扫读
    formatRelative(dateStr: string): string {
      const diff = new Date().getTime() - new Date(dateStr).getTime();
      const day = 86400000;
      if (diff < day) return '今天';
      const days = Math.floor(diff / day);
      if (days < 7) return `${days} 天前`;
      if (days < 30) return `${Math.floor(days / 7)} 周前`;
      if (days < 365) return `${Math.floor(days / 30)} 个月前`;
      return `${Math.floor(days / 365)} 年前`;
    },
    // 将滑动条刻度位置转为"距今天数"阈值: 现在/1天/1周/1月/6月/最远
    // [上界(不含), 天数] —— val 落在前一个上界与该上界之间即取该天数; 越过末档为"最远"(不设下限)
    rangeMapping(val: number): number {
      const STOPS: [number, number][] = [
        [1, 0],
        [3, 1],
        [6, 7],
        [10, 30],
        [20, 180]
      ]
      for (const [upper, days] of STOPS) {
        if (val < upper) {
          return days
        }
      }
      return Infinity
    },
    quality(id: string): string{
      return DocService.calcQuanlityStr(id)
    },
    // 仅取分数部分做徽章 完整排名信息走title悬浮
    qualityScore(id: string): string {
      const q = DocService.getDocQuality(id);
      return q ? q.quality.toFixed(2) : '未知';
    },
    show() {
      this.showDrawer = true;
    },
    hide() {
      this.showDrawer = false;
    },
    // 列表滚动到当前文档(回顾时一眼看到它在历史中的位置)
    scrollToCurrent() {
      const container = this.$refs.timelineEl as HTMLElement;
      const el = container?.querySelector('.doc-item.current') as HTMLElement;
      el?.scrollIntoView({ block: 'center' });
    },
    sortByQuantity() {
      if (this.displayMode == '倒序') {
        this.docList = this.docList.sort((b, a) => (DocService.getDocQuality(a[0])?.quality || 0) - (DocService.getDocQuality(b[0])?.quality || 0))
      }else {
        this.docList = this.docList.sort((a, b) => (DocService.getDocQuality(a[0])?.quality || 0) - (DocService.getDocQuality(b[0])?.quality || 0))
      }
    },
    sortByTime() {
      if (this.displayMode == '倒序') {
        this.docList = this.docList.sort((a, b) => new Date(a[1].date).getTime() - new Date(b[1].date).getTime() )
      }else {
        this.docList = this.docList.sort((b, a) => new Date(a[1].date).getTime() - new Date(b[1].date).getTime() )
      }
    },
    handleDisplayModeChange() {
      if (this.sort == '时间') {
        this.sortByTime();
      }else {
        this.sortByQuantity()
      }
      // 排序后列表回顶 (原选择器.knowledge-review .el-drawer__body不存在 改用列表容器ref)
      (this.$refs.timelineEl as HTMLElement)?.scrollTo(0, 0);
    },
    // 散点 hover → 在时间线里定位并高亮该文档("图→线"联动)
    onScatterFocus(id: string | null) {
      this.focusedId = id || '';
      if (id) {
        this.$nextTick(() => {
          const el = (this.$refs.timelineEl as HTMLElement)?.querySelector('.doc-item.focused');
          el?.scrollIntoView({ block: 'nearest' });
        });
      }
    },
    // 时间线 hover → 高亮散点图上对应文档(离开时取消)("线→图"联动)
    onItemEnter(id: string) {
      (this.$refs.knowledgeScatter as any)?.highlightDoc(id);
    },
    onItemLeave() {
      (this.$refs.knowledgeScatter as any)?.highlightDoc(null);
    }
  },
  async created() {
    this.docList = await api.getDescCommitDocList()
    if (this.sort == '时间') {
        this.sortByTime();
      }else {
        this.sortByQuantity()
      }
    // 数据就绪且抽屉已打开时定位当前文档(覆盖"先show后数据到"的时序)
    this.$nextTick(() => {
      if (this.showDrawer) {
        this.scrollToCurrent();
      }
    });
  }
});
</script>

<style lang="less">
.knowledge-review .el-drawer__body {
  padding: 0;
}
</style>

<style lang="less" scoped>
.review-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.review-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  padding: 8px var(--spacing-sm) 8px var(--spacing-md);
  border-bottom: 1px solid var(--divider-color);
  background-color: var(--card-bg-color);
}

.panel-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--main-text-color);
  flex-shrink: 0;
}

.panel-sub {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-sm);
  color: var(--secondary-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-close {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--secondary-text-color);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);

  &:hover {
    background-color: var(--hover-bg-color);
    color: var(--main-text-color);
  }
}

// 主体: 左散点图 + 右控制/时间线 桌面横向 移动纵向
.review-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.review-scatter {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
}

.review-side {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-left: 1px solid var(--divider-color);
}

// 移动裁切: 768 收敛到 @bp-mobile(820), 移动带 +52px 可接受
@media screen and (max-width: @bp-mobile) {
  .review-body {
    flex-direction: column;
  }
  .review-scatter {
    flex: 0 0 auto;
    height: 45%;
  }
  .review-side {
    flex: 1;
    border-left: none;
    border-top: 1px solid var(--divider-color);
  }
}

// 控制区: 卡片化 不再fixed定位漂在抽屉上
.review-controls {
  flex-shrink: 0;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--divider-color);
}

.control-block {
  & + .control-block {
    margin-top: var(--spacing-md);
  }
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.control-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
}

// 时间范围滑块需要给刻度标签留出上下行程
.control-block:first-child {
  padding: 4px var(--spacing-sm) 24px;
}

.review-timeline {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) var(--spacing-sm);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-color);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover-color);
  }

  :deep(.el-timeline-item__timestamp) {
    color: var(--secondary-text-color);
    font-size: var(--font-size-xs);
  }
  :deep(.el-timeline-item:hover .el-timeline-item__node) {
    background-color: var(--primary-color);
  }
}

.doc-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  // 负 margin 抵消内边距, hover/联动高亮不挤动列表布局
  padding: 2px 4px;
  margin: -2px -4px;
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);

  // hover 自身, 或被散点图悬停联动选中(focused), 都高亮
  &:hover,
  &.focused {
    background-color: var(--hover-bg-color);
  }

  // 当前文档: 主色高亮 与散点图当前节点呼应
  &.current .doc-name {
    color: var(--primary-color);
    font-weight: 600;
  }
}

.doc-current-tag {
  flex-shrink: 0;
  padding: 0 6px;
  font-size: var(--font-size-xs);
  line-height: 16px;
  color: #fff;
  background-color: var(--primary-color);
  border-radius: 999px;
}

.doc-name {
  flex: 1;
  min-width: 0;
  text-decoration: none;
  color: var(--main-text-color);
  font-weight: 500;
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--primary-color);
  }
}

.doc-quality {
  flex-shrink: 0;
  padding: 1px 8px;
  font-size: var(--font-size-xs);
  color: var(--primary-color);
  background-color: var(--primary-light-color);
  border-radius: 999px;
  white-space: nowrap;
}

.doc-commit {
  display: block;
  margin-top: 4px;
  text-decoration: none;
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--primary-color);
  }
}
</style>
