<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke, isTauri } from '@tauri-apps/api/core';
  import type {
    DiscoveredProvider,
    Provider,
    ProviderInput,
    Snapshot,
  } from './types';

  type Tab = 'connection' | 'providers' | 'logs';
  const protocolNames = {
    anthropic: 'Anthropic Messages',
    responses: 'OpenAI Responses',
    chatCompletions: 'OpenAI Chat Completions',
  };
  const statusNames = {
    ready: '可导入',
    missingCredential: '缺少凭据',
    unsupported: '暂不支持',
    invalid: '配置无效',
  };
  let tab = $state<Tab>('connection');
  let snapshot = $state<Snapshot | null>(null);
  let port = $state(19661);
  let origins = $state('');
  let busy = $state(false);
  let error = $state('');
  let notice = $state('');
  let desktop = $state(true);
  let now = $state(Date.now());
  let claudeDir = $state('');
  let codexDir = $state('');
  let discovered = $state<DiscoveredProvider[]>([]);
  let scanned = $state(false);
  let logLevel = $state('all');
  let logSearch = $state('');
  let editorOpen = $state(false);
  let draft = $state<ProviderInput>(newProvider());
  let deleteTarget = $state<Provider | null>(null);
  let refreshing = false;

  const enabledCount = $derived(
    snapshot?.providers.filter((provider) => provider.enabled).length ?? 0,
  );
  const remaining = $derived(
    Math.max(0, Math.ceil(((snapshot?.pairing?.expiresAt ?? 0) - now) / 1000)),
  );
  const filteredLogs = $derived(
    (snapshot?.logs ?? [])
      .filter(
        (entry) =>
          (logLevel === 'all' || entry.level === logLevel) &&
          `${entry.message} ${entry.requestId ?? ''} ${entry.providerId ?? ''} ${entry.model ?? ''}`
            .toLowerCase()
            .includes(logSearch.toLowerCase()),
      )
      .slice()
      .reverse(),
  );

  function newProvider(): ProviderInput {
    return {
      name: '',
      protocol: 'anthropic',
      baseUrl: '',
      model: '',
      authKind: 'apiKey',
      enabled: true,
      apiKey: '',
    };
  }

  async function refresh() {
    if (refreshing || !desktop) return;
    refreshing = true;
    try {
      const next = await invoke<Snapshot>('get_snapshot');
      if (!snapshot) {
        port = next.port;
        origins = next.allowedOrigins.join('\n');
      }
      snapshot = next;
      now = Date.now();
    } catch (cause) {
      error = String(cause);
    } finally {
      refreshing = false;
    }
  }

  onMount(() => {
    desktop = isTauri();
    if (!desktop) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 1000);
    return () => window.clearInterval(timer);
  });

  async function perform(action: () => Promise<unknown>, success = '') {
    if (busy || !desktop) return;
    busy = true;
    error = '';
    notice = '';
    try {
      await action();
      if (success) notice = success;
      await refresh();
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = false;
    }
  }

  function toggleServer() {
    return perform(() =>
      snapshot?.running
        ? invoke('stop_bridge')
        : invoke('start_bridge', {
            port,
            origins: origins
              .split(/\r?\n/)
              .map((origin) => origin.trim())
              .filter(Boolean),
          }),
    );
  }

  function editProvider(provider?: Provider) {
    error = '';
    draft = provider ? { ...provider, apiKey: '' } : newProvider();
    editorOpen = true;
  }

  function closeEditor() {
    draft.apiKey = '';
    editorOpen = false;
  }

  function focusModal(node: HTMLElement) {
    const previous = document.activeElement as HTMLElement | null;
    const selector =
      'button:enabled, input:enabled, select:enabled, textarea:enabled, [tabindex="0"]';
    node.querySelector<HTMLElement>(selector)?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        closeEditor();
        deleteTarget = null;
      }
      if (event.key !== 'Tab') return;
      const elements = [...node.querySelectorAll<HTMLElement>(selector)];
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    node.addEventListener('keydown', keydown);
    return {
      destroy() {
        node.removeEventListener('keydown', keydown);
        previous?.focus();
      },
    };
  }

  async function saveProvider(event: SubmitEvent) {
    event.preventDefault();
    await perform(async () => {
      try {
        await invoke('save_provider', {
          input: {
            ...draft,
            name: draft.name.trim(),
            baseUrl: draft.baseUrl.trim(),
            model: draft.model.trim(),
            apiKey:
              draft.authKind === 'none' || !draft.apiKey?.trim()
                ? undefined
                : draft.apiKey,
          },
        });
        editorOpen = false;
      } finally {
        draft.apiKey = '';
      }
    }, '服务配置已保存。');
  }

  function discover() {
    return perform(async () => {
      discovered = await invoke<DiscoveredProvider[]>('discover_providers', {
        paths: {
          claudeDir: claudeDir.trim() || undefined,
          codexDir: codexDir.trim() || undefined,
        },
      });
      scanned = true;
    });
  }

  function exportLogs() {
    return perform(async () => {
      const saved = await invoke<string | null>('save_logs');
      if (saved) notice = `日志已导出到 ${saved}`;
    });
  }

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false });
  }
