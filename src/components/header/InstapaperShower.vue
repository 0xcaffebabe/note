<template>
  <div class="root">稍后阅读 

    <el-dropdown :hide-on-click="false" trigger="click" @visible-change="handleVisibleChange">
    <span class="el-dropdown-link">
      {{unreadList.length}}
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-button size="mini" style="margin-left:4px" type="success" @click="clean">清理</el-button>
        <el-dropdown-item v-for="item in unreadList" :key="item.originLink" class="article-item" @click="handleArticleClick(item)">
          <h3 class="article-title">{{item.title}}</h3>
          <div class="article-main">
            <p class="article-preview">{{item.preview}}</p>
            <el-image
              style="width: 100px; height: 72px"
              :src="item.thumbnail"
              fit="cover"
            ></el-image>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown> 条</div>
</template>

<script lang="ts">
import InstapaperItem from '@/dto/InstapaperItem'
import InstapaperService from '@/service/InstapaperService'
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      unreadList: [] as InstapaperItem[]
    }
  },
  methods: {
    handleArticleClick(item: InstapaperItem) {
      window.open(item.originLink, '_blank')
    },
    clean(item: InstapaperItem) {
      window.open('https://www.instapaper.com/u', '_blank')
    },
    async handleVisibleChange(visible: boolean) {
      if (visible) {
        this.unreadList = await InstapaperService.getUnreadList()
        console.log(this.unreadList) 
      }
    }
  },
  async created() {
    this.unreadList = await InstapaperService.getUnreadList()
  }
})
</script>


<style lang="less" scoped>
  .root {
    display:inline-block;
    padding-right: 10px;
    font-size: 16px;
    color: #606266
  }
  .el-dropdown-link {
    cursor: pointer;
    color: #00A0FF;
  }
  .article-title {
    max-width: 360px;
    margin-bottom: 6px;
    overflow:hidden; //超出的文本隐藏
    text-overflow:ellipsis; //溢出用省略号显示
    white-space:nowrap; //溢出不换行
  }
  .article-item {
    display: block;
    padding-bottom: 20px;
  }
  .article-preview {
    max-width: 360px;
    display: inline-block;
    line-height: 16px;
    padding: 2px;
    margin: 2px;
  }
  .el-dropdown-menu {
    max-height: 400px;
    overflow: scroll;
  }
  .article-main {
    display: flex;
    justify-content: space-between;
  }

body[theme=dark] {
  .root {
    color: var(--main-dark-text-color);
  }
  .el-dropdown-menu {
    background-color: var(--second-dark-bg-color);
  }
  .el-dropdown-menu__item--divided {
    border-top: 1px solid var(--main-dark-bg-color);
  }
  .article-title {
    color: var(--main-dark-text-color);
  }
  .article-preview {
    color: var(--second-dark-text-color);
  }
}
</style>

<style lang="less">
body[theme=dark] {
  .el-dropdown__popper {
    border-color: var(--default-dark-border-color)!important;
  }
  .el-dropdown-menu__item:focus, .el-dropdown-menu__item:not(.is-disabled):hover {
    background-color: var(--main-dark-bg-color);
  }
}
</style>