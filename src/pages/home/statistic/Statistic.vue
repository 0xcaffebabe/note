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
      <div class="chart-card">
        <h3 class="chart-title">提交日历</h3>
        <heat-map />
      </div>
      <div class="chart-card">
        <h3 class="chart-title">各时段提交<small>GMT+8</small></h3>
        <hour-commit-heatmap />
      </div>
      <div class="chart-card">
        <h3 class="chart-title">提交趋势</h3>
        <commit-total-trend />
      </div>
      <div class="chart-card">
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
import api from "@/api";
import { StatisticInfo } from "@/dto/StatisticInfo";
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
    // 字节 → MB; ≥1024MB 进位为 GB 保留 1 位小数
    repositorySizeReadable(): string {
      const mb = this.info.repositorySize / (1024 * 1024);
      return mb >= 1024
        ? `${(mb / 1024).toFixed(1)} GB`
        : `${Math.ceil(mb)} MB`;
    },
  },
  methods: {
    // 数字千分位
    fmt(n: number): string {
      return n.toLocaleString("en-US");
    },
    // 日期仅显示年月日; 空串/非法日期降级为占位符, 避免数据到位前首帧闪 "Invalid Date"
    formatDate(date: string): string {
      if (!date) {
        return '—';
      }
      const d = new Date(date);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
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

// 图表卡: 竖直堆叠
.chart-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
.chart-card {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
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
