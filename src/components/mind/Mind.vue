<template>
  <div class="mind-wrap">
    <div :id="id" class="mind-container"></div>
    <!-- 操作工具栏: 缩放/重置/全部展开收起 迷你面板可经toolbar=false关闭 -->
    <div class="mind-toolbar" v-if="toolbar">
      <button type="button" class="mind-btn" title="缩小" :disabled="zoomLevel <= ZOOM_MIN" @click="zoomOut()">
        <el-icon><minus /></el-icon>
      </button>
      <button type="button" class="mind-btn zoom-label" title="重置缩放并回到中心" @click="resetView">
        {{ Math.round(zoomLevel * 100) }}%
      </button>
      <button type="button" class="mind-btn" title="放大" :disabled="zoomLevel >= ZOOM_MAX" @click="zoomIn()">
        <el-icon><plus /></el-icon>
      </button>
      <span class="mind-divider"></span>
      <button type="button" class="mind-btn" title="展开全部" @click="expandAll">
        <el-icon><circle-plus /></el-icon>
      </button>
      <button type="button" class="mind-btn" title="收起全部" @click="collapseAll">
        <el-icon><remove /></el-icon>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Minus, Plus, CirclePlus, Remove } from '@element-plus/icons-vue';
import MindNode from "@/dto/mind/MindNode";
import jsMind from "jsmind";
import "jsmind/style/jsmind.css";

// jsMind 0.9 默认缩放区间
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.1;

export default defineComponent({
  components: {
    Minus,
    Plus,
    CirclePlus,
    Remove,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    mindData: {
      type: Object as PropType<MindNode | null>,
      required: true,
    },
    // 小尺寸宿主(如右下角迷你面板)可关闭工具栏
    toolbar: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      jm: null as any,
      zoomLevel: 1,
      ZOOM_MIN,
      ZOOM_MAX,
    };
  },
  watch: {
    mindData(val: MindNode | null) {
      this.init()
    },
  },
  mounted() {
    if (this.mindData && (this.mindData as MindNode).id) {
      this.init();
    }
  },
  beforeUnmount() {
    const container = document.getElementById(this.id);
    container?.removeEventListener("wheel", this.onWheel);
  },
  methods: {
    // 滚轮缩放: 以光标为焦点(jsMind的zoom_in/out支持焦点参数)
    onWheel(event: WheelEvent) {
      event.preventDefault();
      const point = { x: event.clientX, y: event.clientY };
      if (event.deltaY > 0) {
        this.jm.view.zoom_out(point);
      } else if (event.deltaY < 0) {
        this.jm.view.zoom_in(point);
      }
      this.syncZoom();
    },
    zoomIn() {
      this.jm.view.zoom_in();
      this.syncZoom();
    },
    zoomOut() {
      this.jm.view.zoom_out();
      this.syncZoom();
    },
    resetView() {
      this.jm.view.set_zoom(1);
      this.jm.view.center_node(this.jm.mind.root);
      this.syncZoom();
    },
    expandAll() {
      this.jm.expand_all();
    },
    collapseAll() {
      this.jm.collapse_all();
      this.jm.view.center_node(this.jm.mind.root);
    },
    syncZoom() {
      this.zoomLevel = this.jm?.view?.zoom_current ?? 1;
    },
    reigseterMindClickEvent() {
      document
        .getElementById(this.id)
        ?.addEventListener("click", (event: MouseEvent) => {
          const target: any = event.target;
          const id = target.getAttribute("nodeid");
          if (id) {
            const elm: HTMLElement = document.getElementById(id)!;
            window.scrollTo(0, elm.offsetTop - 80);
          }
        });
    },
    select(nodeId: string) {
      // 容器/数据未就绪时静默忽略(阅读位置同步会在初始化前触发)
      if (!this.jm || !nodeId) {
        return;
      }
      const node = this.jm.get_node(nodeId);
      if (!node) {
        return;
      }
      this.jm.select_node(nodeId);
      // 选中节点滚入画布可视区 与正文阅读位置保持同步可见
      const container = document.getElementById(this.id);
      const nodeElm = container?.querySelector(`jmnode[nodeid="${CSS.escape(nodeId)}"]`);
      nodeElm?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    },
    init() {
      if (!this.mindData) {
        throw new Error("思维导图数据不能为空!");
      }
      const mind = {
        /* 元数据，定义思维导图的名称、作者、版本等信息 */
        meta: {
          name: "思维导图",
          author: "ISMY",
          version: "0.01",
        },
        /* 数据格式声明 */
        format: "node_tree",
        /* 数据内容 */
        data: this.mindData,
      };
      const options = {
        container: this.id,
        theme: "clean",
        editable: false,
        mode: 'full', // 显示模式
        view: {
          draggable: true,
          engine: 'svg',
          hmargin:100,        // 思维导图距容器外框的最小水平距离
          vmargin:100,         // 思维导图距容器外框的最小垂直距离
          line_width: 2,      // 连接线宽度(颜色由主题CSS的语义令牌控制)
        },
        layout: {
          hspace: 30, // 节点之间的水平间距
          vspace: 20, // 节点之间的垂直间距
          pspace: 10, // 节点与连接线之间的水平间距
        },
        shortcut: {
          enable: true,
          handles: {},
          mapping: {
            add_node: 45, // Insert键
            edit_node: 113, // F2键
            del_node: 46, // Delete键
            toggle: 32, // Space键
            left: 37, // Left键
            up: 38, // Up键
            right: 39, // Right键
            down: 40, // Down键
          }
        }
      };
      if (!this.jm) {
        this.jm = new jsMind(options);
        document
          .getElementById(this.id)
          ?.addEventListener("wheel", this.onWheel, { passive: false });
        this.reigseterMindClickEvent();
      }
      this.jm.show(mind);
      this.syncZoom();
    },
  },
});
</script>

