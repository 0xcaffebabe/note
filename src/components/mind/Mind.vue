<template>
  <div :id="id" class="mind-container"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import MindNode from "@/dto/mind/MindNode";
import jsMind from "jsmind";
import "jsmind/style/jsmind.css";

export default defineComponent({
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
  data() {
    return {
      jm: null as any,
    };
  },
  watch: {
    mindData(val: MindNode | null) {
      if (!val && this.jm) {
        this.jm.show(this.mindData);
      }
    },
  },
  emits: ['node-click'],
  methods: {
    mousewheel(event: any) {
      // ctrl键按下了 event.ctrlKey
      if (event.ctrlKey) {
        // 取消浏览器默认的放大缩小网页行为
        event.preventDefault();
        if (event.wheelDelta < 0 || event.detail < 0) {
          // 鼠标滚轮往下滚动
          this.jm.view.zoomOut();
        } else if (event.wheelDelta > 0 || event.detail > 0) {
          // 鼠标滚轮往上滚动
          this.jm.view.zoomIn();
        }
      }
    },
    reigseterMindClickEvent() {
      document
        .getElementById(this.id)
        ?.addEventListener("click", (event: MouseEvent) => {
          const target: any = event.target;
          const id = target.getAttribute("nodeid");
          if (id) {
            this.$emit('node-click', id);
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
      console.log(this.mindData);
      console.log(this.id);
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
        theme: "primary1",
        editable: false,
        layout: {
          hspace: 60, // 节点之间的水平间距
          vspace: 20, // 节点之间的垂直间距
          pspace: 13, // 节点与连接线之间的水平间距（用于容纳节点收缩/展开控制器）
        },
      };
      if (!this.jm) {
        this.jm = new jsMind(options);
        // 监听ctrl + 滚轮事件
        document
          .getElementById(this.id)
          ?.addEventListener("mousewheel", this.mousewheel);
      }
      this.jm.show(mind);
      this.reigseterMindClickEvent();
    },
  },
});
</script>

<style lang="less" scoped>
:deep(.jsmind-inner::-webkit-scrollbar) {
  display: none;
}
.mind-container {
  width: 100%;
  height: 100%;
}
</style>

<style lang="less">
// 自定义思维导图主题
/* 节点样式 */
jmnodes.theme-primary1 jmnode {
  transition: all 0.2s;
  background-color: #1e88e5;
  border-color: #357ebd;
  color: #fff;
}
/* 鼠标悬停的节点样式 */
jmnodes.theme-primary1 jmnode:hover {
  transition: all 0.2s;
  background-color: #f56c6c;
}
/* 选中的节点样式 */
jmnodes.theme-primary1 jmnode.selected {
  transition: all 0.2s;
  font-weight: 650;
  background-color: #f56c6c;
}
/* 根节点样式 */
// jmnodes.theme-primary1 jmnode.root {
// }
/* 展开/关闭节点的控制点样式 */
jmnodes.theme-primary1 jmexpander {
  transition: all 0.2s;
}
/* 鼠标悬停展开/关闭节点的控制点样式 */
jmnodes.theme-primary1 jmexpander:hover {
  transition: all 0.2s;
}

body[theme="dark"] {
  jmnodes.theme-primary1 jmnode {
    opacity: 0.75;
  }
}
</style>e