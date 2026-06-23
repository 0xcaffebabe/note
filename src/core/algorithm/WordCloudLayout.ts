/**
 * 词云 2D 布局/碰撞几何(纯计算): 网格坐标换算、碰撞盒求取、网格扫描/占位、椭圆螺旋找位。
 * 从 WordCloud.vue 的 toGridCoord/checkCollision/markPlaced/findPosition 抽出。
 *
 * 纯净边界: 本模块不读 this/DOM、不调 measureText。
 * 文本宽度/高度(measureText * dpr)与 dpr 由调用方在组件内测好后作为入参传入;
 * 网格掩码以 { width, height, data: Uint8Array } 形式传入, markGrid 原地写回(与组件原行为一致)。
 */

export interface GridMask {
  width: number;
  height: number;
  data: Uint8Array;
}

/** 碰撞盒在网格坐标系下的整型边界(已 clamp 到网格范围内)。 */
export interface GridBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * canvas 坐标 → 网格掩码坐标。对应 WordCloud.toGridCoord。
 * floor((val / canvasSize) * gridSize)。
 */
export function toGridCoord(val: number, canvasSize: number, gridSize: number): number {
  return Math.floor((val / canvasSize) * gridSize);
}

/**
 * 由词的中心 (x,y) + 已测好的绘制宽高 + padding 求其碰撞盒在网格坐标系下的边界(已 clamp)。
 * 对应 checkCollision/markPlaced 内重复的那段坐标换算(两处逐字一致, 收敛为一处)。
 *
 * @param width  词的实际绘制宽度(canvas 像素, = measureText 结果)
 * @param height 词的实际绘制高度(canvas 像素, = size * dpr)
 * @param padding 词间距(canvas 像素)
 */
export function computeGridBox(
  mask: GridMask,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
  padding: number,
): GridBox {
  const left = Math.max(0, toGridCoord(x - width / 2 - padding, canvasWidth, mask.width));
  const top = Math.max(0, toGridCoord(y - height / 2 - padding, canvasHeight, mask.height));
  const right = Math.min(mask.width, toGridCoord(x + width / 2 + padding, canvasWidth, mask.width));
  const bottom = Math.min(mask.height, toGridCoord(y + height / 2 + padding, canvasHeight, mask.height));
  return { left, top, right, bottom };
}

/**
 * 扫描碰撞盒覆盖的网格, 任一格已被占(>0)则视为碰撞。对应 WordCloud.checkCollision 的内层循环。
 */
export function checkGridCollision(mask: GridMask, box: GridBox): boolean {
  for (let i = box.top; i < box.bottom; i++) {
    for (let j = box.left; j < box.right; j++) {
      if (mask.data[i * mask.width + j] > 0) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 把碰撞盒覆盖的网格全部置 1(原地写回 mask.data)。对应 WordCloud.markPlaced 的内层循环。
 */
export function markGrid(mask: GridMask, box: GridBox): void {
  for (let i = box.top; i < box.bottom; i++) {
    for (let j = box.left; j < box.right; j++) {
      mask.data[i * mask.width + j] = 1;
    }
  }
}

export interface SpiralParams {
  canvasWidth: number;
  canvasHeight: number;
  /** 词的字号(CSS 像素, 即 word.size); 用于起始半径偏移 size * 0.6 * dpr。 */
  size: number;
  dpr: number;
  /** 词的半包围盒(canvas 像素): halfW = measureText/2, halfH = size*dpr/2。 */
  halfW: number;
  halfH: number;
}

/**
 * 从中心向外的椭圆螺旋找位。对应 WordCloud.findPosition 的纯几何部分。
 * 碰撞判定通过 collides(x, y) 回调注入(组件内做 DOM 测宽 + 网格扫描), 本函数不碰 DOM。
 *
 * 逐点逻辑与原实现逐字一致:
 *  - stretchX = min(centerX/centerY, 2.6)
 *  - maxRadius = centerY * 0.92
 *  - margin = 4 * dpr
 *  - 起始 angle=0, radius = size * 0.6 * dpr, angleStep = 0.20
 *  - x = centerX + cos(angle)*radius*stretchX; y = centerY + sin(angle)*radius
 *  - inBounds 判定后调 collides; 命中即返回; 否则 radius += 0.5, angle += 0.20
 */
export function findSpiralPosition(
  params: SpiralParams,
  collides: (x: number, y: number) => boolean,
): { x: number; y: number } | null {
  const { canvasWidth, canvasHeight, size, dpr, halfW, halfH } = params;

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const stretchX = Math.min(centerX / centerY, 2.6);
  const maxRadius = centerY * 0.92;
  const margin = 4 * dpr;

  let angle = 0;
  let radius = size * 0.6 * dpr;
  const angleStep = 0.20;

  while (radius < maxRadius) {
    const x = centerX + Math.cos(angle) * radius * stretchX;
    const y = centerY + Math.sin(angle) * radius;

    const inBounds =
      x - halfW >= margin &&
      x + halfW <= canvasWidth - margin &&
      y - halfH >= margin &&
      y + halfH <= canvasHeight - margin;

    if (inBounds && !collides(x, y)) {
      return { x, y };
    }

    radius += 0.5;
    angle += angleStep;
  }

  return null;
}
