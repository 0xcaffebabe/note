<template>
  <div class="mind-note">
    <mind ref="mind" id="mindNoteMind" :mind-data="mindData"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Mind from '@/components/mind/Mind.vue';
import MindNode from "@/dto/mind/MindNode";
import DocService from '@/service/DocService';
import { MindUtils } from './MindUtils';

export default defineComponent({
  components: {
    Mind
  },
  data() {
    return {
      mindData: null as MindNode | null
    }
  },
  async mounted() {
    const doc = this.$route.params.doc.toString();
    const toc = await DocService.getContentByDocId(doc);
    const minds = MindUtils.mindConvert(toc);
    this.mindData = minds[0];
    this.$nextTick(() => {
      (this.$refs.mind as InstanceType<typeof Mind>).init();
    })
  },
})
</script>

<style lang="less" scoped>
  .mind-note {
    max-width: 80%;
    height: 400px;
    border: 1px solid #ccc;
  }
  @media screen and(max-width: 1366px) {
    .mind-note {
      max-width: 74%;
    }
  }
</style>