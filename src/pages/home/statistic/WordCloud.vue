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
import api from "@/api";

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
  },
  watch: {
    isDark() {
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
      const radius = Math.min(centerX, centerY) * 0.7;

      // 为每个词分配 3D 位置（球面分布）
      this.placedWords.forEach((word, index) => {
        const phi = Math.acos(-1 + (2 * index) / this.placedWords.length);
        const theta = Math.sqrt(this.placedWords.length * Math.PI) * phi;

        // 保存 3D 球面坐标（相对于球心）
        word.baseX = radius * Math.sin(phi) * Math.cos(theta);
        word.baseY = radius * Math.sin(phi) * Math.sin(theta);
        word.baseZ = radius * Math.cos(phi);
      });
    },

    // 3D 投影
    project3D(word: WordItem): { x: number; y: number; scale: number } {
      if (!this.canvas || !word.baseX || !word.baseY || !word.baseZ) {
        return { x: word.x || 0, y: word.y || 0, scale: 1 };
      }

      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const focalLength = Math.min(centerX, centerY) * 0.8;

      // 绕 Y 轴旋转（水平方向）
      const cosY = Math.cos(this.rotationAngleY);
      const sinY = Math.sin(this.rotationAngleY);

      // 绕 X 轴旋转（垂直方向）
      const cosX = Math.cos(this.rotationAngleX);
      const sinX = Math.sin(this.rotationAngleX);

      // 先绕 Y 轴旋转
      let rotX = word.baseX * cosY - word.baseZ * sinY;
      let rotZ = word.baseX * sinY + word.baseZ * cosY;
      let rotY = word.baseY;

      // 再绕 X 轴旋转
      const finalY = rotY * cosX - rotZ * sinX;
      const finalZ = rotY * sinX + rotZ * cosX;

      // 透视投影
      const scale = focalLength / (focalLength + finalZ);
      const projX = centerX + rotX * scale;
      const projY = centerY + finalY * scale;

      return { x: projX, y: projY, scale };
    },

    // 渲染 3D 词云
    render3D() {
      if (!this.ctx || !this.canvas) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
        // 只绘制正面的词
        if (projected.scale > 0.3) {
          const projectedSize = word.projectedSize!;

          // 根据深度调整透明度和颜色
          const alpha = Math.max(0.3, Math.min(1, projected.scale));
          this.ctx.save();
          this.ctx.font = `bold ${projectedSize}px "Microsoft YaHei", sans-serif`;
          this.ctx.fillStyle = word.color!.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
          this.ctx.textAlign = "center";
          this.ctx.textBaseline = "middle";
          this.ctx.fillText(word.name, projected.x, projected.y);
          this.ctx.restore();
        }
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
      const rgb = this.parseColorToRgb(raw);
      if (!rgb) return 210;
      const [r, g, b] = rgb.map((c) => c / 255);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;
      if (d === 0) return 210;
      let h = 0;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = Math.round(h * 60);
      return h < 0 ? h + 360 : h;
    },

    // 解析 rgb()/rgba()/#rgb/#rrggbb 为 [r,g,b]; 解析不出返回 null
    parseColorToRgb(s: string): [number, number, number] | null {
      const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (m) return [+m[1], +m[2], +m[3]];
      const hex = s.replace("#", "");
      if (/^[0-9a-f]{3}$/i.test(hex)) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16),
        ];
      }
      if (/^[0-9a-f]{6}$/i.test(hex)) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
        ];
      }
      return null;
    },

    // HSL -> rgb() 字符串: 3D 渲染靠 'rgb'->'rgba' 文本替换加透明度, 故颜色必须输出 rgb() 形态
    hslToRgbString(h: number, s: number, l: number): string {
      const sN = s / 100;
      const lN = l / 100;
      const c = (1 - Math.abs(2 * lN - 1)) * sN;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = lN - c / 2;
      let r = 0,
        g = 0,
        b = 0;
      if (h < 60) [r, g, b] = [c, x, 0];
      else if (h < 120) [r, g, b] = [x, c, 0];
      else if (h < 180) [r, g, b] = [0, c, x];
      else if (h < 240) [r, g, b] = [0, x, c];
      else if (h < 300) [r, g, b] = [x, 0, c];
      else [r, g, b] = [c, 0, x];
      const to255 = (v: number) => Math.round((v + m) * 255);
      return `rgb(${to255(r)},${to255(g)},${to255(b)})`;
    },

    // 基于品牌色相的有序色板: 围绕基准色相小幅游走(±30°), 替代随机近黑色;
    // 暗色模式抬高 lightness 保证最低可读亮度, 避免词融进深色背景看不见
    getWordColor(index: number, total: number, baseHue: number): string {
      const ratio = total > 1 ? index / (total - 1) : 0;
      // 色相在基准附近循环偏移, 维持克制的同系配色
      const hue = (baseHue + (index % 6) * 12 - 30 + 360) % 360;
      if (this.isDark) {
        // 暗色: 亮度区间 [62%, 80%], 饱和度略降, 越靠后(词频低)越亮以保持可读
        const lightness = 62 + ratio * 18;
        return this.hslToRgbString(hue, 62, lightness);
      }
      // 亮色: 亮度区间 [32%, 50%], 保证与浅底有足够对比
      const lightness = 32 + ratio * 18;
      return this.hslToRgbString(hue, 65, lightness);
    },

    getTextWidth(text: string, fontSize: number): number {
      if (!this.ctx) return 0;
      const dpr = window.devicePixelRatio || 1;
      this.ctx.font = `bold ${fontSize * dpr}px "Microsoft YaHei", sans-serif`;
      return this.ctx.measureText(text).width;
    },

    // 将 canvas 坐标转换为网格掩码坐标
    toGridCoord(val: number, isX: boolean): number {
      const canvasSize = isX ? this.canvas!.width : this.canvas!.height;
      const gridSize = isX ? this.gridMask!.width : this.gridMask!.height;
      return Math.floor((val / canvasSize) * gridSize);
    },

    checkCollision(word: WordItem, x: number, y: number): boolean {
      if (!this.gridMask || !this.ctx) return false;

      const dpr = window.devicePixelRatio || 1;
      const width = this.getTextWidth(word.name, word.size!);
      const height = word.size! * dpr; // 实际绘制的高度
      const padding = 4 * dpr; // 词之间的间距

      // 转换为网格坐标
      const gridLeft = Math.max(0, this.toGridCoord(x - width / 2 - padding, true));
      const gridTop = Math.max(0, this.toGridCoord(y - height / 2 - padding, false));
      const gridRight = Math.min(this.gridMask.width, this.toGridCoord(x + width / 2 + padding, true));
      const gridBottom = Math.min(this.gridMask.height, this.toGridCoord(y + height / 2 + padding, false));

      for (let i = gridTop; i < gridBottom; i++) {
        for (let j = gridLeft; j < gridRight; j++) {
          if (this.gridMask.data[i * this.gridMask.width + j] > 0) {
            return true;
          }
        }
      }
      return false;
    },

    markPlaced(word: WordItem, x: number, y: number): void {
      if (!this.gridMask || !this.ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = this.getTextWidth(word.name, word.size!);
      const height = word.size! * dpr;
      const padding = 4 * dpr;

      // 转换为网格坐标
      const gridLeft = Math.max(0, this.toGridCoord(x - width / 2 - padding, true));
      const gridTop = Math.max(0, this.toGridCoord(y - height / 2 - padding, false));
      const gridRight = Math.min(this.gridMask.width, this.toGridCoord(x + width / 2 + padding, true));
      const gridBottom = Math.min(this.gridMask.height, this.toGridCoord(y + height / 2 + padding, false));

      for (let i = gridTop; i < gridBottom; i++) {
        for (let j = gridLeft; j < gridRight; j++) {
          this.gridMask.data[i * this.gridMask.width + j] = 1;
        }
      }
    },

    findPosition(word: WordItem): { x: number; y: number } | null {
      if (!this.canvas) return null;

      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) * 0.85;
      
      // 从中心向外螺旋搜索
      let angle = 0;
      let radius = 0;
      const spiralStep = 8;
      const angleStep = 0.15;

      while (radius < maxRadius) {
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (!this.checkCollision(word, x, y)) {
          return { x, y };
        }

        radius += spiralStep * 0.02;
        angle += angleStep;
      }

      return null;
    },

    drawWord(word: WordItem, x: number, y: number): void {
      if (!this.ctx) return;

      const dpr = window.devicePixelRatio || 1;
      this.ctx.save();
      this.ctx.font = `bold ${word.size! * dpr}px "Microsoft YaHei", sans-serif`;
      this.ctx.fillStyle = word.color!;
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
          const width = this.getTextWidth(word.name, cssSize) / dpr;
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

        if (mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom && projected.scale > 0.3) {
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
        list = await api.getWordCloud();
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

      const maxValue = this.words[0]?.value || 1;
      const minValue = this.words[this.words.length - 1]?.value || 1;

      // 计算每个词的大小和颜色
      const minSize = 12;
      const maxSize = 48;

      // 取一次品牌色相, 整张词云共用一套有序色板(替代逐词随机色)
      const baseHue = this.getPrimaryHue();
      const total = this.words.length;
      this.words.forEach((word, index) => {
        const ratio = (word.value - minValue) / (maxValue - minValue || 1);
        word.size = Math.round(minSize + ratio * (maxSize - minSize));
        word.color = this.getWordColor(index, total, baseHue);
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

#wordcloud {
  // 响应式: 宽度跟随容器(上限 1000), 不再固定 1000px 造成移动端横向溢出
  width: 100%;
  max-width: 1000px;
  height: 500px;
  margin: 0 auto;
  display: block;
  // 触屏拖拽旋转 3D 词云时禁用浏览器默认手势(滚动/缩放) 否则拖不动
  touch-action: none;
}
</style>
