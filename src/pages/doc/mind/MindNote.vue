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
import DocUtils from '@/util/DocUtils';

export default defineComponent({
  components: {
    Mind
  },
  data() {
    return {
      mindData: null as MindNode | null
    }
  },
  computed: {
    currentCategory() {
      return this.$store.state.currentCategory
    }
  },
  watch: {
    currentCategory() {
      this.refresh(DocUtils.docUrl2Id(this.currentCategory.link))
    }
  },
  methods: {
    async refresh(docId?: string) {
      const doc = docId || this.$route.params.doc.toString();
      this.mindData = await DocService.generateMindData(doc);
      this.$nextTick(() => {
        (this.$refs.mind as InstanceType<typeof Mind>).init();
      })
    }
  },
  async mounted() {
    this.refresh()
  },
})
</script>

<style lang="less" scoped>
  .mind-note {
    position: relative;
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