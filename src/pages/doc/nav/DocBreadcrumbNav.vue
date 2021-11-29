<template>
  <el-breadcrumb separator="/">
            <el-breadcrumb-item
              :to="{ path: '/doc/' + docUrl2Id(chain.link) }"
              v-for="(chain, index) in categoryChainList"
              :key="chain.name"
            ><span class="chain-name" :class="{last: index == categoryChainList.length - 1}">{{ chain.name }}</span></el-breadcrumb-item>
          </el-breadcrumb>
</template>

<script lang="ts">
import Category from '@/dto/Category';
import DocService from '@/service/DocService';
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
    
  },
  methods: {
    docUrl2Id(url: string) {
      return DocService.docUrl2Id(url);
    },
    getCategoryChain(value: Category) {
      const chainList: Category[] = [value];
      while (value.parent) {
        chainList.push(value.parent);
        value = value.parent;
      }
      return chainList.reverse();
    },
  },
  computed: {
    currentCategory(): Category {
      return this.$store.state.currentCategory;
    },
    categoryChainList(): Category[] {
      if (!this.currentCategory) {
        return [];
      }
      return this.getCategoryChain(this.currentCategory);
    },
  }
})
</script>

<style lang="less" scoped>
body[theme=dark] {
  .chain-name {
    color: var(--main-dark-text-color);
  }
  .chain-name.last {
    color: var(--second-dark-text-color);
  }
  .chain-name:hover:not(.last) {
    transition: all 0.2s;
    color: var(--el-color-primary);
  }
}
</style>