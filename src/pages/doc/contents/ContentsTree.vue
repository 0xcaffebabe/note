<template>
  <transition-group name="list">
    <li :key="value.link" v-for="value in contentsList">
      <a :href="'#' + value.link" @click.prevent="handleTocItemClick(value.link)" :title="value.name">{{ value.name }}</a>
      <ul v-if="value.chidren.length != 0">
        <contents-tree :contentsList="value.chidren" />
      </ul>
    </li>
  </transition-group>
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
// 动画
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease-in;
}
.list-enter-from,
.list-leave-to {
  transition: all 0.2s ease-in;
  opacity: 0;
  transform: translateY(30px);
}
</style>
