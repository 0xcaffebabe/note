<template>
  <div class="kw-finder-root" v-if="showFinder">
    
    <el-input class="kw" v-model="innerKw" @keypress.enter="$emit('kwChanged', innerKw)"></el-input>
    <span class="counter">{{ currentIndex }}/{{ resultSize }}</span>
    <el-divider direction="vertical" />
    <el-button-group>
      <el-button
        :icon="ArrowUpBold"
        size="mini"
        plain
        @click="down"
        :disabled="currentIndex <= 1"
      />
      <el-button
        :icon="ArrowDownBold"
        size="mini"
        plain
        @click="up"
        :disabled="currentIndex >= resultSize"
      />
    </el-button-group>
  </div>
</template>

<script lang="ts" setup>
import { ArrowDownBold, ArrowUpBold } from "@element-plus/icons";
</script>

<script lang="ts">
import { defineComponent } from "vue";

const reg = new RegExp("<mark>");

export default defineComponent({
  props: {
    kw: {
      type: String,
      required: true,
    },
  },
  emits: ['kwChanged'],
  methods: {
    // 刷新状态 传入一个关键词 优先使用该关键词填入搜索框
    // 后备使用当前页面的kw搜索参数
    refresh(kw?: string) {
      if (this.kw) {
        this.showFinder = true
      }
      // 只有可视状态才需要更新视图
      if (!this.showFinder){
        return
      }
      this.resultSize =
        document
          .querySelector(".markdown-section")
          ?.getElementsByTagName("mark").length || 0;
      this.currentIndex = 0
      if (kw) {
        this.innerKw = kw
      }else {
        this.innerKw = this.kw
      }
    },
    show() {
      this.showFinder = true
    },
    hide() {
      this.showFinder = false
    },
    toggle() {
      this.showFinder = !this.showFinder
    },
    down() {
      if (this.currentIndex <= 1) {
        return;
      }
      this.currentIndex--;
      this.jump();
    },
    up() {
      if (this.currentIndex >= this.resultSize) {
        return;
      }
      this.currentIndex++;
      this.jump();
    },
    jump() {
      const markList = document.querySelector(".markdown-section")?.getElementsByTagName("mark") || []
      // 清空选中样式
      for(let i of markList) {
        i.classList.remove("hilight-choosed")
      }
      const kwElm = document.querySelector(".markdown-section")?.getElementsByTagName("mark")[this.currentIndex-1];
      if (kwElm) {
        kwElm.classList.add("hilight-choosed")
        window.scrollTo(0, kwElm.offsetTop - 280)
      }
    }
  },
  created() {
    this.$nextTick(this.refresh);
  },
  data() {
    return {
      resultSize: 0,
      currentIndex: 0,
      innerKw: '',
      showFinder: false,
    };
  },
});
</script>

<style lang="less" scoped>
.kw-finder-root {
  display: inline-block;
  position: fixed;
  bottom: 14px;
  left: 288px;
  width: 330px;
  height: 44px;
  border-radius: 5px;
  background-color: #fff;
  box-shadow: 2px 0 13px #bbb;
}
.kw {
  display: inline-block;
  padding-left: 10px;
  line-height: 44px;
  width: 160px;
  font-size: 14px;
  border: none;
  :deep(.el-input__inner){
    border: none;
  }
}
.counter {
  display: inline-block;
  padding-left: 10px;
  line-height: 44px;
  font-size: 14px;
}

body[theme="dark"] {
  .kw-finder-root {
    background-color: var(--second-dark-bg-color);
    box-shadow: 2px 0 13px #111;
    .kw :deep(.el-input__inner){
      background-color: var(--second-dark-bg-color)!important;
    }
  }
  .el-button.is-disabled {
    background-color: #777;
    border: none
  }
}
</style>

<style lang="less">
.hilight-choosed {
  background-color: #F56C6C!important;
}
</style>