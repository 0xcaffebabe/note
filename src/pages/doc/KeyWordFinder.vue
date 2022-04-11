<template>
  <div class="kw-finder-root" v-if="kw">
    <span class="kw">{{ kw }}</span>
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
  methods: {
    refresh() {
      this.resultSize =
        document
          .querySelector(".markdown-section")
          ?.getElementsByTagName("mark").length || 0;
      this.currentIndex = 0
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