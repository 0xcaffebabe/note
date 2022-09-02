<template>
  <el-dialog v-model="showSelector">
    <el-button-group style="float:right">
      <el-button size="small" type="success" @click="value = []">清空</el-button>
      <el-button size="small" type="primary" @click="commitSave">确定</el-button>
      <el-button size="small">取消</el-button>
    </el-button-group>
    <el-tree-select 
    style="width:100%"
    v-model="value" 
    :data="cateList"
    node-key="link"
    :highlight-current="true"
    :render-after-expand="false"
    show-checkbox
    multiple
    :props="props"
    filterable 
    :filter-method="filterMethod"
    />
  </el-dialog>
</template>

<script lang="ts">
import Category from "@/dto/Category";
import CategoryService from "@/service/CategoryService";
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      showSelector: false,
      value: [] as string[],
      data: [] as Category[],
      cateList: [] as Category[],
      props: {
        label: 'name',
        children: 'chidren'
      }
    };
  },
  emits: ['onSave'],
  methods: {
    show(initValue: string[]) {
      this.value = [...initValue]
      this.showSelector = true;
    },
    filterMethod(value: string) {
      function search(cate: Category): boolean {
        if (CategoryService.categoryIsMatch(cate, value)) {
          return true;
        }
        for(let c of cate.chidren) {
          if (search(c)) {
            return true;
          }
        }
        return false;
      }

      if (value) {
        console.log(value);
        this.cateList = this.data.filter(search);
        console.log(this.cateList);
      }else {
        this.cateList = [...this.data];
      }
    },
    commitSave() {
      this.$emit("onSave", [...this.value]);
      this.showSelector = false
    }
  },
  async created() {
    this.data = await CategoryService.getCompiledCategoryList();
    this.cateList = [...this.data];
  },
});
</script>
