<template>
  <el-drawer v-model="visible" direction="btt" size="60%" title="本页章节" :lock-scroll="false">
    <div class="mtoc-list" v-if="flatList.length > 0">
      <a
        v-for="(item, index) in flatList"
        :key="index"
        class="mtoc-item"
        :style="{paddingLeft: (item.level - topLevel) * 16 + 12 + 'px'}"
        :href="'?headingId=' + encodeURIComponent(item.link)"
        @click.prevent="handleClick(item)"
      >{{ item.name }}</a>
    </div>
    <el-empty v-else description="本页没有章节标题" :image-size="48" />
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Content from '@/dto/Content'

interface FlatItem {
  name: string
  link: string
  level: number
}

export default defineComponent({
  props: {
    contentsList: {
      type: Array as PropType<Content[]>,
      default: () => [],
    },
  },
  emits: ['item-click'],
  data() {
    return {
      visible: false as boolean,
    }
  },
  computed: {
    flatList(): FlatItem[] {
      const res: FlatItem[] = []
      const walk = (list: Content[]) => {
        for (const item of list) {
          res.push({name: item.name, link: item.link, level: item.level})
          if (item.chidren?.length) {
            walk(item.chidren)
          }
        }
      }
      walk(this.contentsList)
      return res
    },
    topLevel(): number {
      return this.flatList.length > 0 ? Math.min(...this.flatList.map(i => i.level)) : 1
    },
  },
  methods: {
    show() {
      this.visible = true
    },
    handleClick(item: FlatItem) {
      this.$emit('item-click', item.link)
      this.visible = false
    },
  },
})
</script>

<style lang="less" scoped>
.mtoc-list {
  display: flex;
  flex-direction: column;
}

.mtoc-item {
  display: block;
  padding: 10px 12px;
  font-size: var(--font-size-base);
  color: var(--main-text-color);
  text-decoration: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:active,
  &:hover {
    background-color: var(--hover-bg-color);
    color: var(--primary-color);
  }
}
</style>
