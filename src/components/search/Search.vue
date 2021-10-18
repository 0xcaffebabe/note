<template>
  <el-drawer v-model="showDrawer" size="600px">
    <template #title>
      <el-input v-model="kw" placeholder="搜索" @input="handleSearch"/>
    </template>
    <div class="search-result" v-loading="showLoading">
      <div v-for="result in resultList" :key="result.url" class="result-item" @click="handleDocClick(result.url)">
        <h3 v-html="result.hilighedUrl"></h3>
        <p v-for="p in result.hilighedSegement" v-html="p" :key="p"/>
      </div>
    </div>
    <el-empty v-show="showEmpty" :description="kw ? '没有搜到 ' + kw + '相关的结果': '搜索结果将在这里展示'" v-if="resultList.length == 0" />
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import searchService from '@/service/SearchService'
import SearchResult from '@/dto/SearchResult'
import docService from '@/service/DocService'

let searchTimer: NodeJS.Timeout

export default defineComponent({
  setup() {
    
  },
  data(){
    return {
      kw: '' as string,
      showDrawer: false as boolean,
      showEmpty: true as boolean,
      showLoading: false as boolean,
      resultList: [] as SearchResult[]
    }
  },
  methods: {
    async show(){
      this.showDrawer = true
    },
    hide(){this.showDrawer = false},
    handleSearch(){
      this.showEmpty = false
      clearTimeout(searchTimer)
      searchTimer = setTimeout(async () => {
        this.showLoading = true
        this.resultList = await searchService.search(this.kw)
        this.showEmpty = true
        this.showLoading = false
      }, 500)
    },
    handleDocClick(doc: string){
      if (!doc.startsWith('./') && !doc.startsWith('/')){
        doc = '/' + doc
      }
      const id = docService.docUrl2Id(doc)
      this.$router.push('/doc/' + id)
    }
  },
})
</script>

<style lang="less">
  .el-drawer__body {
    overflow-y: auto;
    padding-left: 0!important;
    padding-right: 0!important;
    overflow-x: hidden;
  }
</style>

<style lang="less" scoped>
  .search-result {
    width: 100%;
    :deep(mark) {
      color: #409EFF;
      background-color: transparent;
    }
  }
  .result-item {
    cursor: pointer;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(211,220,228,1.00);
  }
  .result-item:hover {
    transition: all 0.3s;
    background-color: #E9EDF2;
  }
</style>
