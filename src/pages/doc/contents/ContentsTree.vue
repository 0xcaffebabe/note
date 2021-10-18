<template>
  <li :key="value.link" v-for="value in this.contentsList">
    <a :href="'#' + value.name">{{ value.name }}</a>
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
  setup() {},
});
</script>

<style lang="less" scoped>
</style>
