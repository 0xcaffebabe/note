<template>
  <el-dialog
    v-model="dialogVisible"
    title="添加书签"
    width="30%"
  >
    <el-input placeholder="书签名称" v-model="markName"/>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addBookMark"
          >保存</el-button
        >
      </span>
    </template>
  </el-dialog>
  <el-drawer v-model="showDrawer" size="25%" title="书签列表">
    <el-collapse>
      <el-collapse-item v-for="item of bookMarkMap" :key="item[0]" :title="item[0]" :name="item[0]">
        <p v-for="mark in item[1]" :key="mark.markName">
          {{mark}}
        </p>
      </el-collapse-item>
    </el-collapse>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import BookMarkService from "@/service/BookMarkService";
import { ElNotification } from 'element-plus';
import BookMarkItem from '@/dto/BookMarkItem';

export default defineComponent({
  props: {
    doc: {
      type: String,
      required: true
    }
  },
  setup() {
    
  },
  methods: {
    showAdder(){
      this.dialogVisible = true
    },
    showMarkList(){
      this.bookMarkMap = BookMarkService.getBookMarkMap()
      this.showDrawer = true
    },
    addBookMark(){
      BookMarkService.add({
        docId: this.doc,
        markName: this.markName,
        position: window.scrollY
      })
      ElNotification.success('添加书签成功')
      this.dialogVisible = false
    }
  },
  data(){
    return {
      dialogVisible: false as boolean,
      showDrawer: false as boolean,
      markName: '' as string,
      bookMarkMap: new Map() as Map<string, BookMarkItem[]>
    }
  }
})
</script>

<style lang="less" scoped>

</style>
