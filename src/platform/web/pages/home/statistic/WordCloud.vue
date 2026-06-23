<template>
  <div class="wordcloud-wrapper">
    <canvas ref="canvasRef" id="wordcloud" role="img" :aria-label="ariaLabel"></canvas>
    <!-- 维度切换器: 与提交趋势图共用 el-radio-group 交互语言, 经 mode get/set 桥接到 toggleMode -->
    <el-radio-group
      class="mode-switch"
      size="small"
      aria-label="词云维度切换"
      v-model="mode"
    >
      <el-radio-button value="2D">2D</el-radio-button>
      <el-radio-button value="3D">3D</el-radio-button>
    </el-radio-group>
    <!-- 空/错态: 与其余 4 张图表卡统一的降级提示 -->
    <div v-if="wcState === 'empty' || wcState === 'error'" class="chart-overlay" role="status">
      {{ wcState === 'empty' ? '暂无数据' : '数据加载失败' }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { isWide as isWideBp } from "@/platform/web/composables/useBreakpoint";
import { parseColorToRgb, rgbToHue, hslToRgbString } from "@/core/util/ColorUtils";
import { fibonacciSpherePoint, projectPoint } from "@/core/algorithm/Geometry3D";
import {
  computeGridBox,
  checkGridCollision,
  markGrid,
  findSpiralPosition,
} from "@/core/algorithm/WordCloudLayout";

interface WordItem {
  name: string;
  value: number;
  x?: number; // 2D 位置的 x 或 3D 投影后的 x
  y?: number; // 2D 位置的 y 或 3D 投影后的 y
  z?: number; // 3D 深度
  baseX?: number; // 3D 基础位置 x（球面坐标）
  baseY?: number; // 3D 基础位置 y（球面坐标）
  baseZ?: number; // 3D 基础位置 z（球面坐标）
  size?: number;
  ratio?: number; // 归一化词频 [0,1]; 同时驱动字号/字重/颜色/透明度, 是整图层级的唯一信号源
  weight?: number; // 字重档位(400/500/600/700) 由 ratio 映射
  color?: string;
  projectedSize?: number; // 投影后的大小
}

interface GridMask {
  width: number;
  height: number;
  data: Uint8Array;
}

export default defineComponent({
  setup() {},
  data() {
    return {
      canvas: null as HTMLCanvasElement | null,
      ctx: null as CanvasRenderingContext2D | null,
      // PingFang 优先的跨平台字族: macOS/iOS 用更清秀的苹方替掉笨重的雅黑(Mac 上"丑"的主因),
      // 雅黑退为 Windows 兜底, 拉丁词交给各系统原生 UI 字体
      fontStack: '-apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif',
      words: [] as WordItem[],
      gridMask: null as GridMask | null,
      placedWords: [] as WordItem[],
      wordsData2D: [] as WordItem[], // 保存 2D 布局数据
      is3D: true,
      // 数据加载态: 空/错时显示统一降级覆盖层
      wcState: 'ready' as 'ready' | 'empty' | 'error',
      rotationAngleX: 0, // 绕 X 轴旋转（垂直方向）
      rotationAngleY: 0, // 绕 Y 轴旋转（水平方向）
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      animationId: null as number | null,
      tooltip: null as HTMLDivElement | null,
      boundDrag: null as ((e: PointerEvent) => void) | null,
      boundEndDrag: null as (() => void) | null,
      boundMouseDown: null as ((e: PointerEvent) => void) | null,
      // canvas 悬停监听(tooltip)的可移除引用: 重入 init 时先解绑 避免累积
      boundCanvasMove: null as ((e: PointerEvent) => void) | null,
      resizeObserver: null as ResizeObserver | null,
      resizeTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    };
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    },
    // el-radio-group 与内部布尔态 is3D 的桥接: 值用 '2D'/'3D' 字符串与切换器对齐
    mode: {
      get(): "2D" | "3D" {
        return this.is3D ? "3D" : "2D";
      },
      set(v: "2D" | "3D") {
        this.toggleMode(v === "3D");
      },
    },
    // canvas 是纯图形, 给屏幕阅读器一个概要(避免发布空的可交互图形元素)
    ariaLabel(): string {
      return `词云，共 ${this.words.length} 个高频词`;
    },
    // 大屏宽档: 最大词号随之放大(CSS 够不到的 canvas 字号常量), 跨档重排(见 watch)
    isWideTier(): boolean {
      return isWideBp.value;
    },
  },
  watch: {
    isDark() {
      this.init();
    },
    isWideTier() {
      // 跨 @bp-wide 档: 与 isDark 同款幂等重入, init() 内 maxSize 改读宽档值
      this.init();
    },
  },
  methods: {
    toggleMode(mode3D: boolean) {
      this.is3D = mode3D;
      if (this.is3D) {
        this.init3DLayout();
        this.render3D(); // 只渲染一次，不自动旋转
        if (this.canvas) {
          this.canvas.style.cursor = "grab";
        }
        // 重新绑定 3D 事件
        this.setup3DEvents();
      } else {
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
          this.animationId = null;
        }
        this.rotationAngleX = 0;
        this.rotationAngleY = 0;
        // 恢复 2D 数据
        if (this.wordsData2D.length > 0) {
          this.placedWords = [...this.wordsData2D];
          this.init2DRender();
        }
        // 移除 3D 事件
        this.remove3DEvents();
        // 2D 无拖拽, 立即恢复默认光标(不依赖后续 resize 重排再纠正)
        if (this.canvas) {
          this.canvas.style.cursor = "default";
        }
      }
    },

    // 设置 3D 事件
    setup3DEvents() {
      if (!this.canvas || !this.tooltip) return;

      const dpr = window.devicePixelRatio || 1;
      const tooltip = this.tooltip;
      const canvas = this.canvas;

      // 指针事件统一鼠标/触屏: 移动端可拖拽旋转 3D 词云
      this.boundMouseDown = (e: PointerEvent) => {
        this.startDrag(e);
      };

      this.boundDrag = (e: PointerEvent) => {
        if (this.isDragging) {
          this.drag(e);
        } else {
          this.handle3DMouseMove(e, tooltip, dpr);
        }
      };

      this.boundEndDrag = () => {
        this.endDrag();
      };

      canvas.addEventListener("pointerdown", this.boundMouseDown);
      document.addEventListener("pointermove", this.boundDrag);
      document.addEventListener("pointerup", this.boundEndDrag);
      document.addEventListener("pointercancel", this.boundEndDrag);
    },

    // 移除 3D 事件
    remove3DEvents() {
      if (this.canvas && this.boundMouseDown) {
        this.canvas.removeEventListener("pointerdown", this.boundMouseDown);
      }
      if (this.boundDrag) {
        document.removeEventListener("pointermove", this.boundDrag);
      }
      if (this.boundEndDrag) {
        document.removeEventListener("pointerup", this.boundEndDrag);
        document.removeEventListener("pointercancel", this.boundEndDrag);
      }
    },

    // 2D 重新渲染（不重新布局）
    init2DRender() {
      if (!this.ctx || !this.canvas) return;
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // 重新初始化网格掩码
      const maskWidth = Math.ceil(this.canvas.width / 2);
      const maskHeight = Math.ceil(this.canvas.height / 2);
      this.gridMask = {
        width: maskWidth,
        height: maskHeight,
        data: new Uint8Array(maskWidth * maskHeight),
      };
      
      // 重新绘制所有词
      this.placedWords.forEach(word => {
        if (word.x && word.y) {
          this.drawWord(word, word.x, word.y);
          this.markPlaced(word, word.x, word.y);
        }
      });
    },

    // 初始化 3D 布局
    init3DLayout() {
      if (!this.canvas) return;

      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      // 球半径收一档(0.7→0.6): 给透视放大后的前排词留出四周余量, 避免顶/底的大词投影出界被裁
      const radius = Math.min(centerX, centerY) * 0.6;

      // 为每个词分配 3D 位置（球面分布）
      this.placedWords.forEach((word, index) => {
        const p = fibonacciSpherePoint(index, this.placedWords.length, radius);
        word.baseX = p.x;
        word.baseY = p.y;
        word.baseZ = p.z;
      });
    },

    // 3D 投影
    project3D(word: WordItem): { x: number; y: number; scale: number } {
      if (!this.canvas || !word.baseX || !word.baseY || !word.baseZ) {
        return { x: word.x || 0, y: word.y || 0, scale: 1 };
      }

      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      // 焦距放大(0.8→1.0)压平透视: 前排词放大倍率从 ~8x 降到 ~2.5x, 头部大词不再撑爆画布
      const focalLength = Math.min(centerX, centerY) * 1.0;
      // projX 再按画布宽高比做各向异性拉伸, 让球体铺满宽卡片而非缩在中央方形区
      // (只拉伸最终屏幕 X, 不改 scale, 故前后景深度雾与命中盒仍一致)
      const stretchX = Math.min(centerX / centerY, 2.6);

      return projectPoint(
        { x: word.baseX, y: word.baseY, z: word.baseZ },
        this.rotationAngleX,
        this.rotationAngleY,
        centerX,
        centerY,
        focalLength,
        stretchX,
      );
    },

    // 渲染 3D 词云
    render3D() {
      if (!this.ctx || !this.canvas) return;
      // 收窄到非空局部: 下方 forEach 闭包内调用 this.buildFont() 会令 this.ctx 失窄, 用局部 ctx 规避
      const ctx = this.ctx;

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 先计算每个词旋转后的实际 Z 值，并保存投影信息
      const wordsWithDepth = this.placedWords
        .filter(word => word.baseX && word.baseY && word.baseZ)
        .map(word => {
          const projected = this.project3D(word);
          const projectedSize = word.size! * projected.scale;
          word.projectedSize = projectedSize;
          word.x = projected.x;
          word.y = projected.y;

          // 计算旋转后的实际 Z 值（用于排序）
          const cosY = Math.cos(this.rotationAngleY);
          const sinY = Math.sin(this.rotationAngleY);
          const cosX = Math.cos(this.rotationAngleX);
          const sinX = Math.sin(this.rotationAngleX);

          // 与 project3D 相同的旋转计算
          let rotX = word.baseX! * cosY - word.baseZ! * sinY;
          let rotZ = word.baseX! * sinY + word.baseZ! * cosY;
          let rotY = word.baseY!;

          const finalZ = rotY * sinX + rotZ * cosX;

          return {
            word,
            projected,
            finalZ,
          };
        });

      // 根据旋转后的 Z 值排序，远的（Z 值大的）先画
      wordsWithDepth.sort((a, b) => b.finalZ - a.finalZ);

      wordsWithDepth.forEach(({ word, projected }) => {
        const projectedSize = word.projectedSize!;
        // 深度雾: 远端词平滑渐隐到 ~0.18 而非在 0.3 处硬切, 球体读起来像有体积的浮空物而非散点
        const depthAlpha = Math.max(0.18, Math.min(1, (projected.scale - 0.3) / 0.7));
        ctx.save();
        ctx.font = this.buildFont(word.weight!, projectedSize);
        ctx.fillStyle = word.color!;
        // 深度透明度 × 词频透明度: 与 2D 用同一套层级意图; globalAlpha 取代旧的 rgb→rgba 字符串替换
        ctx.globalAlpha = depthAlpha * (0.62 + (word.ratio ?? 0) * 0.38);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(word.name, projected.x, projected.y);
        ctx.restore();
      });
    },

    startDrag(e: MouseEvent) {
      if (!this.is3D) return;
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas!.style.cursor = "grabbing";
    },

    drag(e: MouseEvent) {
      if (!this.is3D || !this.isDragging) return;

      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      // 水平拖动改变 Y 轴旋转角度（左右旋转）
      this.rotationAngleY += deltaX * 0.01;
      // 垂直拖动改变 X 轴旋转角度（上下旋转）
      this.rotationAngleX += deltaY * 0.01;

      this.render3D();
    },

    endDrag() {
      this.isDragging = false;
      if (this.canvas) {
        this.canvas.style.cursor = "grab";
      }
    },

    // 读品牌色 --primary-color 的色相: getComputedStyle 拿到的可能是 rgb()/十六进制,
    // 统一转 HSL 取 H, 作为整张色板的基准色相(取不到时回退 EP 默认蓝 210)
    getPrimaryHue(): number {
      if (typeof getComputedStyle === "undefined") return 210;
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary-color")
        .trim();
      const rgb = parseColorToRgb(raw);
      return rgb ? rgbToHue(rgb, 210) : 210;
    },

    parseColorToRgb(s: string): [number, number, number] | null {
      return parseColorToRgb(s);
    },

    hslToRgbString(h: number, s: number, l: number): string {
      return hslToRgbString(h, s, l);
    },

    // 统一字体串构造: 2D 绘制 / 3D 绘制 / 测宽 三处共用同一字重+字族, 杜绝漂移导致碰撞盒算错
    buildFont(weight: number, sizePx: number): string {
      return `${weight} ${sizePx}px ${this.fontStack}`;
    },

    // 颜色按「词频 ratio」走品牌蓝→蓝紫短色弧: 高频=饱和品牌蓝(前进), 低频=柔和长春花紫(后退)
    // 与字号/字重/透明度同源于一个 ratio, 让整张图读成一条设计过的频率梯度, 而非随机散点配色
    getWordColor(ratio: number, baseHue: number): string {
      // 色相只在 baseHue(~210 蓝) → baseHue+38(~248 蓝紫) 间走, 永不滑向青绿
      const hue = (baseHue + (1 - ratio) * 38 + 360) % 360;
      if (this.isDark) {
        // 暗色: 高频最亮; 低频地板抬到 ~62% L 保证仍可读(实测 ≈3.7:1 on #1e1e1e)
        const sat = 78 - (1 - ratio) * 20;
        const light = 70 - (1 - ratio) * 8;
        return this.hslToRgbString(hue, sat, light);
      }
      // 亮色: 高频深而饱和(≈6.4:1), 低频淡而低饱和地后退(≈4.0:1)
      const sat = 70 - (1 - ratio) * 26;
      const light = 38 + (1 - ratio) * 24;
      return this.hslToRgbString(hue, sat, light);
    },

    // 测宽必须与绘制用同一字重+字族, 否则 2D 碰撞盒尺寸与实际字形不符, 会重叠或留洞
    getTextWidth(text: string, fontSize: number, weight: number = 400): number {
      if (!this.ctx) return 0;
      const dpr = window.devicePixelRatio || 1;
      this.ctx.font = this.buildFont(weight, fontSize * dpr);
      return this.ctx.measureText(text).width;
    },

    // 词的碰撞盒(canvas 像素): 测宽(DOM)留在组件, 高度/padding 与原内联一致;
    // 网格坐标换算交给纯 computeGridBox。checkCollision/markPlaced/findPosition 共用。
    wordGridBox(word: WordItem, x: number, y: number) {
      const dpr = window.devicePixelRatio || 1;
      const width = this.getTextWidth(word.name, word.size!, word.weight);
      const height = word.size! * dpr; // 实际绘制的高度
      const padding = 6 * dpr; // 词之间的间距(放宽, 让更少更大的词更透气)
      return computeGridBox(
        this.gridMask!,
        this.canvas!.width,
        this.canvas!.height,
        x,
        y,
        width,
        height,
        padding,
      );
    },

    checkCollision(word: WordItem, x: number, y: number): boolean {
      if (!this.gridMask || !this.ctx) return false;
      return checkGridCollision(this.gridMask, this.wordGridBox(word, x, y));
    },

    markPlaced(word: WordItem, x: number, y: number): void {
      if (!this.gridMask || !this.ctx) return;
      markGrid(this.gridMask, this.wordGridBox(word, x, y));
    },

    findPosition(word: WordItem): { x: number; y: number } | null {
      if (!this.canvas) return null;

      const dpr = window.devicePixelRatio || 1;
      // 词的半包围盒(测宽走 DOM, 留在组件): 拉伸后外圈词可能被推到画布外, 螺旋逐点做越界判定
      const halfW = this.getTextWidth(word.name, word.size!, word.weight) / 2;
      const halfH = (word.size! * dpr) / 2;

      // 椭圆螺旋找位的纯几何在 core; 碰撞判定(含 DOM 测宽)经回调注入
      return findSpiralPosition(
        {
          canvasWidth: this.canvas.width,
          canvasHeight: this.canvas.height,
          size: word.size!,
          dpr,
          halfW,
          halfH,
        },
        (x, y) => this.checkCollision(word, x, y),
      );
    },

    drawWord(word: WordItem, x: number, y: number): void {
      if (!this.ctx) return;

      const dpr = window.devicePixelRatio || 1;
      this.ctx.save();
      this.ctx.font = this.buildFont(word.weight!, word.size! * dpr);
      this.ctx.fillStyle = word.color!;
      // 词频透明度档: 长尾词(~0.62)轻轻后退, 头部词(1.0)立得住, 与字号/字重/颜色同向强化层级
      this.ctx.globalAlpha = 0.62 + (word.ratio ?? 0) * 0.38;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(word.name, x, y);
      this.ctx.restore();
    },

    createTooltip(): void {
      if (!this.canvas) return;

      const tooltip = document.createElement("div");
      tooltip.id = "wordcloud-tooltip";
      tooltip.style.position = "absolute";
      tooltip.style.padding = "4px 8px";
      tooltip.style.borderRadius = "4px";
      tooltip.style.fontSize = "12px";
      tooltip.style.pointerEvents = "none";
      tooltip.style.display = "none";
      tooltip.style.zIndex = "1000";
      document.body.appendChild(tooltip);
      this.tooltip = tooltip;

      const dpr = window.devicePixelRatio || 1;

      this.boundCanvasMove = (e: PointerEvent) => {
        if (this.is3D && this.isDragging) {
          return;
        }

        if (this.is3D) {
          this.handle3DMouseMove(e, tooltip, dpr);
          return;
        }

        const rect = this.canvas!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let hovered = false;
        for (const word of this.placedWords) {
          // 转换为 CSS 像素坐标进行检测
          const cssX = word.x! / dpr;
          const cssY = word.y! / dpr;
          const cssSize = word.size!;
          const width = this.getTextWidth(word.name, cssSize, word.weight) / dpr;
          const height = cssSize;
          const left = cssX - width / 2;
          const right = cssX + width / 2;
          const top = cssY - height / 2;
          const bottom = cssY + height / 2;

          if (mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom) {
            tooltip.style.display = "block";
            tooltip.style.left = `${e.clientX + 10}px`;
            tooltip.style.top = `${e.clientY + 10}px`;
            tooltip.style.backgroundColor = this.isDark ? "#666" : "#fff";
            tooltip.style.color = this.isDark ? "#bbb" : "#333";
            tooltip.textContent = `${word.name}: ${word.value}`;
            // 词不可点(命令面板不支持预填关键词), 故 hover 不切换 pointer 光标, 仅展示词频
            hovered = true;
            break;
          }
        }

        if (!hovered) {
          tooltip.style.display = "none";
        }
      };

      // 指针事件: 2D 触屏点按/悬停也能命中 tooltip(仅展示词频, 不做跳转)
      this.canvas.addEventListener("pointermove", this.boundCanvasMove);
    },

    // 解绑全部交互监听 + 移除 tooltip(isDark 切换 / 容器 resize 重入 init 前调用, 防累积泄漏)
    teardownInteractions() {
      this.remove3DEvents();
      if (this.canvas && this.boundCanvasMove) {
        this.canvas.removeEventListener("pointermove", this.boundCanvasMove);
      }
      if (this.tooltip) {
        this.tooltip.remove();
        this.tooltip = null;
      }
    },

    handle3DMouseMove(e: MouseEvent, tooltip: HTMLDivElement, dpr: number) {
      const rect = this.canvas!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let hovered = false;
      for (const word of this.placedWords) {
        if (!word.baseX || !word.baseY || !word.baseZ) continue;

        const projected = this.project3D(word);
        const projectedSize = word.projectedSize || word.size!;

        const width = projectedSize * 1.5;
        const height = projectedSize;
        const left = projected.x - width / 2;
        const right = projected.x + width / 2;
        const top = projected.y - height / 2;
        const bottom = projected.y + height / 2;

        if (mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom && projected.scale > 0.2) {
          tooltip.style.display = "block";
          tooltip.style.left = `${e.clientX + 10}px`;
          tooltip.style.top = `${e.clientY + 10}px`;
          tooltip.style.backgroundColor = this.isDark ? "#666" : "#fff";
          tooltip.style.color = this.isDark ? "#bbb" : "#333";
          tooltip.textContent = `${word.name}: ${word.value}`;
          // 词不可点, 不改 pointer 光标; 保留拖拽的 grab 语义
          hovered = true;
          break;
        }
      }

      if (!hovered) {
        tooltip.style.display = "none";
      }
    },

    async init() {
      // 幂等重入(isDark 切换 / 容器 resize): 先解绑上一轮交互, 避免监听与 tooltip 累积
      this.teardownInteractions();
      // 数据缺失(构建跳过生成/离线)时 r.json() 会抛错; 统一降级为空/错态, 避免未捕获 rejection 与空白画布
      let list: [string, number][];
      try {
        list = await this.$services.api.getWordCloud();
      } catch {
        this.wcState = 'error';
        return;
      }
      if (!list.length) {
        this.wcState = 'empty';
        return;
      }
      this.wcState = 'ready';

      this.words = list.map((v: [string, number]) => ({
        name: v[0],
        value: v[1],
      }));

      // 按值排序，大的在前
      this.words.sort((a, b) => b.value - a.value);

      // 词数上限: 长尾(70+)几乎全是最小号噪声词, 截断后留下的词更大更透气(宽档画布更宽可多放)
      const MAX_WORDS = this.isWideTier ? 80 : 65;
      this.words = this.words.slice(0, MAX_WORDS);

      // max/min 取自截断后的数组, ratio 才在保留词上铺满 [0,1]
      const maxValue = this.words[0]?.value || 1;
      const minValue = this.words[this.words.length - 1]?.value || 1;

      // 字号: 抬高下限到 16(消灭糊作一团的 <16px 词) + pow(0.45) 缓和曲线把中段词顶起来
      const minSize = 16;
      const maxSize = this.isWideTier ? 58 : 52;

      // 取一次品牌色相, 整张词云共用一套「按词频」的蓝→蓝紫热力色板(替代旧的按序号循环)
      const baseHue = this.getPrimaryHue();
      this.words.forEach((word) => {
        const ratio = (word.value - minValue) / (maxValue - minValue || 1);
        word.ratio = ratio;
        // 缓和曲线: 长尾数据(中位远小于峰值)下用凹曲线把中段抬离下限, 而非线性压扁
        const eased = Math.pow(ratio, 0.45);
        word.size = Math.round(minSize + eased * (maxSize - minSize));
        // 字重 4 档: 头部 700 厚重立得住, 长尾 400 轻盈后退 —— 一举化解「全 bold 糊成一团」
        word.weight = ratio >= 0.66 ? 700 : ratio >= 0.40 ? 600 : ratio >= 0.18 ? 500 : 400;
        word.color = this.getWordColor(ratio, baseHue);
      });

      // 初始化 canvas
      this.canvas = document.getElementById("wordcloud") as HTMLCanvasElement;
      const container = this.canvas!.parentElement!;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      // 显示尺寸交给 CSS(width:100% / height:500px), 这里只按容器实际尺寸设置画布分辨率
      // 不再写死内联 px 宽高: 容器变窄时画布随 CSS 收缩而非横向溢出
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;

      this.ctx = this.canvas.getContext("2d")!;
      // 不设置 scale，直接使用设备像素，这样所有坐标都是实际像素

      // 清空画布
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 初始化网格掩码 (使用实际像素分辨率的一半)
      const maskWidth = Math.ceil(this.canvas.width / 2);
      const maskHeight = Math.ceil(this.canvas.height / 2);
      this.gridMask = {
        width: maskWidth,
        height: maskHeight,
        data: new Uint8Array(maskWidth * maskHeight),
      };

      this.placedWords = [];

      // 放置并绘制每个词
      for (const word of this.words) {
        const pos = this.findPosition(word);
        if (pos) {
          word.x = pos.x;
          word.y = pos.y;
          word.z = 0; // 2D 模式下 z 为 0
          this.drawWord(word, pos.x, pos.y);
          this.markPlaced(word, pos.x, pos.y);
          this.placedWords.push(word);
        }
      }

      // 保存 2D 布局数据（深拷贝）
      this.wordsData2D = this.placedWords.map(w => ({ ...w }));

      // 创建 tooltip
      this.createTooltip();

      // 尊重当前 2D/3D 选择: init() 会因 ResizeObserver 重排 / 暗色切换而重入,
      // 不能无条件回退到 3D(否则用户选的 2D 会被静默改回 3D 而按钮仍高亮 2D)
      if (this.is3D) {
        this.init3DLayout();
        this.render3D();
        if (this.canvas) {
          this.canvas.style.cursor = "grab";
        }
        this.setup3DEvents();
      } else {
        // 2D 已在上方放置循环绘制完成; 2D 无需拖拽事件, 仅恢复默认光标
        if (this.canvas) {
          this.canvas.style.cursor = "default";
        }
      }
    },
  },
  created() {
    // 移动端默认 2D: 进首页即跑昂贵的球面投影+螺旋碰撞布局对低端机不友好;
    // 桌面保留 3D。mounted 的初始化分支会读 is3D 走对应布局。
    this.is3D = !this.$isMobile();
  },
  async mounted() {
    this.init();
    // 容器尺寸变化(视口缩放/旋转/断点切换 :column)时去抖重排, 保持画布响应式
    const wrapper = (this.$refs.canvasRef as HTMLCanvasElement | undefined)?.parentElement;
    if (wrapper && typeof ResizeObserver !== "undefined") {
      // init() 会全量重跑(含 3D 球面布局+螺旋碰撞), 开销大; 加大去抖间隔,
      // 移动端(地址栏伸缩/旋转触发更频繁且机器更弱)用更长窗口避免高频重排
      const delay = this.$isMobile() ? 350 : 250;
      this.resizeObserver = new ResizeObserver(() => {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => this.init(), delay);
      });
      this.resizeObserver.observe(wrapper);
    }
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    clearTimeout(this.resizeTimer);
    // 清理动画
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    // 解绑全部交互监听 + 移除 tooltip
    this.teardownInteractions();
  },
});
</script>

<style lang="less" scoped>
.wordcloud-wrapper {
  width: 100%;
  position: relative;
  
  // 仅保留浮层定位; 按钮配色交给 el-radio-group(已随令牌自动适配暗色)
  .mode-switch {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    z-index: 100;
  }
}

// 大屏宽档: 放宽画布宽度上限, 配合 maxSize 放大让词云更舒展
@media (min-width: @bp-wide) {
  #wordcloud {
    max-width: 1480px;
  }
}

#wordcloud {
  // 响应式: 宽度跟随容器(上限放宽到 1280, 充分利用宽卡片), 不再固定造成移动端横向溢出
  width: 100%;
  max-width: 1280px;
  height: 560px;
  margin: 0 auto;
  display: block;
  // 触屏拖拽旋转 3D 词云时禁用浏览器默认手势(滚动/缩放) 否则拖不动
  touch-action: none;
}
</style>
