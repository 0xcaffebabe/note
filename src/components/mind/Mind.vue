<template>
  <div :id="id" class="mind-container"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { FullScreen, Minus, Plus } from '@element-plus/icons-vue';
import MindNode from "@/dto/mind/MindNode";
import jsMind from "jsmind";
import "jsmind/style/jsmind.css";

export default defineComponent({
  components: {
    FullScreen
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
  },
  emits: ['onFullScreen'],
  data() {
    return {
      jm: null as any,
    };
  },
  computed: {
    Minus() {
      return Minus;
    },
    Plus() {
      return Plus;
    },
    FullScreen() {
      return FullScreen;
    }
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
  methods: {
    mousewheel(event: any) {
      // 取消浏览器默认的放大缩小网页行为
      event.preventDefault();
      if (event.wheelDelta < 0 || event.detail < 0) {
        // 鼠标滚轮往下滚动
        this.jm.view.zoomOut();
      } else if (event.wheelDelta > 0 || event.detail > 0) {
        // 鼠标滚轮往上滚动
        this.jm.view.zoomIn();
      }
    },
    zoomIn() {
      this.jm.view.zoomIn()
    },
    zoomOut() {
      this.jm.view.zoomOut()
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
      if (!this.jm) {
        throw new Error('思维导图还未初始化');
      }
      this.jm.select_node([nodeId]);
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
          line_width: 2,      // 连接线宽度
          line_color: '#409eff', // 连接线颜色
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
        // 监听ctrl + 滚轮事件
        document
          .getElementById(this.id)
          ?.addEventListener("mousewheel", this.mousewheel);
        this.reigseterMindClickEvent();
      }
      this.jm.show(mind);
    },
  },
});
</script>

<style lang="less" scoped>
.mind-container {
  width: 100%;
  height: 100%;
  background-color: var(--card-bg-color);
}

.control-group {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  z-index: 999;
  background: var(--card-bg-color);
  padding: var(--spacing-xs);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  
  :deep(.el-button) {
    width: 32px;
    height: 32px;
    padding: 6px;
    margin: 2px;
    border: 1px solid var(--border-color);
    background-color: var(--card-bg-color);
    color: var(--main-text-color);
    transition: all 0.2s ease;
    
    &:hover {
      background-color: var(--hover-bg-color);
      border-color: var(--primary-color);
      color: var(--primary-color);
      box-shadow: var(--shadow-sm);
    }
  }
}

:deep(.jsmind-inner) {
  
  &::-webkit-scrollbar {
    display: none;
  }
}

// 深色模式适配
body[theme="dark"] {
  .mind-container {
    background-color: var(--dark-card-bg-color);
  }
  
  .control-group {
    background: var(--dark-card-bg-color);
    border: 1px solid var(--default-dark-border-color);
    
    :deep(.el-button) {
      border: 1px solid var(--default-dark-border-color);
      background-color: var(--dark-card-bg-color);
      color: var(--dark-text-color);
      
      &:hover {
        background-color: var(--dark-hover-bg-color);
        border-color: var(--primary-color);
        color: var(--primary-color);
      }
    }
  }
  
  :deep(.jsmind-inner) {
    background-color: var(--dark-card-bg-color) !important;
  }
}
</style>

<style lang="less">
// 自定义简洁风格的思维导图主题
/* 节点样式 */
jmnodes.theme-clean jmnode {
  transition: all 0.3s ease;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  color: var(--main-text-color);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  box-shadow: var(--shadow-sm);
  font-size: 14px;
  font-weight: 500;
}

/* 鼠标悬停的节点样式 */
jmnodes.theme-clean jmnode:hover {
  transition: all 0.3s ease;
  background-color: var(--hover-bg-color);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* 选中的节点样式 */
jmnodes.theme-clean jmnode.selected {
  transition: all 0.3s ease;
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
  background-color: #337ecc;
  border-color: #337ecc;
}

/* 根节点选中样式 */
jmnodes.theme-clean jmnode.root.selected {
  background-color: #337ecc;
  border-color: #2a6cb4;
  color: white;
}

/* 展开/关闭节点的控制点样式 */
jmnodes.theme-clean jmexpander {
  transition: all 0.3s ease;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  width: 16px;
  height: 16px;
  line-height: 14px;
  border-radius: 50%;
  color: var(--main-text-color);
  
  &:hover {
    transition: all 0.3s ease;
    background-color: var(--hover-bg-color);
    border-color: var(--primary-color);
  }
}

/* 连接线样式 */
jmnodeconns.theme-clean jmconn {
  stroke: var(--border-color);
  stroke-width: 2;
}

body[theme="dark"] {
  /* 节点样式 */
  jmnodes.theme-clean jmnode {
    background-color: var(--dark-card-bg-color);
    border: 1px solid var(--default-dark-border-color);
    color: var(--dark-text-color);
  }
  
  /* 悬停节点样式 */
  jmnodes.theme-clean jmnode:hover {
    background-color: var(--dark-hover-bg-color);
    border-color: var(--primary-color);
  }
  
  /* 选中节点样式 */
  jmnodes.theme-clean jmnode.selected {
    background-color: rgba(64, 158, 255, 0.2);
    border-color: var(--primary-color) !important;
    color: var(--primary-color);
  }
  
  /* 根节点样式 */
  jmnodes.theme-clean jmnode.root {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
  
  /* 根节点悬停样式 */
  jmnodes.theme-clean jmnode.root:hover {
    background-color: #337ecc;
  }
  
  /* 展开/关闭节点的控制点样式 */
  jmnodes.theme-clean jmexpander {
    background-color: var(--dark-card-bg-color);
    border: 1px solid var(--default-dark-border-color);
    color: var(--dark-text-color);
    
    &:hover {
      background-color: var(--dark-hover-bg-color);
      border-color: var(--primary-color);
    }
  }
  
  /* 连接线样式 */
  jmnodeconns.theme-clean jmconn {
    stroke: var(--default-dark-border-color);
  }
}
</style>e