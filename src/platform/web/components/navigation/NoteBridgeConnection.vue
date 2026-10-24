<template>
  <el-dialog
    :model-value="modelValue"
    title="Note Bridge 连接"
    width="min(100% - var(--spacing-xl), 480px)"
    append-to-body
    @update:model-value="$emit('update:modelValue', $event)"
    @closed="$emit('closed')"
  >
    <section class="bridge-connection" aria-label="Note Bridge 连接设置">
      <p class="bridge-status" :class="{ connected: state === 'ready' }" role="status">
        <span class="status-dot" aria-hidden="true"></span>
        {{ statusText }}
      </p>
      <p class="bridge-hint">连接本机 Note Bridge，向整个知识库提问。</p>
      <p v-if="snapshot.remembered" class="bridge-hint">
        已记住此浏览器的连接凭证，刷新后会自动重连。服务商密钥仅保存在桌面端。
      </p>
      <p v-else-if="state === 'ready'" class="bridge-hint">
        当前页面已连接，但未能保存连接凭证，刷新后需要重新配对。
      </p>
      <p v-else class="bridge-hint">
        输入桌面端生成的一次性配对码即可连接。成功后会自动保存连接凭证，刷新页面无需再次输入配对码。
      </p>
      <p v-if="snapshot.message || error" class="bridge-message" role="alert">
        {{ error || snapshot.message }}
      </p>

      <form v-if="!snapshot.remembered && state !== 'ready'" class="bridge-fields" @submit.prevent="pair">
        <label>
          配对码
          <input
            v-model="code"
            aria-label="配对码"
            inputmode="numeric"
            autocomplete="off"
            pattern="[0-9]{6}"
            maxlength="6"
            placeholder="桌面端的 6 位配对码"
            required
            :disabled="connecting"
          />
        </label>
        <label>
          本地端口
          <input
            v-model.number="port"
            aria-label="本地端口"
            type="number"
            min="1024"
            max="65535"
            required
            :disabled="connecting"
          />
        </label>
        <button type="submit" :disabled="connecting || !/^\d{6}$/.test(code)">连接 Note Bridge</button>
      </form>
      <template v-else>
        <p class="bridge-hint">本地端口：{{ snapshot.port }}</p>
        <ul v-if="state === 'ready' && providers.length" class="bridge-providers" aria-label="可用模型服务">
          <li v-for="provider in providers" :key="provider.id">
            {{ provider.name }} · {{ provider.models?.length || 1 }} 个模型 · 默认 {{ provider.model }}
          </li>
        </ul>
        <p v-else-if="state === 'ready'" class="bridge-hint">
          桌面端尚无可用服务，请先配置并启用模型，保存后会自动同步。
        </p>
        <div class="bridge-actions">
          <button type="button" :disabled="connecting" @click="reconnect">重新连接</button>
          <button v-if="state !== 'disconnected'" type="button" @click="disconnect">断开连接</button>
          <button v-if="snapshot.remembered || state === 'ready'" type="button" @click="forget">
            忘记连接
          </button>
        </div>
        <p class="bridge-hint">断开仅暂停本页连接；忘记连接会清除此浏览器保存的凭证。</p>
      </template>
    </section>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useAiBridgeConnection } from './useAiBridgeConnection'
import { useBridgeConnectionForm } from './useBridgeConnectionForm'

const props = defineProps<{ modelValue: boolean }>()
defineEmits<{
  'update:modelValue': [value: boolean]
  closed: []
}>()
const { bridge, snapshot, state, providers, statusText } = useAiBridgeConnection()
const { code, port, error, pair, reconnect, disconnect, forget } = useBridgeConnectionForm(
  toRef(props, 'modelValue'),
  bridge,
  snapshot,
)
const connecting = computed(() => state.value === 'connecting')
</script>

<style scoped lang="less">
.bridge-connection,
.bridge-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  color: var(--main-text-color);
}
p {
  margin: 0;
}
.bridge-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
}
.bridge-status.connected {
  color: var(--success-color);
}
.status-dot {
  width: var(--spacing-sm);
  height: var(--spacing-sm);
  border-radius: 50%;
  background: currentColor;
}
.bridge-hint {
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
  line-height: var(--leading-normal);
}
.bridge-message {
  color: var(--danger-color);
  overflow-wrap: anywhere;
}
label {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
input,
button {
  box-sizing: border-box;
  max-width: 100%;
  min-height: var(--site-control-size);
  font: inherit;
  color: var(--main-text-color);
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
}
button {
  cursor: pointer;
  background: var(--hover-bg-color);
}
button:disabled {
  cursor: default;
  opacity: 0.6;
}
.bridge-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.bridge-providers {
  margin: 0;
  padding-inline-start: var(--spacing-lg);
  overflow-wrap: anywhere;
}
</style>
