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
      const results = this.flatCategoryList.filter(v => v.name?.toLowerCase().indexOf(queryString.toLowerCase()) != -1)
      console.log(results)
      cb(results)
    },
    renderHilighHTML(raw: string){
      return raw.replace(new RegExp(this.kw, 'gi'), (str: string) =>`<mark>${str}</mark>`)
    },
    handleSelect(value: Category){
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
</style>