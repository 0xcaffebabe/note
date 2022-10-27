<template>
  <div class="mind-note" :class="{'full-screen': fullScreen}">
    <mind ref="mind" id="mindNoteMind" :mind-data="mindData" @onFullScreen="fullScreen = !fullScreen"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Mind from '@/components/mind/Mind.vue';
import MindNode from "@/dto/mind/MindNode";
import DocService from '@/service/DocService';
import DocUtils from '@/util/DocUtils';

const EMPTY_NODE  = {
  id: '',
  topic: '',
  children: [],
  expanded: false,
  direction: 'left'
} as MindNode
  

export default defineComponent({
  components: {
    Mind
  },
  data() {
    return {
      mindData: EMPTY_NODE as MindNode,
      fullScreen: false,
    }
  },
  computed: {
    currentCategory() {
      return this.$store.state.currentCategory
    },
    currentHeading() {
      return this.$store.state.currentHeading;
    },
  },
  watch: {
    currentCategory() {
      this.refresh(DocUtils.docUrl2Id(this.currentCategory.link))
    },
    currentHeading(val) {
      // 监听当前选中标题 映射到思维导图节点
      this.$nextTick(() => {
        this.$refs.mind && (this.$refs.mind as InstanceType<typeof Mind>).select(val);
      })
    },
  },
  methods: {
    async refresh(docId?: string) {
      const doc = docId || this.$route.params.doc.toString();
      this.mindData = await DocService.generateMindData(doc);
      for(let i = 0; i < 3; i++) {
        this.$nextTick(() => {
          if (!this.$refs.mind) {
            return
          }
          (this.$refs.mind as InstanceType<typeof Mind>).zoomOut()
        })
      }
    },
    test() {

    }
  },
  async mounted() {
    this.refresh();
    
  },
})
</script>

<style lang="less" scoped>
.mind-note {
    transition: all .2s;
    position: fixed;
    bottom: 0px;
    right: 0px;
    width: 400px;
    height: 200px;
    z-index: 999;
    background-color: rgba(255,255,255,.8);
    border: 1px solid #ccc;
}
.full-screen {
  height: 90%!important;
}
  @media screen and(max-width: 1366px) {
    .mind-note {
      width: 300px;
      height: 160px;
    }
  }
  body[theme=dark] {
    .mind-note {
      background-color:var(--main-dark-bg-color);
      border-color: var(--second-dark-bg-color);
    }
  }
</style>