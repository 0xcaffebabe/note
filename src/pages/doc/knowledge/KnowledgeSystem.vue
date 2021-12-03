<template>
  <el-drawer
    v-model="showDrawer"
    size="44%"
    :with-header="false"
    title="知识体系"
    @close="$emit('close')"
    :lock-scroll="false"
    modal-class="drawer-modal-class"
  >
    <mind ref="mind" id="knowledgeSystemId" :mind-data="mindData" @node-click="handleNodeClick"/>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CategoryService from "@/service/CategoryService";
import Category from "@/dto/Category";
import Mind from "@/components/mind/Mind.vue";
import MindNode from "@/dto/mind/MindNode";
import DocUtils from "@/util/DocUtils";

let counter: number = 0;
export default defineComponent({
  components: { Mind },
  data() {
    return {
      showDrawer: false,
      mindData: null as MindNode | null
    };
  },
  methods: {
    handleNodeClick(id: string) {
      this.$router.push('/doc/' + DocUtils.docUrl2Id(id))
    },
    show() {
      this.showDrawer = true;
      this.init();
    },
    async getSystemData(): Promise<MindNode> {
      const cateList = await CategoryService.getCategoryList();
      return {
        id: "root",
        topic: "root",
        children: this.convert(cateList),
        expanded: true,
        direction: "left",
      };
    },
    convert(cateList: Category[]): MindNode[] {
      return cateList.filter(v => v.link).map((i) => {
        const children = this.convert(i.chidren);
        return {
          id: i.link,
          topic: i.name,
          children: this.convert(i.chidren),
          expanded: children.length < 7,
          direction: counter++ % 2 == 0 ? "right" : "left",
        } as MindNode;
      });
    },
    async init() {
      this.mindData = await this.getSystemData();
      this.$nextTick(() => {
        (this.$refs.mind as InstanceType<typeof Mind>).init();
      })
    },
  },
  setup() {},
});
</script>

<style lang="less" scoped>
</style>