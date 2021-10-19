<template>
  <div id="jsmind_container"></div>
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
  methods: {
    mindConvert(toc: Content[]): MindItem[] {
      let counter: number = 0
      return toc.map(i => {
        return {
          id: i.name,
          topic: i.name,
          children: this.mindConvert(i.chidren),
          direction: counter++ % 2 == 0 ? "right": "left"
        } as MindItem
      })
    }
  },
  async mounted() {
    const doc = this.$route.params.doc.toString()
    const toc = await DocService.getContentByDocId(doc)
    const minds = this.mindConvert(toc)
    console.log(minds)
    var mind = {
      /* 元数据，定义思维导图的名称、作者、版本等信息 */
      meta: {
        name: "思维导图",
        author: "ISMY",
        version: "0.01",
      },
      /* 数据格式声明 */
      format: "node_tree",
      /* 数据内容 */
      data: minds[0]
      
    };
    var options = {
      container: "jsmind_container",
      theme: "orange",
      editable: true,
    };
    var jm = new jsMind(options);
    jm.show(mind);
  },
});
</script>

<style lang="less" scoped>
#jsmind_container {
  width: 100%;
  // height: calc(100% - 60px);
  height: 900px;
}
</style>