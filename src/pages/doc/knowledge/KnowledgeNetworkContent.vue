<template>
  <div class="knowledge-network-content">
    <KnowledgeNetworkToolbar
      v-model="mode"
      v-model:onlySelfRelated="onlySelfRelated"
      v-model:isPotential="isPotential"
      v-model:degree="degree"
      @close="$emit('close')"
      @change="init"
    />
    <KnowledgeNetworkChart
      :doc="doc"
      :mode="mode"
      :onlySelfRelated="onlySelfRelated"
      :isPotential="isPotential"
      :degree="degree"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import KnowledgeNetworkToolbar from './KnowledgeNetworkToolbar.vue';
import KnowledgeNetworkChart from './KnowledgeNetworkChart.vue';

export default defineComponent({
  components: {
    KnowledgeNetworkToolbar,
    KnowledgeNetworkChart
  },
  props: {
    doc: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      mode: 'force' as "force" | "circular" | "none",
      onlySelfRelated: true,
      isPotential: false,
      degree: 3,
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.init();
    });
  },
  methods: {
    init() {
      // 由于现在图表逻辑在子组件中，这里只需要确保子组件更新
      // 当prop变化时，KnowledgeNetworkChart会自动更新
    }
  }
});
</script>

<style lang="less">
.knowledge-network-content {
  height: 100%;
  position: relative;
}
</style>