<style lang="less" scoped>
.mind-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.mind-container {
  width: 100%;
  height: 100%;
  background-color: var(--card-bg-color);
}

// 画布操作工具栏: 底部居右悬浮
.mind-toolbar {
  position: absolute;
  right: var(--spacing-sm);
  bottom: var(--spacing-sm);
  z-index: var(--z-float);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-xs);
  background-color: var(--elevated-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.mind-btn {
  height: 26px;
  min-width: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);

  &:hover:not(:disabled) {
    background-color: var(--hover-bg-color);
    color: var(--main-text-color);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.zoom-label {
  min-width: 42px;
  font-variant-numeric: tabular-nums;
}

.mind-divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background-color: var(--divider-color);
}

:deep(.jsmind-inner) {

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>

<style lang="less">
// 自定义简洁风格的思维导图主题
/* 节点样式 */
jmnodes.theme-clean jmnode {
  // 只过渡颜色/阴影 不过渡top/left: 展开收起重排时大图整体滑动会卡
  transition: background-color var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  color: var(--main-text-color);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  box-shadow: var(--shadow-sm);
  font-size: 14px;
  font-weight: 500;
  // 节点可点击跳转到对应标题
  cursor: pointer;
}

/* 鼠标悬停的节点样式 */
jmnodes.theme-clean jmnode:hover {
  background-color: var(--hover-bg-color);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

/* 选中的节点样式 */
jmnodes.theme-clean jmnode.selected {
  background-color: var(--primary-light-color);
  border-color: var(--primary-color) !important;
  box-shadow: var(--shadow-md);
  color: var(--primary-color);
  font-weight: 600;
}

/* 根节点样式 */
jmnodes.theme-clean jmnode.root {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  font-weight: 600;
  padding: 12px 20px;
  font-size: 16px;
}

/* 根节点悬停样式 */
jmnodes.theme-clean jmnode.root:hover {
  background-color: color-mix(in srgb, var(--primary-color) 80%, black);
  border-color: color-mix(in srgb, var(--primary-color) 80%, black);
}

/* 根节点选中样式 */
jmnodes.theme-clean jmnode.root.selected {
  background-color: color-mix(in srgb, var(--primary-color) 80%, black);
  border-color: color-mix(in srgb, var(--primary-color) 65%, black);
  color: white;
}

/* 展开/关闭节点的控制点样式 */
jmnodes.theme-clean jmexpander {
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  width: 18px;
  height: 18px;
  line-height: 16px;
  border-radius: 50%;
  color: var(--main-text-color);

  &:hover {
    background-color: var(--hover-bg-color);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
}

/* 连接线样式 */
jmnodeconns.theme-clean jmconn {
  stroke: var(--border-color);
  stroke-width: 2;
}
</style>
