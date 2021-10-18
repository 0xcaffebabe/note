<template>
  <canvas class="container" ref="wc"></canvas>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import wordcloud from "wordcloud";
import api from "@/api";

export default defineComponent({
  setup() {},
  async created() {
    let list = await api.getWordCloud();
    list.splice(1000)
    let options = {
      list
    };
    wordcloud(this.$refs.wc, options);
  },
});
</script>

<style lang="less" scoped>
.container {
  width: 1000px;
  height: 500px;
}
</style>
