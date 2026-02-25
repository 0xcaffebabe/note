<template>
  <div class="wordcloud-wrapper">
    <canvas ref="canvasRef" id="wordcloud"></canvas>
    <div class="mode-switch">
      <button 
        :class="{ active: !is3D }" 
        @click="toggleMode(false)"
      >
        2D
      </button>
      <button 
        :class="{ active: is3D }" 
        @click="toggleMode(true)"
      >
        3D
      </button>
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
      rotationAngleX: 0, // 绕 X 轴旋转（垂直方向）
      rotationAngleY: 0, // 绕 Y 轴旋转（水平方向）
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      animationId: null as number | null,
      tooltip: null as HTMLDivElement | null,
      boundDrag: null as ((e: MouseEvent) => void) | null,
      boundEndDrag: null as (() => void) | null,
      boundMouseDown: null as ((e: MouseEvent) => void) | null,
    };
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
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

      this.boundMouseDown = (e: MouseEvent) => {
        this.startDrag(e);
      };

      this.boundDrag = (e: MouseEvent) => {
        if (this.isDragging) {
          this.drag(e);
        } else {
          this.handle3DMouseMove(e, tooltip, dpr);
        }
      };

      this.boundEndDrag = () => {
        this.endDrag();
      };

      canvas.addEventListener("mousedown", this.boundMouseDown);
      document.addEventListener("mousemove", this.boundDrag);
      document.addEventListener("mouseup", this.boundEndDrag);
    },

    // 移除 3D 事件
    remove3DEvents() {
      if (this.canvas && this.boundMouseDown) {
        this.canvas.removeEventListener("mousedown", this.boundMouseDown);
      }
      if (this.boundDrag) {
        document.removeEventListener("mousemove", this.boundDrag);
      }
      if (this.boundEndDrag) {
        document.removeEventListener("mouseup", this.boundEndDrag);
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

    getRandomColor(): string {
      const r = Math.round(Math.random() * 160);
      const g = Math.round(Math.random() * 160);
      const b = Math.round(Math.random() * 160);
      return `rgb(${r},${g},${b})`;
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

      this.canvas.addEventListener("mousemove", (e) => {
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
            this.canvas!.style.cursor = "pointer";
            hovered = true;
            break;
          }
        }

        if (!hovered) {
          tooltip.style.display = "none";
          this.canvas!.style.cursor = "default";
        }
      });

      this.canvas.addEventListener("click", (e) => {
        if (this.is3D) {
          this.handle3DClick(e, dpr);
          return;
        }

        const rect = this.canvas!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

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
            // this.$store.commit("setSearchKw", word.name);
            break;
          }
        }
      });
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
          this.canvas!.style.cursor = "pointer";
          hovered = true;
          break;
        }
      }

      if (!hovered) {
        tooltip.style.display = "none";
        this.canvas!.style.cursor = "default";
      }
    },

    handle3DClick(e: MouseEvent, dpr: number) {
      const rect = this.canvas!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

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
          // this.$store.commit("setSearchKw", word.name);
          break;
        }
      }
    },

    async init() {
      const list = await api.getWordCloud();
      
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

      this.words.forEach((word) => {
        const ratio = (word.value - minValue) / (maxValue - minValue || 1);
        word.size = Math.round(minSize + ratio * (maxSize - minSize));
        word.color = this.getRandomColor();
      });

      // 初始化 canvas
      this.canvas = document.getElementById("wordcloud") as HTMLCanvasElement;
      const container = this.canvas!.parentElement!;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;

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

      // 默认初始化 3D 布局并渲染
      this.init3DLayout();
      this.render3D();
      if (this.canvas) {
        this.canvas.style.cursor = "grab";
      }
      this.setup3DEvents();
    },
  },
  async mounted() {
    this.init();
  },
  beforeUnmount() {
    // 清理 tooltip
    if (this.tooltip) {
      this.tooltip.remove();
    }
    // 清理动画
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    // 清理 3D 事件监听器
    this.remove3DEvents();
  },
});
</script>

<style lang="less" scoped>
.wordcloud-wrapper {
  width: 100%;
  position: relative;
  
  .mode-switch {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 100;
    display: flex;
    gap: 8px;
    
    button {
      padding: 6px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
      
      &:hover {
        background: rgba(240, 240, 240, 0.95);
      }
      
      &.active {
        background: #409eff;
        color: white;
        border-color: #409eff;
      }
    }
  }
}

#wordcloud {
  width: 1000px;
  height: 500px;
  margin: 0 auto;
  display: block;
}
</style>
