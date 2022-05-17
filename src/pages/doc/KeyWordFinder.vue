<template>
  <div class="kw-finder-root" v-if="showFinder">
    
    <el-input class="kw" v-model="innerKw" @keypress.enter="$emit('kwChanged', innerKw)" @keyup.esc="showFinder = false" ref="kwInput"></el-input>
    <span class="counter">{{ currentIndex }}/{{ resultSize }}/<span class="visible-index" @click="handleVisibleIndexClick">{{visibleIndex}}</span></span>
    <el-divider direction="vertical" />
    <el-button-group>
      <el-button
        :icon="ArrowUpBold"
        size="small"
        plain
        @click="down"
        :disabled="currentIndex <= 1"
      />
      <el-button
        :icon="ArrowDownBold"
        size="small"
        plain
        @click="up"
        :disabled="currentIndex >= resultSize"
      />
      <el-button
        :icon="CloseBold"
        size="small"
        plain
        @click="showFinder = false"
      />
    </el-button-group>
  </div>
</template>

<script lang="ts" setup>
import { ArrowDownBold, ArrowUpBold,CloseBold } from "@element-plus/icons-vue";
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
  watch: {
    showFinder() {
      if (!this.showFinder) {
        // 隐藏的时候清空高亮样式
        document.querySelector(".markdown-section")!.querySelectorAll('mark').forEach(e => e.replaceWith(...e.childNodes))
        this.currentIndex = 0
        this.visibleIndex = 0
        this.innerKw = ""
        this.resultSize = 0
      }else {
        // 显示的时候聚焦输入框
        this.$nextTick(() => {
          (this.$refs.kwInput as any).focus();
        })
      }
    }
  },
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
      this.visibleIndex = 0
      if (kw) {
        this.innerKw = kw
      }else {
        this.innerKw = this.kw
      }
    },
    handleVisibleIndexClick() {
      this.currentIndex = this.visibleIndex;
      this.jump()
    },
    show() {
      this.showFinder = true;
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
    jump(withScroll: boolean = true) {
      const markList = document.querySelector(".markdown-section")?.getElementsByTagName("mark") || []
      // 清空选中样式
      for(let i of markList) {
        i.classList.remove("hilight-choosed")
      }
      const kwElm = document.querySelector(".markdown-section")?.getElementsByTagName("mark")[this.currentIndex-1];
      if (kwElm) {
        kwElm.classList.add("hilight-choosed")
        if (withScroll) {
          let hilightElm = kwElm
          while(!hilightElm.parentElement?.classList.contains("markdown-section")) {
            if (!hilightElm.parentElement) {
              break
            }
            hilightElm = hilightElm.parentElement
          }
          window.scrollTo(0, hilightElm.offsetTop - 280)
        }
      }
    }
  },
  created() {
    this.$nextTick(this.refresh);

    let timer: NodeJS.Timeout;
    document.addEventListener("scroll", (e) => {
      // 限流同步关键词当前位置
      clearTimeout(timer);
      const that = this
      timer = setTimeout(() => {
        // 没有显示的时候不进行同步
        if (!that.showFinder) {
          return
        }
        const markList = document.querySelector(".markdown-section")?.getElementsByTagName("mark") || []
        for(let i = 0; i < markList.length; i++) {
          const mark = markList[i];
          const difference = window.scrollY - mark.offsetTop + 280
          if (difference > 0 && difference < 50) {
            that.visibleIndex = i + 1
            break
          }
        }
      }, 10);
    });
  },
  data() {
    return {
      resultSize: 0,
      currentIndex: 0,
      innerKw: '',
      showFinder: false,
      visibleIndex: 0
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
  // width: 330px;
  padding-right: 10px;
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
.visible-index {
  color:#999;
  cursor: pointer;
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