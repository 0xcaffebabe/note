<template>
  <el-drawer v-model="showDrawer" size="20%" title="链接列表">
    <ul>
      <li v-for="item in linkList" :key="item.link" :title="item.link">
        <el-link type="primary" :disabled="!effecientMap[item.link]" @click.prevent="$router.push(item.link.replace('/#', ''));showDrawer = false">
          {{item.text}}
        </el-link>
      </li>
    </ul>
  </el-drawer>
</template>

<script lang="ts">
import DocService from '@/service/DocService';
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    html: {
      type: String,
      required: true
    }
  },
  setup() {
    
  },
  data() {
    return {
      showDrawer: false as boolean,
      linkList: [] as {text: string, link: string}[],
      // 链接有效性map
      effecientMap: {} as any
    }
  },
  methods: {
    show() {
      this.showDrawer = true;
      this.linkList = DocService.resolveLinkList(this.html)
                                .filter(v => v.link.startsWith('/#/doc'));
      this.linkList.forEach(async v => {
        try {
          await DocService.getDocFileInfo(v.link.replace('/#/doc/', ''));
          this.effecientMap[v.link] = true;
        }catch(e: any) {
          this.effecientMap[v.link] = false;
        }
      })
    }
  },
})
</script>

<style lang="less" scoped>
li {
  padding-left: 40px;
  padding-bottom: 8px;
  a {
    font-size: 16px;
  }
}
</style>