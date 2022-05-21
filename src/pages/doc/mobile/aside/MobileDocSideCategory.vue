<template>
  <el-drawer
    v-model="showDrawer"
    direction="ltr"
    :with-header="false"
    size="64%"
    :close-on-click-modal="true"
    :append-to-body="false"
    custom-class="category-drawer"
  >
    <div class="category-wrapper">
      <category-list :doc="doc" />
    </div>
  </el-drawer>
  <el-affix :offset="384" style="height: 100px">
    <el-button class="cate-fix-btn" type="primary" size="small" @click="showDrawer = true">
      <el-icon>
        <arrow-right-bold />
      </el-icon>
    </el-button>
  </el-affix>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CategoryList from "../../category/CategoryList.vue";
import { ArrowRightBold } from "@element-plus/icons-vue";

export default defineComponent({
  props: {
    doc: {
      required: true,
      type: String,
    },
  },
  components: { CategoryList, ArrowRightBold },
  setup() {},
  data() {
    return {
      showDrawer: false,
    };
  },
});
</script>

<style lang="less">
.category-drawer .el-drawer__body {
  padding: 0 !important;
}
</style>
<style lang="less" scoped>
.category-wrapper {
  height: 100%;
  min-width: 64%;
}
.cate-fix-btn {
  padding: 10px 8px;
  margin-left: -13px;
}
</style>