</script>

<svelte:head><title>note-bridge · 本地模型桥接</title></svelte:head>

<div class="app-shell">
  <aside class="sidebar">
    <a
      class="brand"
      href="#connection"
      onclick={() => (tab = 'connection')}
      aria-label="note-bridge 首页"
    >
      <span class="brand-mark" aria-hidden="true"
        ><svg viewBox="0 0 24 24"
          ><path d="M5 18V6h3l8 12h3V6M8 6v12M16 6v12" /></svg
        ></span
      >
      <span
        >note<span class="brand-light">-bridge</span><small
          >你的本地模型入口</small
        ></span
      >
    </a>
    <nav aria-label="主导航">
      <button
        class:active={tab === 'connection'}
        onclick={() => (tab = 'connection')}
        ><span aria-hidden="true">◈</span> 连接与配对
        <span class="nav-count">{snapshot?.authorizations.length ?? 0}</span
        ></button
      >
      <button
        class:active={tab === 'providers'}
        onclick={() => (tab = 'providers')}
        ><span aria-hidden="true">▦</span> 模型服务
        <span class="nav-count">{snapshot?.providers.length ?? 0}</span></button
      >
      <button class:active={tab === 'logs'} onclick={() => (tab = 'logs')}
        ><span aria-hidden="true">≡</span> 运行日志</button
      >
    </nav>
    <div class="sidebar-bottom">
      <div class="local-note">
        <span class="status-dot" class:running={snapshot?.running}
        ></span><strong
          >{snapshot?.running ? '桥接服务运行中' : '桥接服务已停止'}</strong
        >
      </div>
      <p>凭据保存在本机。<br />网站通过配对调用模型。</p>
      <span class="version">note-bridge 0.1.0</span>
    </div>
  </aside>

  <main>
    <header class="page-header">
      <div>
        <p class="eyebrow">LOCAL FIRST · LOCAL CONTROL</p>
        <h1>
          {tab === 'connection'
            ? '连接你的知识与模型'
            : tab === 'providers'
              ? '管理模型服务'
              : '查看运行状态'}
        </h1>
        <p class="subtitle">
          {tab === 'connection'
            ? '启动本地桥接，让文档问答使用你已有的模型服务。'
            : tab === 'providers'
              ? '导入本机 CLI 配置，或添加兼容 API 的模型服务。'
              : '排查连接和模型请求；日志不会记录密钥或问答正文。'}
        </p>
      </div>
      <span class="badge local-badge">仅本机访问</span>
    </header>

    {#if !desktop}
      <div class="banner warning" role="status">
        <strong>请在 note-bridge 桌面应用中打开。</strong> 浏览器预览无法访问本机配置或启动桥接。
      </div>
    {/if}
    {#if error}<div class="banner danger" role="alert">
        <span>{error}</span><button
          aria-label="关闭错误提示"
          onclick={() => (error = '')}>×</button
        >
      </div>{/if}
    {#if notice}<div class="banner success" role="status">
        <span>{notice}</span><button
          aria-label="关闭提示"
          onclick={() => (notice = '')}>×</button
        >
      </div>{/if}

    {#if tab === 'connection'}
      <section class="service-card card">
        <div class="section-heading">
          <div class="heading-icon" aria-hidden="true">↔</div>
          <div>
            <h2>本地桥接服务</h2>
            <p>仅监听 127.0.0.1，允许的网站需要单独配对。</p>
          </div>
          <span class="badge" class:green={snapshot?.running}
            >{snapshot?.running ? '运行中' : '未启动'}</span
          >
        </div>
        <div class="service-summary">
          <div>
            <span class="label">桥接地址</span><code
              >ws://127.0.0.1:{snapshot?.running
                ? snapshot.port
                : port}/ws</code
            >
          </div>
          <div>
            <span class="label">可用模型服务</span><strong
              >{enabledCount}<span class="summary-unit"> 个</span></strong
            >
          </div>
          <button
            class="primary"
            class:stop={snapshot?.running}
            disabled={busy || !desktop || !snapshot}
            onclick={toggleServer}
            >{snapshot?.running ? '停止服务' : '启动服务'}
            <span aria-hidden="true">{snapshot?.running ? '■' : '→'}</span
            ></button
          >
        </div>
        <details class="connection-settings">
          <summary>监听端口与允许的网站</summary>
          <div class="settings-grid">
            <label
              >端口<input
                type="number"
                bind:value={port}
                min="1024"
                max="65535"
                required
                disabled={snapshot?.running || busy}
              /><small>默认 19661。停止服务后可修改。</small></label
            ><label
              >允许的 Origin（每行一个）<textarea
                rows="3"
                bind:value={origins}
                disabled={snapshot?.running || busy}
                placeholder="https://your-note-site.example"
                spellcheck="false"
              ></textarea><small
                >完整填写协议、主机和端口，不含路径。禁止通配符。</small
              ></label
            >
          </div>
        </details>
      </section>

      <section class="card pairing-card">
        <div class="section-heading">
          <div>
            <h2>配对新网站</h2>
            <p>在网站导航的 note-bridge 中输入配对码，正确后即可连接。</p>
          </div>
        </div>
        <div class="pairing-control">
          {#if snapshot?.pairing && remaining > 0}
            <div
              class="pairing-code"
              aria-label={`配对码 ${snapshot.pairing.code}`}
            >
              {snapshot.pairing.code}
            </div>
            <p class="pairing-expiry">{remaining} 秒后失效 · 仅用于本次配对</p>
            <button
              class="secondary full-width"
              disabled={busy}
              onclick={() => perform(() => invoke('open_pairing'))}
              >生成新的配对码</button
            >
          {:else}
            <div class="pairing-placeholder" aria-hidden="true">
              − − − − − −
            </div>
            <p class="pairing-expiry">启动服务后，生成一次性配对码</p>
            <button
              class="secondary full-width"
              disabled={busy || !snapshot?.running}
              onclick={() => perform(() => invoke('open_pairing'))}
              >生成配对码</button
            >
          {/if}
          <p class="tip">配对后会记住授权，网站刷新可自动重连。</p>
        </div>
      </section>

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>
              已授权的网站 <span class="inline-count"
                >{snapshot?.authorizations.length ?? 0}</span
              >
            </h2>
            <p>离线网站也会保留。撤销授权会终止使用该授权的所有连接和请求。</p>
          </div>
        </div>
        {#if snapshot?.authorizations.length}<ul class="plain-list">
            {#each snapshot.authorizations as authorization (authorization.id)}<li
                class="connection-item"
              >
                <span class="site-icon" aria-hidden="true">↗</span>
                <div>
                  <strong>{authorization.origin}</strong><small
                    >授权于 {new Date(authorization.createdAt).toLocaleString(
                      'zh-CN',
                    )}</small
                  ><small
                    >最近连接 {new Date(
                      authorization.lastConnectedAt,
                    ).toLocaleString('zh-CN')}</small
                  >
                </div>
                <span class="badge" class:green={authorization.connected}
                  >{authorization.connected ? '已连接' : '离线'}</span
                >
                <button
                  class="text-button danger-text"
                  disabled={busy}
                  onclick={() =>
                    perform(
                      () =>
                        invoke('revoke_authorization', {
                          id: authorization.id,
                        }),
                      '网站授权已撤销，再次连接需要重新配对。',
                    )}>撤销授权</button
                >
              </li>{/each}
          </ul>{:else}<div class="empty-inline">
            还没有授权的网站。在网站输入配对码即可开始文档问答。
          </div>{/if}
      </section>
    {:else if tab === 'providers'}
      <section class="card">
        <div class="section-heading">
          <div>
            <h2>发现本机配置</h2>
            <p>扫描 Claude Code 和 Codex 的 API 配置；选择后才会导入。</p>
          </div>
          <button
            class="secondary"
            disabled={busy || !desktop}
            onclick={discover}>{busy ? '处理中…' : '扫描配置'}</button
          >
        </div>
        <details>
          <summary>指定配置目录</summary>
          <div class="two-column directory-inputs">
            <label
              >Claude 配置目录<input
                bind:value={claudeDir}
                placeholder="默认：~/.claude"
                spellcheck="false"
              /><small>也会遵循 CLAUDE_CONFIG_DIR 环境变量。</small></label
            ><label
              >Codex 配置目录<input
                bind:value={codexDir}
                placeholder="默认：~/.codex"
                spellcheck="false"
              /><small>也会遵循 CODEX_HOME 环境变量。</small></label
            >
          </div>
        </details>
        {#if scanned}
          {#if discovered.length}<div class="discovered-list">
              {#each discovered as candidate (candidate.id)}<div
                  class="discovered-item"
                >
                  <div>
                    <div class="title-row">
                      <strong>{candidate.name}</strong><span
                        class="badge"
                        class:green={candidate.status === 'ready'}
                        >{statusNames[candidate.status]}</span
                      >
                    </div>
                    <p class="muted break-word">{candidate.source}</p>
                    <p>{candidate.message}</p>
                    {#if candidate.model}<small
                        >{protocolNames[candidate.protocol]} · {candidate.model}</small
                      >{/if}
                  </div>
                  <button
                    class="secondary compact"
                    disabled={busy || candidate.status !== 'ready'}
                    onclick={() =>
                      perform(async () => {
                        await invoke('import_provider', {
                          candidateId: candidate.id,
                        });
                        discovered = discovered.filter(
                          (entry) => entry.id !== candidate.id,
                        );
                      }, '配置已导入并启用。')}>导入并启用</button
                  >
                </div>{/each}
            </div>{:else}<p class="empty-inline">
              没有发现可导入的配置。可以指定目录后重试，或手动添加模型服务。
            </p>{/if}
        {/if}
        <p class="tip">
          仅支持 API 凭据。Claude / ChatGPT 订阅的 OAuth 登录不等同于 API 授权。
        </p>
      </section>

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>
              模型服务 <span class="inline-count"
                >{snapshot?.providers.length ?? 0}</span
              >
            </h2>
            <p>启用的服务会出现在已配对网站的模型列表中。</p>
          </div>
          <button
            class="primary"
            disabled={busy || !desktop}
            onclick={() => editProvider()}>＋ 添加服务</button
          >
        </div>
        {#if snapshot?.providers.length}
          <div class="provider-list">
            {#each snapshot.providers as provider (provider.id)}<article
                class="provider-card"
              >
                <div class="provider-heading">
                  <div class="provider-symbol" aria-hidden="true">
                    {provider.protocol === 'anthropic' ? 'A' : 'O'}
                  </div>
                  <div class="provider-title">
                    <h3>{provider.name}</h3>
                    <span class="muted">{protocolNames[provider.protocol]}</span
                    >
                  </div>
                  <label class="switch"
                    ><input
                      type="checkbox"
                      checked={provider.enabled}
                      disabled={busy}
                      onchange={() =>
                        perform(() =>
                          invoke('save_provider', {
                            input: { ...provider, enabled: !provider.enabled },
                          }),
                        )}
                      aria-label={`${provider.enabled ? '停用' : '启用'} ${provider.name}`}
                    /><span>{provider.enabled ? '已启用' : '已停用'}</span
                    ></label
                  >
                </div>
                <dl class="provider-details">
                  <dt>模型</dt>
                  <dd>{provider.model}</dd>
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
                    disabled={busy}
                    onclick={() =>
                      perform(
                        () => invoke('test_provider', { id: provider.id }),
                        `${provider.name} 测试成功。`,
                      )}>测试连接</button
                  ><button
                    class="text-button"
                    disabled={busy}
                    onclick={() => editProvider(provider)}>编辑</button
                  ><button
                    class="text-button danger-text"
                    disabled={busy}
                    onclick={() => (deleteTarget = provider)}>删除</button
                  >
                </div>
              </article>{/each}
          </div>
        {:else}<div class="empty-state">
            <span class="empty-symbol" aria-hidden="true">▦</span><strong
              >添加你的第一个模型服务</strong
            >
            <p>扫描本机配置或手动填写 API 地址、模型和凭据。</p>
          </div>{/if}
        <p class="tip">“测试连接”会发送最小模型请求，可能产生少量 API 费用。</p>
      </section>
    {:else}
      <section class="card logs-card">
        <div class="section-heading">
          <div>
            <h2>运行日志</h2>
            <p>显示连接、请求状态和耗时，便于定位问题。</p>
          </div>
          <div class="button-row">
            <button
              class="secondary compact"
              disabled={busy || !desktop}
              onclick={exportLogs}>导出日志</button
            ><button
              class="text-button"
              disabled={busy || !snapshot?.logs.length}
              onclick={() => perform(() => invoke('clear_logs'))}>清空</button
            >
          </div>
        </div>
        <div class="log-filters">
          <label class="visually-hidden" for="log-search">搜索日志</label><input
            id="log-search"
            type="search"
            bind:value={logSearch}
            placeholder="搜索消息、请求 ID 或模型…"
          /><label class="visually-hidden" for="log-level">日志级别</label
          ><select id="log-level" bind:value={logLevel}
            ><option value="all">全部级别</option><option value="info"
              >信息</option
            ><option value="warn">警告</option><option value="error"
              >错误</option
            ></select
          >
        </div>
        <div class="log-entries" aria-label="运行日志">
          {#each filteredLogs as entry}<article class="log-entry">
              <time datetime={new Date(entry.timestamp).toISOString()}
                >{formatTime(entry.timestamp)}</time
              ><span
                class="log-level"
                class:log-error={entry.level === 'error'}
                class:log-warn={entry.level === 'warn'}
                >{entry.level.toUpperCase()}</span
              >
              <div>
                <p>{entry.message}</p>
                {#if entry.requestId || entry.model || entry.durationMs !== undefined}<small
                    >{entry.requestId
                      ? `请求 ${entry.requestId}`
                      : ''}{entry.model
                      ? ` · ${entry.model}`
                      : ''}{entry.durationMs !== undefined
                      ? ` · ${entry.durationMs} ms`
                      : ''}</small
                  >{/if}
              </div>
            </article>{:else}<div class="empty-state">
              <span class="empty-symbol" aria-hidden="true">≡</span><strong
                >暂无符合条件的日志</strong
              >
              <p>启动服务后，连接和请求状态会出现在这里。</p>
            </div>{/each}
        </div>
      </section>
    {/if}
    <footer>
      本机凭据 · 显式配对 · 随时撤销<span>关闭窗口后仍可从系统托盘打开</span>
    </footer>
  </main>
</div>

{#if editorOpen}
  <div class="modal-backdrop" role="presentation">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-title"
      tabindex="-1"
      use:focusModal
    >
      <form onsubmit={saveProvider}>
        <div class="section-heading">
          <div>
            <h2 id="provider-title">
              {draft.id ? '编辑模型服务' : '添加模型服务'}
            </h2>
            <p>凭据仅用于本机向指定 API 发起请求。</p>
          </div>
          <button
            type="button"
            class="icon-button"
            aria-label="关闭编辑"
            disabled={busy}
            onclick={closeEditor}>×</button
          >
        </div>
        {#if error}<div class="banner danger" role="alert">{error}</div>{/if}
        <label
          >服务名称<input
            bind:value={draft.name}
            required
            maxlength="100"
            placeholder="例如：我的 Claude API"
          /></label
        >
        <div class="two-column form-columns">
          <label
            >接口协议<select bind:value={draft.protocol}
              ><option value="anthropic">Anthropic Messages</option><option
                value="responses">OpenAI Responses</option
              ><option value="chatCompletions">OpenAI Chat Completions</option
              ></select
            ></label
          ><label
            >认证方式<select bind:value={draft.authKind}
              ><option value="apiKey">API key</option><option value="bearer"
                >Bearer token</option
              ><option value="none">无需凭据 / 清除已有凭据</option></select
            ></label
          >
        </div>
        <label
          >API 基础地址<input
            type="url"
            bind:value={draft.baseUrl}
            required
            placeholder="https://api.example.com/v1"
            spellcheck="false"
          /><small
            >填写协议对应的基础地址，不填写 /messages 或 /responses。</small
          ></label
        >
        <label
          >模型标识<input
            bind:value={draft.model}
            required
            maxlength="200"
            placeholder="服务商提供的完整模型名称"
            spellcheck="false"
          /></label
        >
        {#if draft.authKind !== 'none'}<label
            >{draft.authKind === 'bearer' ? 'Bearer token' : 'API key'}<input
              type="password"
              bind:value={draft.apiKey}
              autocomplete="new-password"
              placeholder={draft.id
                ? '留空以保留已有凭据'
                : '输入此服务的 API 凭据'}
              spellcheck="false"
            /><small
              >{draft.id
                ? '已有密钥不会显示。提交后会清空本次输入。'
                : '不会传给网站，也不会出现在日志中。'}</small
            ></label
          >{/if}
        <label class="checkbox-label"
          ><input type="checkbox" bind:checked={draft.enabled} /> 启用此模型服务</label
        >
        <div class="modal-actions">
          <button
            type="button"
            class="secondary"
            disabled={busy}
            onclick={closeEditor}>取消</button
          ><button class="primary" type="submit" disabled={busy}
            >{busy ? '保存中…' : '保存服务'}</button
          >
        </div>
      </form>
    </div>
  </div>
{/if}

{#if deleteTarget}
  <div class="modal-backdrop" role="presentation">
    <div
      class="modal small-modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      tabindex="-1"
      use:focusModal
    >
      <h2 id="delete-title">删除模型服务？</h2>
      <p>将删除「{deleteTarget.name}」及其保存的凭据。需要时可重新添加。</p>
      {#if error}<div class="banner danger" role="alert">{error}</div>{/if}
      <div class="modal-actions">
        <button
          class="secondary"
          disabled={busy}
          onclick={() => (deleteTarget = null)}>取消</button
        ><button
          class="primary destructive"
          disabled={busy}
          onclick={() =>
            perform(async () => {
              await invoke('remove_provider', { id: deleteTarget!.id });
              deleteTarget = null;
            }, '模型服务已删除。')}>删除服务</button
        >
      </div>
    </div>
  </div>
{/if}
