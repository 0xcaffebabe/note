<template>
  <div class="wordcloud-wrapper">
    <canvas ref="canvasRef" id="wordcloud"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import api from "@/api";

interface WordItem {
  name: string;
  value: number;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
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

      const dpr = window.devicePixelRatio || 1;

      this.canvas.addEventListener("mousemove", (e) => {
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
          const height = cssSize; // 高度在 CSS 像素下就是 fontSize
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
            this.$store.commit("setSearchKw", word.name);
            break;
          }
        }
      });
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
          this.drawWord(word, pos.x, pos.y);
          this.markPlaced(word, pos.x, pos.y);
          this.placedWords.push(word);
        }
      }

      // 创建 tooltip
      this.createTooltip();
    },
  },
  async mounted() {
    this.init();
  },
  beforeUnmount() {
    // 清理 tooltip
    const tooltip = document.getElementById("wordcloud-tooltip");
    if (tooltip) {
      tooltip.remove();
    }
  },
});
</script>

<style lang="less" scoped>
.wordcloud-wrapper {
  width: 100%;
}
#wordcloud {
  width: 1000px;
  height: 500px;
  margin: 0 auto;
}
</style>
