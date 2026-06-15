# 设计语言指南（Design Language）

> 本文档是站点前端「设计语言 / 视觉风格 / 交互约定」的唯一参考，用以**指导后续的调整与设计**。
> 改动任何页面/组件前请先对照本文；新增样式若与此处冲突，要么遵循本文，要么先更新本文再改代码。
>
> 单一事实来源：设计令牌定义在 [`src/style.less`](src/style.less)，断点定义在 [`src/const/breakpoints.ts`](src/const/breakpoints.ts) / [`src/breakpoints.less`](src/breakpoints.less)，echarts 主题基建在 [`src/util/echart/`](src/util/echart/)。

---

## 0. 核心原则

1. **令牌单轨制**：组件样式只引用 `style.less` 里的语义令牌，不写死颜色/像素魔法值。
2. **暗色靠换值，不写第二份样式**：暗色由 `html.dark` 作用域重定义同名令牌实现；组件用了令牌就自动适配，**禁止新写 `body[theme=dark]` 覆写块**。
3. **卡片化语言贯穿全站**：内容块统一用「卡片」（`--card-bg-color` + `--border-color` + `--radius-xl` + `--shadow-sm`）。
4. **优雅降级**：任何异步数据都要有 加载态 / 空态 / 错误态，失败不留白屏、不抛未捕获 rejection。
5. **可访问性是默认项**：语义标题层级、键盘可达、焦点可见、图表有文本替代。
6. **响应式靠 CSS + 单一断点真源**，不靠 JS 双类切换硬分桌面/移动两套。

---

## 1. 设计令牌

所有值见 `src/style.less` 的 `:root`（亮色）与 `html.dark`（暗色换值）。下表为速查；**以源码为准**。

### 色彩
| 令牌 | 亮色 | 暗色 | 用途 |
|---|---|---|---|
| `--primary-color` | `#409eff`(EP 主色) | 同 | 品牌主色，改色只覆盖 `--el-color-primary` |
| `--primary-light-color` | `#ecf5ff` | 同 | 主色浅底 |
| `--success-color` / `--warning-color` / `--danger-color` | `#10b981` / `#f59e0b` / `#ef4444` | 同 | 状态语义色（callout/反馈/错误/高亮） |
| `--main-bg-color` | `#F1F5F9` | `#1e1e1e` | 页面底色 |
| `--card-bg-color` | `#ffffff` | `#252526` | 卡片/面板底 |
| `--elevated-bg-color` | `#ffffff` | `#2d2d30` | 弹层/菜单等悬浮表面 |
| `--hover-bg-color` | `#f8fafc` | `#2a2d2e` | hover 底 / 弱填充槽 / 胶囊底 |
| `--main-text-color` | `#1e293b` | `#e0e0e0` | 主文本 |
| `--secondary-text-color` | `#64748b` | `#a0a0a0` | 次级文本（说明/计数/轴标签） |
| `--border-color` | `#e2e8f0` | `#454545` | 边框/分隔 |
| `--divider-color` | `#f1f5f9` | `#2d2d30` | 更弱的分隔/网格线 |
| `--inline-code-color` / `--table-header-bg` / `--table-row-hover-bg` | 见源码 | 见源码 | markdown 正文专用 |

### 间距 / 布局
- 间距阶梯：`--spacing-xs 4` · `sm 8` · `md 16` · `lg 24` · `xl 32` · `2xl 48` · `3xl 64`。
- `--content-pad`: `clamp(8px, 4vw, 32px)` —— 内容区横向内边距，随视口流式收放（**优先用它做横向 padding**）。
- `--reading-measure: 820px`（正文阅读列宽）、`--content-max: 860px`（文档主区）、`--home-max: 1080px`（落地页/工具页内容中线）。

### 圆角
`--radius-sm 4` · `md 6` · `lg 8` · `xl 16`。卡片用 `xl`；小控件用 `md`；纯胶囊用 `999px`。

