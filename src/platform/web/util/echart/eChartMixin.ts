import { defineComponent, markRaw } from 'vue'
import * as echarts from 'echarts/core'
import { buildChartTheme, ChartTheme } from './chartTheme'
import { isWide as isWideBp } from '@/platform/web/composables/useBreakpoint'

// 首页 echarts 图表通用生命周期 mixin: 消除 4 张图重复的 init/resize/暗色重渲染/dispose 样板
//
// 子组件契约:
//   1. 模板中放一个 <div ref="chartEl" class="chart-box"></div> 容器(外层建议 .chart-host + role="img" + :aria-label)
//   2. 注册自身所需的 echarts 组件(echarts.use([...]))
//   3. 定义 async buildOption(theme: ChartTheme): 返回 echarts option; 数据缺失/为空时返回 null 触发空态
//   4. 需要时(如切换维度)调用 this.renderChart() 重渲染; this.chartState 可用于模板空/错态展示
//
// 健壮性: buildOption 抛错或返回 null 不会崩溃, 统一降级为 'error'/'empty' 态; 容器尺寸变化经 ResizeObserver 自适应

export type ChartState = 'loading' | 'ready' | 'empty' | 'error'

interface EChartHost {
  buildOption(theme: ChartTheme): Promise<echarts.EChartsCoreOption | null> | echarts.EChartsCoreOption | null
}

export default defineComponent({
  data() {
    return {
      chart: null as echarts.ECharts | null,
      chartState: 'loading' as ChartState,
      ro: null as ResizeObserver | null,
      resizeTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    }
  },
  computed: {
    isDark(): boolean {
      return this.$store.state.isDarkMode
    },
    // 大屏宽档: 供子组件 buildOption 换 echarts 配置(如 HeatMap cellSize); 跨档自动重渲染(见 watch)
    isWide(): boolean {
      return isWideBp.value
    },
  },
  watch: {
    isDark() {
      // 主题切换后令牌已换值, 复用实例重建 option(notMerge)即可, 无需 dispose
      this.$nextTick(() => this.renderChart())
    },
    isWide() {
      // 跨 @bp-wide 档: 重建 option 以应用宽档专属 echarts 配置(cellSize 等)
      this.$nextTick(() => this.renderChart())
    },
  },
  methods: {
    chartTheme(): ChartTheme {
      return buildChartTheme()
    },
    async renderChart() {
      const el = this.$refs.chartEl as HTMLElement | undefined
      if (!el) {
        return
      }
      if (!this.chart) {
        this.chart = markRaw(echarts.init(el))
      }
      const theme = this.chartTheme()
      this.chartState = 'loading'
      this.chart.showLoading({
        text: '',
        maskColor: 'transparent',
        color: theme.primary,
        spinnerRadius: 6,
        lineWidth: 2,
      })
      try {
        const option = await (this as unknown as EChartHost).buildOption(theme)
        // await 期间组件可能已被卸载(unmounted 里 dispose 后置 chart=null), 守卫避免在 null 上调用
        if (!this.chart) {
          return
        }
        this.chart.hideLoading()
        if (!option) {
          this.chartState = 'empty'
          this.chart.clear()
          return
        }
        // notMerge: 暗/亮或维度切换时彻底替换 option, 避免旧色/旧系列残留
        this.chart.setOption(option, true)
        this.chartState = 'ready'
      } catch (e) {
        // 数据文件缺失(构建跳过生成/离线)时 r.json() 会抛错, 这里统一降级不抛到全局
        console.warn('[chart] 数据加载失败, 降级为空态', e)
        this.chart?.hideLoading()
        this.chart?.clear()
        this.chartState = 'error'
      }
    },
    handleResize() {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => this.chart?.resize(), 120)
    },
  },
  mounted() {
    this.renderChart()
    const el = this.$refs.chartEl as HTMLElement | undefined
    if (el && typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.handleResize())
      this.ro.observe(el)
    }
    window.addEventListener('resize', this.handleResize)
  },
  activated() {
    // keep-alive 复显: 隐藏期容器尺寸可能已变, 复显后强制 resize 一次
    this.$nextTick(() => this.chart?.resize())
  },
  unmounted() {
    window.removeEventListener('resize', this.handleResize)
    this.ro?.disconnect()
    this.ro = null
    clearTimeout(this.resizeTimer)
    this.chart?.dispose()
    this.chart = null
  },
})
