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
    :render-after-expand="true"
    show-checkbox
    multiple
    :props="props"
    filterable 
    />
  </el-dialog>
</template>

<script lang="ts">
import Category from "@/dto/Category";
import CategoryService from "@/service/CategoryService";
import { defineComponent } from "vue";
import {cloneDeep} from 'lodash-es'

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
        this.cateList = this.data.filter(search);
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

    function appendParentInChildren(cateList: Category[]) {
      if (cateList.length == 0) {
        return;
      }
      for(const parent of cateList) {
        appendParentInChildren(parent.chidren);
        parent.chidren.splice(0,0,{
          name: parent.name,
          link: parent.link,
          chidren: []
        } as Category);
      }
    }

    this.data = cloneDeep(await CategoryService.getCompiledCategoryList());
    appendParentInChildren(this.data);
    this.cateList = [...this.data];
  },
});
</script>
