<template>
  <section class="stat-section">
    <h2 class="section-title">站点统计</h2>

    <!-- 9 张指标卡: 小图标 + 上方标签 + 下方大号数字, 单位弱化 -->
    <div class="stat-grid">
      <div class="stat-card">
        <el-icon class="stat-icon"><coin /></el-icon>
        <span class="stat-label">仓库尺寸</span>
        <span class="stat-value">{{ repositorySizeReadable }}</span>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon"><check /></el-icon>
        <span class="stat-label">提交频率</span>
        <span class="stat-value">{{ fmt(info.commit.commitPerDay) }}<small>次/天</small></span>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon"><aim /></el-icon>
        <span class="stat-label">日均行数</span>
        <span class="stat-value">{{ fmt(info.commit.linePerDay) }}<small>行/天</small></span>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon"><document /></el-icon>
        <span class="stat-label">总字数</span>
        <span class="stat-value">{{ fmt(info.word.total) }}<small>字</small></span>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon"><document /></el-icon>
        <span class="stat-label">日均字数</span>
        <span class="stat-value">{{ fmt(info.word.wordPerDay) }}<small>字/天</small></span>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon"><notebook /></el-icon>
        <span class="stat-label">章节数</span>
        <span class="stat-value">{{ fmt(info.chapterCount) }}</span>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon"><picture-filled /></el-icon>
        <span class="stat-label">图片数</span>
        <span class="stat-value">{{ fmt(info.imageCount) }}</span>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon"><clock /></el-icon>
        <span class="stat-label">首次提交</span>
        <span class="stat-value stat-date">{{ formatDate(info.firstCommitDate) }}</span>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon"><calendar /></el-icon>
        <span class="stat-label">最后更新</span>
        <span class="stat-value stat-date">{{ formatDate(info.generateTime) }}</span>
      </div>
    </div>

    <!-- 5 张图表卡, 竖直堆叠; 标题归属父级 chart-title -->
    <div class="chart-grid">
      <div class="chart-card">
        <h3 class="chart-title">代码构成</h3>
        <!-- CodeFrequency 自行归一化, 父级只传原始数据并等数据到位再挂载, 避免空态闪烁 -->
        <code-frequency :code-frequency="info.codeFrequency" v-if="info.codeFrequency.length" />
      </div>
      <div class="chart-card chart-card--wide">
        <h3 class="chart-title">提交日历</h3>
        <heat-map />
      </div>
      <div class="chart-card">
        <h3 class="chart-title">各时段提交<small>GMT+8</small></h3>
        <hour-commit-heatmap />
      </div>
      <div class="chart-card chart-card--wide">
        <h3 class="chart-title">提交趋势</h3>
        <commit-total-trend />
      </div>
      <div class="chart-card chart-card--wide">
        <h3 class="chart-title">词云</h3>
        <word-cloud />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import HourCommitHeatmap from "./HourCommitHeatmap.vue"
import CommitTotalTrend from "./CommitTotalTrend.vue";
</script>

<script lang="ts">
import { Coin, Check, Document, Notebook, PictureFilled, Aim, Clock, Calendar } from "@element-plus/icons-vue";
import { defineComponent } from "vue";
import { useServices } from '@/platform/web/app/useServices'
const { api } = useServices()
import { StatisticInfo } from "@/core/domain/StatisticInfo";
import { formatNumber, byteSizeReadable } from '@/core/util/FormatUtils'
import { localeDateOrDash } from '@/core/util/DateUtils'
import HeatMap from './HeatMap.vue'
import WordCloud from './WordCloud.vue'
import CodeFrequency from './CodeFrequency.vue'

export default defineComponent({
  components: {
    Coin,
    Check,
    Document,
    Notebook,
    PictureFilled,
    Aim,
    Clock,
    Calendar,
    HeatMap,
    WordCloud,
    CodeFrequency,
  },
  data() {
    return {
      info: new StatisticInfo() as StatisticInfo,
    };
  },
  computed: {
    repositorySizeReadable(): string {
      return byteSizeReadable(this.info.repositorySize);
    },
  },
  methods: {
    fmt(n: number): string {
      return formatNumber(n);
    },
    formatDate(date: string): string {
      return localeDateOrDash(date);
    },
  },
  async created() {
    // 与 Banner/HomeQuickAccess 容错口径一致: 取不到统计数据时各卡片走默认占位, 不残留半态
    try {
      this.info = await api.getStatisticInfo();
    } catch { /* 数据缺失时保持默认值 */ }
  },
});
</script>

<style lang="less" scoped>
.stat-section {
  max-width: var(--home-max);
  margin: 0 auto;
  padding: 0 var(--content-pad);
  width: 100%;
}
.section-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--main-text-color);
  margin: 0 0 var(--spacing-lg);
}

// 指标卡: 自适应列, 无需 $isMobile() 分套
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-2xl);
}
// 大屏宽档: 抬高列下限, 卡片更宽不显细长
@media (min-width: @bp-wide) {
  .stat-grid {
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: var(--spacing-lg);
  }
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}
.stat-icon {
  font-size: var(--font-size-lg);
  color: var(--primary-color);
}
.stat-label {
  font-size: var(--font-size-sm);
  color: var(--secondary-text-color);
}
.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--main-text-color);
  line-height: 1.2;

  // 单位更小且弱化
  small {
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--secondary-text-color);
    margin-left: var(--spacing-xs);
  }
}
// 日期较长, 降一档字号避免溢出
.stat-date {
  font-size: var(--font-size-lg);
}

// 图表卡: 默认单列堆叠(grid 单列与 flex column 视觉一致); 宽档转两列
.chart-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
}
// 大屏宽档: 紧凑图(代码构成/各时段)成对, 天然宽图(日历/趋势/词云)跨满两列;
// dense 让紧凑图回填首行, 杜绝整行留白(半宽日历会比当前更窄, 故宽图坚持满宽)
@media (min-width: @bp-wide) {
  .chart-grid {
    grid-template-columns: 1fr 1fr;
    grid-auto-flow: row dense;
    // 图表区独享更宽上限: 在 --home-max(1320)容器内对称破出到 --home-max-wide, 仍居中同轴
    // (负 margin 破出, 不用 transform 以免成为 echarts 浮层定位的包含块)
    // @bp-wide 起视口恒 >=1680, 故 1480 永不溢出, 无需 min() 夹断(且 Less 会把裸 min() 误判为内置函数)
    width: var(--home-max-wide);
    margin-inline: calc((100% - var(--home-max-wide)) / 2);
  }
  .chart-card--wide {
    grid-column: 1 / -1;
  }
}
.chart-card {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--card-pad);
  box-shadow: var(--shadow-sm);
}
.chart-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--main-text-color);
  margin: 0 0 var(--spacing-md);

  small {
    color: var(--secondary-text-color);
    font-weight: 400;
    font-size: var(--font-size-xs);
    margin-left: 6px;
  }
}
</style>
