<script lang="ts">
  import type { DesktopController } from '../application/DesktopController.svelte';
  import type { ProviderEditorState } from '../application/ProviderEditorState.svelte';
  import { focusModal } from '../actions/focusModal';
  import ModelEditor from './ModelEditor.svelte';

  let {
    desktop,
    editor,
  }: { desktop: DesktopController; editor: ProviderEditorState } = $props();
</script>

<div class="modal-backdrop" role="presentation">
  <div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="provider-title"
    tabindex="-1"
    use:focusModal={{
      canClose: () => !desktop.busy,
      close: () => editor.close(),
    }}
  >
    <form
      onsubmit={(event) => {
        event.preventDefault();
        void editor.save();
      }}
    >
      <div class="section-heading">
        <div>
          <h2 id="provider-title">
            {editor.draft.id ? '编辑模型服务' : '添加模型服务'}
          </h2>
          <p>凭据仅用于本机向指定 API 发起请求。</p>
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label="关闭编辑"
          disabled={desktop.busy}
          onclick={() => editor.close()}
        >
          ×
        </button>
      </div>
      {#if desktop.error}
        <div class="banner danger" role="alert">
          {desktop.error}
        </div>
      {/if}
      <label>
        服务名称
        <input
          bind:value={editor.draft.name}
          required
          maxlength="100"
          placeholder="例如：我的 Claude API"
        />
      </label>
      <div class="two-column form-columns">
        <label>
          接口协议
          <select bind:value={editor.draft.protocol}>
            <option value="anthropic">Anthropic Messages</option>
            <option value="responses">OpenAI Responses</option>
            <option value="chatCompletions">OpenAI Chat Completions</option>
          </select>
        </label>
        <label>
          认证方式
          <select bind:value={editor.draft.authKind}>
            <option value="apiKey">API key</option>
            <option value="bearer">Bearer token</option>
            <option value="none">无需凭据 / 清除已有凭据</option>
          </select>
        </label>
      </div>
      <label>
        API 基础地址
        <input
          type="url"
          bind:value={editor.draft.baseUrl}
          required
          placeholder="https://api.example.com/v1"
          spellcheck="false"
        />
        <small>填写协议对应的基础地址，不填写 /messages 或 /responses。</small>
      </label>
      <label>
        默认模型标识
        <input
          bind:value={editor.draft.model}
          required
          maxlength="200"
          placeholder="服务商提供的完整模型名称"
          spellcheck="false"
        />
      </label>
      <ModelEditor {editor} busy={desktop.busy} />
      {#if editor.draft.authKind !== 'none'}
        <label>
          {editor.draft.authKind === 'bearer' ? 'Bearer token' : 'API key'}
          <input
            type="password"
            bind:value={editor.draft.apiKey}
            autocomplete="new-password"
            placeholder={editor.draft.id
              ? '留空以保留已有凭据'
              : '输入此服务的 API 凭据'}
            spellcheck="false"
          />
          <small>
            {editor.draft.id
              ? '已有密钥不会显示。提交后会清空本次输入。'
              : '不会传给网站，也不会出现在日志中。'}
          </small>
        </label>
      {/if}
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={editor.draft.enabled} />
        启用此模型服务
      </label>
      <div class="modal-actions">
        <button
          type="button"
          class="secondary"
          disabled={desktop.busy}
          onclick={() => editor.close()}
        >
          取消
        </button>
        <button class="primary" type="submit" disabled={desktop.busy}>
          {desktop.busy ? '保存中…' : '保存服务'}
        </button>
      </div>
    </form>
  </div>
</div>
