<template>
  <el-drawer
    v-model="showDrawer"
    size="44%"
    :with-header="false"
    title="思维导图"
    :lock-scroll="false"
    :append-to-body="false"
    @close="$emit('close')"
    modal-class="drawer-modal-class"
  >
    <div id="jsmind_container"></div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import jsMind from "jsmind";
import "jsmind/style/jsmind.css";
import Content from "@/dto/Content";
import MindItem from "@/dto/MindItem";
import DocService from "@/service/DocService";

export default defineComponent({
  setup() {},
  data() {
    return {
      jm: null as any,
      showDrawer: false as boolean,
    };
  },
  computed: {
    currentHeading() {
      return this.$store.state.currentHeading;
    },
  },
  watch: {
    currentHeading(val) {
      // 监听当前选中标题 映射到思维导图节点
      if (this.jm) {
        this.jm.select_node([val]);
      }
    },
  },
  methods: {
    mindConvert(toc: Content[]): MindItem[] {
      let counter: number = 0;
      return toc.map((i) => {
        return {
          id: i.link,
          topic: i.name,
          children: this.mindConvert(i.chidren),
          direction: counter++ % 2 == 0 ? "right" : "left",
        } as MindItem;
      });
    },
    show() {
      this.showDrawer = true;
      this.showMind();
    },
    hide() {
      this.showDrawer = false;
    },
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
    async showMind() {
      const doc = this.$route.params.doc.toString();
      const toc = await DocService.getContentByDocId(doc);
      const minds = this.mindConvert(toc);
      let mindData: MindItem;
      if (minds.length > 1) {
        mindData = {
          id: "root",
          topic: "root",
          children: minds,
          direction: "left",
        };
      } else {
        mindData = minds[0];
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
        data: mindData,
      };
      const options = {
        container: "jsmind_container",
        theme: "primary1",
        editable: false,
      };
      if (!this.jm) {
        this.jm = new jsMind(options);
        // 监听ctrl + 滚轮事件
        document.querySelector('#jsmind_container')?.addEventListener('mousewheel', this.mousewheel);
      }
      this.jm.show(mind);
      const elm: HTMLElement = document.querySelector("#jsmind_container")!;
      // 选中当前标题节点
      const currentHeading = this.$store.state.currentHeading;
      if (currentHeading) {
        this.jm.select_node([this.$store.state.currentHeading]);
        elm.onclick = (event) => {
          const target: any = event.target;
          const id = target.getAttribute("nodeid");
          if (id) {
            const elm: HTMLElement = document.querySelector("#" + id)!;
            window.scrollTo(0, elm.offsetTop - 80);
          }
        };
      }
    },
  },
});
</script>

<style lang="less" scoped>
:deep(.jsmind-inner::-webkit-scrollbar) {
  display: none;
}
#jsmind_container {
  width: 100%;
  height: 100%;
}
</style>

<style lang="less">
.el-drawer__body {
  padding: 0;
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
jmnodes.theme-primary1 jmnode.root {
}
/* 展开/关闭节点的控制点样式 */
jmnodes.theme-primary1 jmexpander {
  transition: all 0.2s;
}
/* 鼠标悬停展开/关闭节点的控制点样式 */
jmnodes.theme-primary1 jmexpander:hover {
  transition: all 0.2s;
}
</style>