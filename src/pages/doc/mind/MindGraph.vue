<template>
  <el-drawer
    v-model="showDrawer"
    size="44%"
    :direction="$isMobile() ? 'btt': 'rtl'"
    :with-header="false"
    title="思维导图"
    :lock-scroll="false"
    :append-to-body="false"
    :modal="false"
    modal-penetrable
    resizable
    @close="$emit('close')"
  >
    <el-button text class="close-btn" @click="showDrawer = false">
      <el-icon><close-bold /></el-icon>
    </el-button>
    <mind ref="mind" id="mindGraphMind" :mind-data="mindData" />
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {MindUtils} from './MindUtils';
import DocService from "@/service/DocService";
import Mind from '@/components/mind/Mind.vue';
import MindNode from "@/dto/mind/MindNode";
import { CloseBold } from "@element-plus/icons-vue";

export default defineComponent({
  components: {
    Mind,
    CloseBold,
  },
  setup() {},
  data() {
    return {
      showDrawer: false as boolean,
      mindData: null as MindNode | null
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
      this.$nextTick(() => {
        this.$refs.mind && (this.$refs.mind as InstanceType<typeof Mind>).select(val);
      })
    },
    $route(to, from) {
      // 只有在可视化状态才需要更新视图
      if (this.showDrawer) {
        this.showMind()
      }
    }
  },
  methods: {
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
      const minds = MindUtils.mindConvert(toc);
      this.mindData = minds[0];
      this.$nextTick(() => {
        (this.$refs.mind as InstanceType<typeof Mind>).init();
        const currentHeading = this.$store.state.currentHeading;
        if (currentHeading) {
          (this.$refs.mind as InstanceType<typeof Mind>).select(currentHeading);
        }
      })
    },
  },
});
</script>

<style lang="less">
.el-drawer__body {
  padding: 0;
}
</style>

<style lang="less" scoped>
.close-btn {
  position:absolute;
  top: -2px;
  right: -2px;
  z-index: 9999;
}
</style>