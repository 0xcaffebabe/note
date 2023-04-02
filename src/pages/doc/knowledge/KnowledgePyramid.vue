<template>
    <el-drawer
    v-model="showDrawer"
    :size="$isMobile() ? '50%' : '44%'"
    :direction="$isMobile() ? 'btt': 'rtl'"
    title="知识金字塔"
    @close="$emit('close')"
    :lock-scroll="false"
  >
  <div style="padding-left: 20px">
    <el-collapse v-model="activeNames">
      <el-collapse-item v-for="item in infoMap" :key="item[0]" :title="'等级' + item[0]" :name="item[0]">
        <div v-for="info in item[1]" :key="info.id">
          <el-link type="primary" @click="$router.push('/doc/' + info.id).then(init)">{{ info.name }}</el-link>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
  </el-drawer>
</template>

<script lang="ts">
import DocFileInfo from '@/dto/DocFileInfo'
import DocService from '@/service/DocService'
import KnowledgeNetworkService from '@/service/KnowledgeNetworkService'
import { info } from 'console'
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      showDrawer: false,
      activeNames: '',
      infoMap: [] as [number, DocFileInfo[]][]
    }
  },
  props: {
    doc: {
      type: String,
      required: true,
    },
  },
  watch: {
    doc() {
      this.init()
    }
  },
  created() {
    this.init()
  },
  methods: {
    show() {
      this.showDrawer = true
    },
    async init() {
      const stream = await KnowledgeNetworkService.getDocStream(this.doc)
      const infos = await Promise.all(Array.from(new Set(stream.flatMap(v => v))).map(v => DocService.getDocFileInfo(v)))
      const map = new Map<number, DocFileInfo[]>()
      for(let i of infos) {
        const level = i.formattedMetadata.level || 3
        if (!map.has(level)) {
          map.set(level, [])
        }
        map.get(level)?.push(i)
      }
      this.infoMap = Array.from(map).sort((a,b) => b[0] - a[0]).reverse()
    }
  }
})
</script>
