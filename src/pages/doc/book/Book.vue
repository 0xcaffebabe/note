<template>
  <p class="books">
    📕<span>相关书籍: </span> 
    <el-link @click="showDrawer = true">架构整洁之道</el-link>
  </p>
  <el-drawer direction="ttb" v-model="showDrawer" :with-header="false">
    <div class="book-container">
      <div class="book-item" v-for="book in file.formattedMetadata.books" :key="book.name">
        <div>

        <p class="book-title">{{book.name}}</p>
        <el-tag v-for="chapter in book.chapters" :key="chapter">
          {{chapter}}
        </el-tag>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import DocFileInfo from '@/dto/DocFileInfo'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    file: {
      required: true,
      type: Object as PropType<DocFileInfo>
    }
  },
  data() {
    return {
      showDrawer: false
    }
  },
  setup() {
    
  },
})
</script>


<style lang="less" scoped>
.book-container {
  .book-item {
    display: inline-flex;
    align-items: center;
    width: 200px;
    height: 240px;
    margin:  20px;
    border: 1px solid #ccc;
  }
  .book-title {
    padding: 0 4px;
    width: 100%;
    text-align: center;
  }
  .el-tag {
    margin: 0 4px;
    margin-bottom: 4px;
  }
}
.books {
  padding: 2px;
  margin: 0;
  font-size: 14px;
  span {
    color: var(--el-link-color);
  }
  .el-link {
    padding: 2px;
    font-size: 12px;
    line-height: 12px;
  }
}
</style>