### 字号 / 行高 / 字体
- 字号：`--font-size-xs 12` · `sm 13` · `base 14` · `md 15` · `lg 16` · `xl 18` · `2xl 22` · `3xl 28`。
- 行高：`--leading-tight 1.4` · `normal 1.6` · `base 1.7` · `relaxed 1.8`。
- 字体栈：`--font-sans` / `--font-mono`。

### 动效
- `--transition-fast: .15s ease`（hover 等微交互）、`--transition-normal: .25s ease`（面板/布局）、`--transition-smooth`、`--transition-page`。
- 尊重 `prefers-reduced-motion`（`style.less` 已全局降级动画/平滑滚动）。

### 层级（z-index）
`--z-aside 10` · `--z-float 100` · `--z-header 200` · `--z-overlay 1000` · `--z-popup 3000`。
**自有弹层/右键菜单/拖拽窗用 `--z-popup`**（须压过 EP popper 的 2000 起自增），**不要再写 9999/10000**。

### 阴影 / 滚动条
- `--shadow-sm` / `md` / `lg`（暗色已加深）。卡片默认 `--shadow-sm`，悬浮层 `--shadow-md`。
- 自定义滚动条用 `--scrollbar-thumb-color` / `--scrollbar-thumb-hover-color`（裸 rgba 在暗色不可见）。

---

## 2. 暗色模式

- **CSS 侧**：真源是 `html.dark`（与 Element Plus 暗色变量同作用域），同名令牌换值。组件不写第二份暗色样式。
- **JS 侧**：读 `this.$store.state.isDarkMode`。切换走 `SysUtils.enterDarkMode/enterLightMode`（同时置 store + `html.dark` + `body[theme=dark]` 兼容标记）。
- **canvas/echarts** 无法用 `var()`：用 `getComputedStyle` 读令牌快照（见第 6 节 `chartTheme`），并 `watch isDark → 重渲染`。
- **HTML 浮层 tooltip** 可直接写 `var(--token)` 字符串（自动随主题变，无需重渲染）。

---

## 3. 响应式与断点

- **单一真源**：`MOBILE_MAX = 820`、`DESKTOP_MIN = 1280`、`COARSE_MAX = 1024`（`src/const/breakpoints.ts`）；less 侧 `@bp-mobile: 820px` / `@bp-desktop: 1280px`（全局注入）。
- **模板判断**：用全局 `$isMobile()`（响应式，跨断点自动重渲染）；脚本用 `useBreakpoint()`。
- **优先 CSS 响应式**：能用 `@media (max-width: @bp-mobile)` 或 `grid auto-fill/auto-fit` 自适应的，**不要用 `$isMobile()` 切两套类**（旧的 `xxx`/`mobile-xxx` 双类是被淘汰的写法）。
- 散落的 `860px` 等魔法断点一律收敛到 `@bp-mobile`。

---

## 4. 布局与节奏

- **落地页/工具页**：内容容器 `max-width: var(--home-max); margin: 0 auto; padding: 0 var(--content-pad)`，让多块内容左右边缘对齐同一中线。
- **全幅背景 + 限宽内容**：如 hero，背景渐变放全宽外层，文字放 `--home-max` 限宽内层（横向 padding 放内层，与下方块对齐）。
- **块间垂直节奏**：由父容器统一控制（如首页 `.home { display:flex; flex-direction:column; gap: var(--spacing-2xl) }`），子块不各写 margin。
- **图表/图谱类**可不收窄到 `--home-max`，用满横向空间，仅留 `--content-pad`。

---

## 5. 卡片与组件模式

### 卡片（基线）
```less
background-color: var(--card-bg-color);
border: 1px solid var(--border-color);
border-radius: var(--radius-xl);
padding: var(--spacing-lg);
box-shadow: var(--shadow-sm);
```

