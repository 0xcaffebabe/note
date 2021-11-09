<template>
  <div class="container">
    <div class="search-box-zone">
      <el-input placeholder="搜索标签" v-model="kw">
        <template #prefix>
          <el-icon class="el-input__icon" :size="32"><search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="tag-zone">
      <transition-group name="list" tag="p">
      <el-tag v-for="item in filtedTags" :key="item.tag" :type="item.type">{{
        item.tag
      }}</el-tag>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons'
</script>

<script lang="ts">
import api from "@/api";
import { defineComponent } from "vue";

function hashCode(str: string) {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export default defineComponent({
  data() {
    return {
      tags: [] as {tag: string, type: string}[],
      kw: '' as string
    };
  },
  setup() {},
  methods: {
    randomType(item: string) {
      const types = ["", "info", "warning", "success", "danger"];
      const index = hashCode(item) % 5;
      return types[index];
    },
  },
  computed: {
    filtedTags(){
      return this.tags.filter(v => v.tag.indexOf(this.kw) != -1)
    }
  },
  async created() {
    let list = (await api.getTagMapping()).map((v) => v[0]);
    // mock to test
    for (let i = 0; i < 8; i++) {
      list.push(...list);
    }
    this.tags = list
        .map((v) => v + Math.ceil(Math.random() * 1000000))
        .map(v =>{ return {tag: v, type: this.randomType(v)}})
  },
});
</script>

<style lang="less" scoped>
.container {
  margin-top: 10%;
  min-height: 1200px;
}
.search-box-zone {
  max-width: 50%;
  margin: 0 auto;
}
.tag-zone {
  transition: all 0.2s ease;
  max-width: 60%;
  margin: 5% auto;
  text-align: center;
  .el-tag {
    transition: all 0.2s ease;
    margin: 4px;
    cursor: pointer;
  }
}
.el-input :deep(input) {
  border-radius: 50px;
  font-size: 32px;
  line-height: 48px;
  padding: 30px 60px!important;
}
.el-input__icon {
  vertical-align: middle;
  margin-left: 10px;
  margin-top: 14px;
}

.list-item {
  display: inline-block;
  margin-right: 10px;
}
// 动画
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from,
.list-leave-to {
  transition: all 0.2s ease;
  opacity: 0;
  transform: translateY(30px);
}
</style>