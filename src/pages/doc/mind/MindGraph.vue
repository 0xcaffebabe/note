<template>
  <el-drawer
    v-model="showDrawer"
    size="44%"
    :direction="$isMobile() ? 'btt': 'rtl'"
    :with-header="false"
    :lock-scroll="false"
    :append-to-body="false"
    :modal="false"
    modal-penetrable
    resizable
    @close="$emit('close')"
  >
    <div class="mind-panel">
      <div class="mind-panel-header">
        <span class="panel-title">思维导图</span>
        <span class="panel-doc" :title="docName">{{ docName }}</span>
        <button type="button" class="panel-close" title="关闭 (Esc)" aria-label="关闭思维导图" @click="showDrawer = false">
          <el-icon><close /></el-icon>
        </button>
      </div>
      <mind ref="mind" id="mindGraphMind" class="mind-body" :mind-data="mindData" />
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {MindUtils} from './MindUtils';
import DocService from "@/service/DocService";
import DocUtils from "@/util/DocUtils";
import Mind from '@/components/mind/Mind.vue';
import MindNode from "@/dto/mind/MindNode";
import { Close } from "@element-plus/icons-vue";

export default defineComponent({
  components: {
    Mind,
    Close,
  },
  data() {
    return {
      showDrawer: false as boolean,
      mindData: null as MindNode | null,
      docName: "" as string,
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
      const doc = DocUtils.routeDocId(this.$route);
      // 展示名经docId2Url还原(字面'-'转义为@@ 不能直接split)
      this.docName = (DocUtils.docId2Url(doc).split('/').pop() || '').replace(/\.md$/i, '');
      const toc = await DocService.getContentByDocId(doc);
      const minds = MindUtils.mindConvert(toc, this.docName);
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
.mind-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mind-panel-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  padding: 8px var(--spacing-sm) 8px var(--spacing-md);
  border-bottom: 1px solid var(--divider-color);
  background-color: var(--card-bg-color);
}

.panel-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--main-text-color);
  flex-shrink: 0;
}

.panel-doc {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-sm);
  color: var(--secondary-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-close {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--secondary-text-color);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);

  &:hover {
    background-color: var(--hover-bg-color);
    color: var(--main-text-color);
  }
}

.mind-body {
  flex: 1;
  min-height: 0;
}
</style>
