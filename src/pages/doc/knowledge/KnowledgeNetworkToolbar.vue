<template>
  <div class="tool-zone">
    <div>
      <el-button text class="close-btn" @click="$emit('close')">
        <el-icon><close-bold /></el-icon>
      </el-button>
    </div>
    <div>
      <el-radio-group v-model="mode" placeholder="显示模式" size="small" popper-class="popper-list">
        <el-radio
          v-for="item in displayMode"
          :key="item"
          :label="item"
          :value="item"
        >
        </el-radio>
      </el-radio-group>
    </div>
    <div>
      <el-checkbox v-model="onlySelfRelated" label="只看跟本节点关联的" size="large" />
    </div>
    <div>
      <el-switch
        v-model="isPotential"
        active-color="#409EFF"
        inactive-color="#409EFF"
        inactive-text="显式知识网络"
        active-text="隐式知识网络"
        @change="$emit('change')"
      />
    </div>
    <div>
      度数: <el-input type="number" size="small" v-model="degree" :disabled="!onlySelfRelated || isPotential"></el-input>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { CloseBold } from '@element-plus/icons-vue';

export default defineComponent({
  components: {
    CloseBold
  },
  props: {
    modelValue: {
      type: String as () => "force" | "circular" | "none",
      required: true
    },
    onlySelfRelated: {
      type: Boolean,
      required: true
    },
    isPotential: {
      type: Boolean,
      required: true
    },
    degree: {
      type: Number,
      required: true
    }
  },
  emits: ['update:modelValue', 'update:onlySelfRelated', 'update:isPotential', 'update:degree', 'close', 'change'],
  data() {
    return {
      displayMode: ['force', 'circular'] as const,
    };
  },
  computed: {
    mode: {
      get() {
        return this.modelValue;
      },
      set(value: "force" | "circular" | "none") {
        this.$emit('update:modelValue', value);
      }
    },
  }
});
</script>

<style lang="less" scoped>
.tool-zone {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 9999;
  
  & > div {
    margin-bottom: 10px;
  }
}

.close-btn {
  position: absolute;
  top: -2px;
  right: -2px;
  z-index: 9999;
}
</style>