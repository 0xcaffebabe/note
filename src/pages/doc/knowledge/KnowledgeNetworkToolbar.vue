<template>
  <div class="net-toolbar">
    <div class="net-row">
      <span class="net-label">布局</span>
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="force">力导向</el-radio-button>
        <el-radio-button value="circular">环形</el-radio-button>
      </el-radio-group>
    </div>
    <div class="net-row">
      <span class="net-label" title="显式: 文档间真实链接; 隐式: 算法预测的潜在关联">网络</span>
      <el-radio-group v-model="potentialValue" size="small" @change="$emit('change')">
        <el-radio-button :value="false">显式</el-radio-button>
        <el-radio-button :value="true">隐式</el-radio-button>
      </el-radio-group>
    </div>
    <div class="net-row">
      <el-checkbox v-model="onlySelfRelatedValue" label="仅看与当前文档相关" size="small" />
    </div>
    <div class="net-row">
      <span class="net-label" title="从当前文档出发的关联跳数(仅显式网络生效)">度数</span>
      <el-input-number
        v-model="degreeValue"
        size="small"
        :min="1"
        :max="6"
        :disabled="!onlySelfRelated || isPotential"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
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
  emits: ['update:modelValue', 'update:onlySelfRelated', 'update:isPotential', 'update:degree', 'change'],
  computed: {
    mode: {
      get() {
        return this.modelValue;
      },
      set(value: "force" | "circular" | "none") {
        this.$emit('update:modelValue', value);
      }
    },
    degreeValue: {
      get() {
        return this.degree;
      },
      set(value: number) {
        // 确保输入值是数字类型
        const numValue = Number(value);
        this.$emit('update:degree', isNaN(numValue) ? 1 : numValue);
      }
    },
    potentialValue: {
      get() {
        return this.isPotential;
      },
      set(value: boolean) {
        this.$emit('update:isPotential', value);
      }
    },
    onlySelfRelatedValue: {
      get() {
        return this.onlySelfRelated;
      },
      set(value: boolean) {
        this.$emit('update:onlySelfRelated', value);
      }
    }
  }
});
</script>

<style lang="less" scoped>
// 控制面板: 卡片化悬浮 不再让控件裸浮在图表节点之上
.net-toolbar {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  z-index: var(--z-float);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 12px;
  background-color: color-mix(in srgb, var(--elevated-bg-color) 92%, transparent);
  backdrop-filter: blur(6px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.net-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.net-label {
  flex-shrink: 0;
  width: 28px;
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
  cursor: default;
}
</style>