### 指标卡（stat-card）
小图标(`--primary-color`) + 上方小标签(`--font-size-sm` `--secondary-text-color`) + 下方大号数字(`--font-size-2xl` 600)，单位用 `<small>` 弱化。网格用 `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))` 自适应。数字统一千分位（`toLocaleString`），无效日期降级 `—`。

### 标签 / 胶囊（chip）
胶囊形 `border-radius: 999px`；底 `--hover-bg-color` 或 `--card-bg-color` + 边框；hover 边框转 `--primary-color`；选中态主色实底。可按数量加权字号 + 用 `color-mix(in srgb, var(--primary-color) N%, var(--main-text-color))` 做冷热色（热→主色、冷→正文色，保证对比）。

### 列表项（可点）
**用 `<router-link :to>` 而非 `@click.prevent + $router.push`**（保留 Ctrl/中键新标签页、右键复制）。截断文本加 `:title` 给全名；同名条目（"概述"/"index"）补灰色分类面包屑。

### 输入框（搜索）
圆角走令牌：`:deep(.el-input__wrapper) { border-radius: var(--radius-xl) }`，**不要写死 `24px`/`padding !important`/icon margin hack**；prefix 图标用 `#prefix` 插槽（自动对齐）；加 `aria-label`。

### 多选开关
统一用 `el-radio-group` + `el-radio-button`（`value="..."` 形式，**不要用已废弃的 `:label` 当值**）。

---

## 6. echarts 图表规范

统一基建在 [`src/util/echart/`](src/util/echart/)：

- **`chartTheme.ts`** — `buildChartTheme()` 用 `getComputedStyle` 读令牌快照，返回 `{ text, subText, axisLine, splitLine, surface, tooltipBg, tooltipBorder, primary, track }`；`tooltipStyle(theme)` 是统一 tooltip 片段。**图表内所有颜色取自该对象，禁止 `isDark ? '#xxx' : '#yyy'` 硬编码。**
- **`eChartMixin.ts`**（Options API mixin）— 统一 init / 暗色重渲染 / ResizeObserver / `showLoading` / 空·错降级 / keep-alive `activated` resize / `dispose`。
- 全局类（`style.less`）：`.chart-host`（相对定位）· `.chart-box`（默认 360px，全屏图在自身 scoped 覆写高度）· `.chart-overlay`（居中次级文字）。

**新图表组件骨架：**
```vue
<template>
  <div class="chart-host">
    <div ref="chartEl" class="chart-box" role="img" :aria-label="ariaLabel"></div>
    <div v-if="chartState === 'empty' || chartState === 'error'" class="chart-overlay" role="status">
      {{ chartState === 'empty' ? '暂无数据' : '数据加载失败' }}
    </div>
  </div>
</template>
<script lang="ts">
import eChartMixin from '@/util/echart/eChartMixin'
import { ChartTheme, tooltipStyle } from '@/util/echart/chartTheme'
// echarts.use([...]) 注册所需组件
export default defineComponent({
  mixins: [eChartMixin],
  methods: {
    async buildOption(theme: ChartTheme) {
      const data = await api.getXxx()
      if (!data?.length) return null            // → 空态
      return { /* 用 theme.* 上色, tooltip: { ...tooltipStyle(theme) } */ }
    },
  },
})
</script>
```
契约：子组件**只**提供 `ref="chartEl"`、`echarts.use([...])`、`async buildOption(theme)`（返回 option 或 `null`→空态；抛错→错误态）；切换维度调 `this.renderChart()`；**不要**自写 `echarts.init`/`window resize`/`dispose`/`isDark` watch。
图表标题交给外层 DOM 的 `<h3>`，echarts 内部 `title` 关闭。

---

## 7. 交互与状态

- **hover**：`--hover-bg-color` 底，或边框转 `--primary-color`，可 `transform: translateY(-1px)`，过渡用 `--transition-fast`。
- **键盘焦点**：依赖全局 `:focus-visible`（2px 主色环），**不要 `outline: none`**；需要更强提示时叠 `box-shadow`。
- **加载/空/错**：异步数据三态齐全；echarts 走 mixin；列表/卡片走 `v-if` + 占位文案；首屏脏值要守卫（如日期空值显 `—`、数据未就绪不渲染 0/Invalid）。
- **降级**：所有 `await api.x()` 包 `try/catch`，失败渲染错误态或隐藏该块，不抛未捕获 rejection。

