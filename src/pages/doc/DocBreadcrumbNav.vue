<template>
  <el-breadcrumb separator="/">
            <el-breadcrumb-item
              :to="{ path: '/doc/' + docUrl2Id(chain.link) }"
              v-for="chain in categoryChainList"
              :key="chain.name"
            >{{ chain.name }}</el-breadcrumb-item>
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

</style>