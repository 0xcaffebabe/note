<template>
  <transition name="fade">
    <div ref="root" class="context-menu" v-show="visible">
      <el-button 
        class="close-btn" 
        size="small" 
        circle 
        @click="hide"
        :icon="CloseBold"
      />
      <div class="menu-items">
        <el-button 
          size="small" 
          class="menu-item"
          @click="$emit('toggleFixed');hide()" 
          v-if="fixed"
        >
          取消固定
        </el-button>
        <el-button 
          size="small" 
          class="menu-item"
          @click="$emit('toggleFixed');hide()" 
          v-else
        >
          固定菜单
        </el-button>
        <el-button 
          size="small" 
          class="menu-item"
          :disabled="cateList.length <= 1" 
          @click="closeCurrent"
        >
          关闭
        </el-button>
        <el-button 
          size="small" 
          class="menu-item"
          :disabled="cateList.length <= 1" 
          @click="closeOthers"
        >
          关闭其他
        </el-button>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { CloseBold } from "@element-plus/icons-vue";
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
      // 只有在当前目录与要被关闭的菜单项相同时才跳转
      if (this.currentCate.link == this.cateLink) {
        this.$router.push('/doc/' + docId);
      }
      this.hide();
    },
    close(cateLink: string) {
      this.cateLink = cateLink
      this.closeCurrent()
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
.context-menu {
  position: fixed;
  z-index: 9999;
  background-color: var(--card-bg-color);
  width: 160px;
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.close-btn {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  padding: 4px;
  width: 26px;
  height: 26px;
  border: none;
  background-color: transparent;
  color: var(--secondary-text-color);
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--main-text-color);
    background-color: var(--hover-bg-color);
  }
  
  body[theme=dark] & {
    color: var(--dark-secondary-text-color);
    
    &:hover {
      color: var(--dark-text-color);
      background-color: var(--dark-hover-bg-color);
    }
  }
}

.menu-items {
  padding-top: 26px; // 为关闭按钮留出空间
}

.menu-item {
  width: 100%;
  justify-content: flex-start;
  border-radius: var(--radius-md);
  margin: 2px 0;
  padding: 8px 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  
  &:not(.is-disabled):hover {
    background-color: var(--hover-bg-color);
    border-color: var(--border-color);
    transform: translateX(2px);
  }
  
  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  body[theme=dark] & {
    &:not(.is-disabled):hover {
      background-color: var(--dark-hover-bg-color);
      border-color: var(--default-dark-border-color);
    }
  }
}

// 动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

body[theme=dark] {
  .context-menu {
    background-color: var(--dark-card-bg-color);
    border: 1px solid var(--default-dark-border-color);
  }
}
</style>