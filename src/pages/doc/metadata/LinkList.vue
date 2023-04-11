<template>
  <div>
    <el-popover
      placement="left-start"
      :width="400"
      trigger="hover"
      >
      <template #reference>
        <span style="cursor: pointer;font-size:14px">🔭外部链接({{ links.length }})</span>
      </template>
      <ul>
        <li v-for="link in links" :key="link">
          <el-link type="primary" @click="$emit('linkClick', link)">{{ trimLink(link) }}</el-link>
        </li>
      </ul>
    </el-popover>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    links: {
      required: true,
      type: Object as PropType<string[]>
    }
  },
  emits: ['linkClick'],
  methods: {
    trimLink(link: string): string {
      if (link.length < 40) {
        return link
      }
      return link.substring(0, 40) + '...'
    },
  }
})
</script>
