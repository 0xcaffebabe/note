<template>
  <el-drawer v-model="showDrawer" size="60%" title="思维导图">
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
    async showMind() {
      const doc = this.$route.params.doc.toString();
      const toc = await DocService.getContentByDocId(doc);
      const minds = this.mindConvert(toc);
      let mindData : MindItem;
      if (minds.length > 1) {
        mindData = {
          id: 'root',
          topic: 'root',
          children: minds,
          direction: 'left'
        }
      }else {
        mindData = minds[0]
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
        theme: "primary",
        editable: false,
      };
      if (!this.jm) {
        this.jm = new jsMind(options);
      }
      this.jm.show(mind);
      const elm: HTMLElement = document.querySelector("#jsmind_container")!;
      // 选中当前标题节点
      const currentHeading = this.$store.state.currentHeading;
      if (currentHeading) {
        this.jm.select_node([this.$store.state.currentHeading]);
      elm.onclick = (event) => {
        const target: any = event.target
        const id = target.getAttribute('nodeid')
        if (id) {
          const elm : HTMLElement = document.querySelector('#' + id)!
          window.scrollTo(0, elm.offsetTop - 80)
        }
      };
      }
    },
  },
});
</script>

<style lang="less" scoped>
#jsmind_container {
  width: 100%;
  height: 100%;
}
</style>