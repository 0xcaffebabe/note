<template>
  <transition name="fade">
    <div ref="root" class="root" v-show="visible">
      <el-button class="close-button" size="mini" circle @click="hide">
        <el-icon><close-bold /></el-icon>
      </el-button>
      <el-button-group>
        <el-button size="mini" class="menu-button" @click="$emit('toggleFixed');hide()" v-if="fixed">取消固定</el-button>
        <el-button size="mini" class="menu-button" @click="$emit('toggleFixed');hide()" v-else>固定菜单</el-button>
        <el-button size="mini" class="menu-button" :disabled="cateList.length <= 1" @click="closeCurrent">关闭</el-button>
        <el-button size="mini" class="menu-button" :disabled="cateList.length <= 1" @click="closeOthers">关闭其他</el-button>
      </el-button-group>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { CloseBold } from "@element-plus/icons";
import Category from "@/dto/Category";
import DocUtils from "@/util/DocUtils";

export default defineComponent({
  props: {
    fixed: {
      type: Boolean,
      required: true
    }
  },
  components: {
    CloseBold
  },
  emits: ['toggleFixed'],
  data() {
    return {
      docLink: "",
      visible: false,
      cateLink: "",
    };
  },
  computed: {
    cateList(): string[] {
      return this.$store.state.currentCategoryList
    },
    currentCate(): Category {
      return this.$store.state.currentCategory;
    }
  },
  methods: {
    show(cateLink: string, x: number, y: number) {
      this.cateLink = cateLink;
      const popover :HTMLElement = this.$refs.root as HTMLElement;
      this.visible = true;
      popover.style.top = y + "px";
      popover.style.left = x + "px";
    },
    hide() {
      this.visible = false;
    },
    closeCurrent(){
      let index = this.cateList.indexOf(this.cateLink);
      this.$store.commit('removeFromCategoryList', this.cateLink);
      if (index > 0) {
        index--;
      }
      const docId = DocUtils.docUrl2Id(this.cateList[index]);
      // 只有在当前目录与要被关闭的目录的时候相同时才跳转
      if (this.currentCate.link == this.cateLink) {
        this.$router.push('/doc/' + docId);
      }
      this.hide();
    },
    closeOthers(){
      this.$store.commit('removeFromCategoryListExcept', this.cateLink);
      this.$router.push('/doc/' + DocUtils.docUrl2Id(this.cateList[0]));
      this.hide();
    }
  },
  mounted(){

  },
  setup() {},
});
</script>

<style lang="less" scoped>
.root {
  transition: all 0.2s;
  background-color: #fff;
  width: 100px;
  position: fixed;
  z-index: 999;
  top: 80px;
  left: 400px;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.close-button {
  float: right;
}
.menu-button {
  width: 100%;
}

// 动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

body[theme=dark] {
  .root {
    background-color: var(--second-dark-bg-color);
  }
}
</style>