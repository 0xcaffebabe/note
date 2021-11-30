<template>
  <el-dialog v-model="showDialog" width="25%" @opened="focusAutoComplete">
    <el-autocomplete
    v-model="kw"
    :fetch-suggestions="querySearch"
    placeholder="搜索目录"
    popper-class="popper-list"
    :popper-append-to-body="false"
    ref="autoComplete"
    @select="handleSelect"
    size="medium"
  >
    <template #default="{ item }">
      <div class="value" v-html="renderHilighHTML(item.name)"></div>
      <span class="link">{{ docUrl2Id(item.link) }}</span>
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
import pinyin from 'tiny-pinyin'

function pyFirstLetter(str: string): string {
  return pinyin.convertToPinyin(str, '-')
              .split('-')
              .map(v => v.charAt(0))
              .join("")
}

function categoryIsMatch(category: Category, queryString: string): boolean{
  return category.name?.toLowerCase().indexOf(queryString.toLowerCase()) != -1 || // 包含完全匹配
          pinyin.convertToPinyin(category.name).toLowerCase().indexOf(queryString.toLowerCase()) != -1 || // 包含拼音完全匹配
          pyFirstLetter(category.name).toLowerCase().indexOf(queryString.toLowerCase()) != -1 // 包含拼音首字母匹配
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
    renderHilighHTML(raw: string){
      return raw.replace(new RegExp(this.kw, 'gi'), (str: string) =>`<mark>${str}</mark>`)
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