<script lang="ts">
  import type { DesktopController } from '../application/DesktopController.svelte';
  import type { ProviderCatalogController } from '../application/ProviderCatalogController.svelte';
  import type { ProviderEditorState } from '../application/ProviderEditorState.svelte';
  import { protocolNames, statusNames } from '../presentation/ProviderLabels';

  let {
    desktop,
    catalog,
    editor,
  }: {
    desktop: DesktopController;
    catalog: ProviderCatalogController;
    editor: ProviderEditorState;
  } = $props();
</script>

<section class="card">
  <div class="section-heading">
    <div>
      <h2>发现本机配置</h2>
      <p>扫描 Claude Code 和 Codex 的 API 配置；选择后才会导入。</p>
    </div>
    <button
      class="secondary"
      disabled={desktop.busy || !desktop.available}
      onclick={() => catalog.discover()}
    >
      {desktop.busy ? '处理中…' : '扫描配置'}
    </button>
  </div>
  <details>
    <summary>指定配置目录</summary>
    <div class="two-column directory-inputs">
      <label>
        Claude 配置目录
        <input
          bind:value={catalog.claudeDir}
          placeholder="默认：~/.claude"
          spellcheck="false"
        />
        <small>也会遵循 CLAUDE_CONFIG_DIR 环境变量。</small>
      </label>
      <label>
        Codex 配置目录
        <input
          bind:value={catalog.codexDir}
          placeholder="默认：~/.codex"
          spellcheck="false"
        />
        <small>也会遵循 CODEX_HOME 环境变量。</small>
      </label>
    </div>
  </details>
  {#if catalog.scanned}
    {#if catalog.discovered.length}
      <div class="discovered-list">
        {#each catalog.discovered as candidate (candidate.id)}
          <div class="discovered-item">
            <div>
              <div class="title-row">
                <strong>{candidate.name}</strong>
                <span class="badge" class:green={candidate.status === 'ready'}>
                  {statusNames[candidate.status]}
                </span>
              </div>
              <p class="muted break-word">{candidate.source}</p>
              <p>{candidate.message}</p>
              {#if candidate.model}
                <small>
                  {protocolNames[candidate.protocol]} · {candidate.models
                    ?.length || 1} 个模型 · {candidate.model}
                </small>
              {/if}
            </div>
            <button
              class="secondary compact"
              disabled={desktop.busy || candidate.status !== 'ready'}
              onclick={() => catalog.importProvider(candidate.id)}
            >
              导入并启用
            </button>
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty-inline">
        没有发现可导入的配置。可以指定目录后重试，或手动添加模型服务。
      </p>
    {/if}
  {/if}
  <p class="tip">
    仅支持 API 凭据。Claude / ChatGPT 订阅的 OAuth 登录不等同于 API 授权。
  </p>
</section>

<section class="card">
  <div class="section-heading">
    <div>
      <h2>
        模型服务 <span class="inline-count">
          {desktop.snapshot?.providers.length ?? 0}
        </span>
      </h2>
      <p>启用的服务会出现在已配对网站的模型列表中。</p>
    </div>
    <button
      class="primary"
      disabled={desktop.busy || !desktop.available}
      onclick={() => editor.open()}
    >
      ＋ 添加服务
    </button>
  </div>
  {#if desktop.snapshot?.providers.length}
    <div class="provider-list">
      {#each desktop.snapshot.providers as provider (provider.id)}
        <article class="provider-card">
          <div class="provider-heading">
            <div class="provider-symbol" aria-hidden="true">
              {provider.protocol === 'anthropic' ? 'A' : 'O'}
            </div>
            <div class="provider-title">
              <h3>{provider.name}</h3>
              <span class="muted">{protocolNames[provider.protocol]}</span>
            </div>
            <label class="switch">
              <input
                type="checkbox"
                checked={provider.enabled}
                disabled={desktop.busy}
                onchange={() => catalog.toggleProvider(provider)}
                aria-label={`${provider.enabled ? '停用' : '启用'} ${provider.name}`}
              />
              <span>{provider.enabled ? '已启用' : '已停用'}</span>
            </label>
          </div>
          <dl class="provider-details">
            <dt>模型列表</dt>
            <dd>
              {provider.models?.length || 1} 个模型 · 默认 {provider.model}
            </dd>
            <dt>API 地址</dt>
            <dd>{provider.baseUrl}</dd>
            <dt>认证</dt>
            <dd>
              {provider.authKind === 'none'
                ? '无需凭据'
                : provider.authKind === 'bearer'
                  ? 'Bearer token · 本机保存'
                  : 'API key · 本机保存'}
            </dd>
          </dl>
          <div class="provider-actions">
            <button
              class="secondary compact"
              disabled={desktop.busy}
              onclick={() => catalog.testProvider(provider)}
            >
              测试连接
            </button>
            <button
              class="text-button"
              disabled={desktop.busy}
              onclick={() => editor.open(provider)}
            >
              编辑
            </button>
            <button
              class="text-button danger-text"
              disabled={desktop.busy}
              onclick={() => (catalog.deleteTarget = provider)}
            >
              删除
            </button>
          </div>
        </article>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <span class="empty-symbol" aria-hidden="true">▦</span>
      <strong>添加你的第一个模型服务</strong>
      <p>扫描本机配置或手动填写 API 地址、模型和凭据。</p>
    </div>
  {/if}
  <p class="tip">“测试连接”会发送最小模型请求，可能产生少量 API 费用。</p>
</section>
