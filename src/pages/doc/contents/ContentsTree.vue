<template>
  <li :key="value.link" v-for="value in this.contentsList">
    <a :href="'#' + value.link" @click.prevent="handleTocItemClick(value.link)">{{ value.name }}</a>
    <ul v-if="value.chidren.length != 0">
      <contents-tree :contentsList="value.chidren" />
    </ul>
  </li>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    contentsList: Array,
  },
  methods: {
    handleTocItemClick(id: string){
      const elm : HTMLElement = document.querySelector('#' + id)!
      window.scrollTo(0, elm.offsetTop - 80)
    }
  },
  setup() {},
});
</script>

<style lang="less" scoped>
</style>
