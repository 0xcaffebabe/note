<template>
  <el-popover placement="bottom" :title="title" :width="400" trigger="click" @show="init">
    <template #reference>
      <el-button size="mini" title="随手草稿">
        <el-icon><dessert /></el-icon>
      </el-button>
    </template>
    <div class="content">
      <p style="font-size:12px">最后更新于 {{ new Date(updateAt).toLocaleString() }}</p>
      <div v-html="content"></div>
    </div>
  </el-popover>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Dessert } from "@element-plus/icons";
import api from "@/api";

export default defineComponent({
  components: {
    Dessert,
  },
  data() {
    return {
      content: "",
      updateAt: "",
      title: "",
    };
  },
  methods: {
    async init() {
      const data = await api.getYuqueDraft();
      this.content = data.content;
      this.updateAt = data.updateAt;
      this.title = data.title;
    },
  },
  created() {
    this.init();
  },
});
</script>

<style lang="less" scoped>
  .content {
    max-height: 400px;
    overflow-y: scroll;
    padding: 10px;
  }
</style>