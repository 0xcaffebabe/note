<template>
  <el-dialog v-model="showDialog" :width="$isMobile()? '90%' : '40%'" @opened="focusAutoComplete">
    <el-autocomplete
    v-model="kw"
    :fetch-suggestions="querySearch"
    placeholder="搜索目录"
    popper-class="popper-list"
    :popper-append-to-body="false"
    ref="autoComplete"
    @select="handleSelect"
    size="default"
  >
    <template #default="{ item }">
      <div class="value" v-html="renderHilighHTML(item.name)"></div>
      <span class="link" v-html="renderHilighHTML(docUrl2Id(item.link))"></span>
    </template>
  </el-autocomplete>
  </el-dialog>  
</template>

<script lang="ts">
import Category from '@/dto/Category'
import CategoryService from '@/service/CategoryService'
import DocUtils from '@/util/DocUtils'
import { ElAutocomplete } from 'element-plus'
import { defineComponent, ref } from 'vue'
import { PinyinUtils } from '@/util/PinyinUtils'


function categoryLinkIsMatch(category: Category, queryString: string): boolean {
  const link = decodeURI(category.link).replace(/\//gi, '')
  return link.toLowerCase().indexOf(queryString.toLowerCase()) != -1 || // 目录名包含完全匹配
          PinyinUtils.fullPinyinContains(link, queryString) || // 目录名包含拼音完全匹配
          PinyinUtils.firstLetterPinyinContains(link, queryString)  // 目录名包含拼音首字母匹配
}

function categoryNameIsMatch(category: Category, queryString: string): boolean {
  return category.name?.toLowerCase().indexOf(queryString.toLowerCase()) != -1 || // 文档名包含完全匹配
          PinyinUtils.fullPinyinContains(category.name, queryString) || // 文档名包含拼音完全匹配
          PinyinUtils.firstLetterPinyinContains(category.name, queryString)  // 文档名包含拼音首字母匹配
}


function categoryIsMatch(category: Category, queryString: string): boolean{
  const kwList = queryString.split(" ")
  let allMatched = true
  for(let kw of kwList) {
    allMatched &&= categoryNameIsMatch(category, kw) || categoryLinkIsMatch(category, kw)
  }
  return allMatched
}

export default defineComponent({
  setup() {
    const autoComplete = ref<InstanceType<typeof ElAutocomplete>>();
    const focusAutoComplete = () => {
      autoComplete.value?.focus()
    }
    return {
      autoComplete, focusAutoComplete
    }
  },
  data(){
    return {
      showDialog: false as boolean,
      categoryList: [] as Category[],
      flatCategoryList: [] as Category[],
      kw: '' as string
    }
  },
  methods: {
    show(){
      this.showDialog = true;
    },
    docUrl2Id: DocUtils.docUrl2Id,
    flatMapCategoryList(list: Category[]): Category[]{
      let results: Category[] = []
      for(let i of list) {
        results.push(i)
        results = results.concat(...this.flatMapCategoryList(i.chidren))
      }
      return results
    },
    querySearch(queryString: string, cb: any){
      // 如果没有搜索内容 默认展示历史记录
      if (!queryString) {
        cb(CategoryService.getCategorySearchRecords())
      }else {
        const results = this.flatCategoryList.filter(v => categoryIsMatch(v, queryString))
        cb(results)
      }
    },
    renderHilighHTML(raw: string): string{
      const kwList = (this.kw || "").trim().split(" ")
      let html = raw
      for(let kw of kwList) {
        html = html.replace(new RegExp(kw, 'gi'), (str: string) =>`<mark>${str}</mark>`)
      }
      return html
    },
    handleSelect(value: Category){
      // 记录搜索点击结果
      CategoryService.addCategorySearchRecord({
        name: value.name,
        link: value.link,
        chidren: []
      });

      this.$router.push('/doc/' + this.docUrl2Id(value.link))
      this.showDialog = false
    }
  },
  async created(){
    this.categoryList = await CategoryService.getCategoryList()
    this.flatCategoryList = this.flatMapCategoryList(this.categoryList).filter(v => v.name)
  }
})
</script>

<style lang="less">
  .el-autocomplete{
    width: 100%;
  }
  .popper-list {
    max-width: 80%;
  }
</style>

<style lang="less" scoped>
  .link {
    color: #409EFF;
  }

  body[theme=dark] {
    .value {
      color: var(--main-dark-text-color);
    }
  }
</style>