---

## 8. 可访问性

- **标题层级**：每页有 `h1`（或 sr-only 地标），不跳级（`h1 → h2 → h3`）。
- **图表**：容器 `role="img"` + `aria-label` 概要；空/错覆盖层放在 `role="img"` 元素**之外**并加 `role="status"`（否则被 img 屏蔽）。
- **伪控件**：非 `<button>` 的可点元素加 `role="button"` `tabindex="0"` + `@keydown.enter/.space`；开关加 `aria-pressed`。
- **链接**：用 `router-link`/真实 `href`，保留修饰键与新标签页。
- **截断文本**：加 `:title` 暴露全名。

---

## 9. 反模式（明确禁止）

- ❌ 硬编码颜色 / 像素魔法值（用令牌）。
- ❌ 新写 `body[theme=dark]` 暗色覆写块（用 `html.dark` 令牌换值）。
- ❌ echarts 里 `isDark ? '#a' : '#b'` 三元配色（用 `chartTheme`）。
- ❌ 各自重写 echarts 生命周期样板（用 `eChartMixin`）。
- ❌ `$isMobile()` 切 `xxx`/`mobile-xxx` 双套类（用 CSS 媒体查询/自适应网格）。
- ❌ 散落断点魔法值（860 等）→ 用 `@bp-mobile`(820)。
- ❌ `@click.prevent + $router.push` 当链接（用 `router-link`）。
- ❌ `z-index: 9999`（用 `--z-*`，弹层 `--z-popup`）。
- ❌ 覆盖 EP 组件默认样式用单类名（注入顺序晚，要用 `.main-layout > .el-header` 两级选择器提特异性）。
- ❌ `el-radio-button :label="值"`（已废弃，用 `value="值"`）。

---

## 10. 已知约束与待办

- **选中态白字对比**：`#fff` on `--primary-color`(#409eff) 仅 2.78:1，未达 WCAG AA。这是全站统一约定（el-button / 标签选中 / 词云等），**不要单页改**；待引入 `--primary-strong` / `--on-primary` 令牌做全站专项。
- **IDE TS 缓存误报**：语言服务对 `DocUtils.docId2HtmlPath`、`useBreakpoint` 的 `isMobile` 导出等有持续陈旧缓存误报；**以 `npx vue-tsc --noEmit` 与 `npm run build` 为准**，重启 TS server 可消除。
- **dev 数据生成慢**：`CommitTotalTrendGenerator` 等首屏数据在 dev 端生成可达 ~170s，期间相关图表会短暂空白属正常（生产构建已含数据）。验证视觉优先跑生产 preview。
- Mind.vue 连接线、KnowledgeNetworkChart 个别废弃令牌等少量内联配色仍待统一。

---

## 11. 范本页面（参考实现）

| 页面 | 文件 | 体现的范式 |
|---|---|---|
| 首页 | [`src/pages/home/`](src/pages/home/) | hero 限宽 + 卡片化快速入口 + stat-card/chart-card + EventBus 唤起命令面板 |
| 标签页 | [`src/pages/tag/TagListPage.vue`](src/pages/tag/TagListPage.vue) | 加权品牌色标签云 + 卡片数据区 + 空态/无匹配反馈 |
| 聚类页 | [`src/pages/DocCluster.vue`](src/pages/DocCluster.vue) | eChartMixin 全屏图 + radial 布局 + 搜索高亮 + 令牌化暗色 |
| 知识网络 | `src/pages/doc/knowledge/KnowledgeNetworkChart.vue` | canvas 令牌快照 + isDark 重渲染 |

新增页面/组件时，优先照搬最接近的范本，再按本文校对。
