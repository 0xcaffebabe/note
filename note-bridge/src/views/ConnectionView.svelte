<script lang="ts">
  import type { DesktopController } from '../application/DesktopController.svelte';

  let { desktop }: { desktop: DesktopController } = $props();
</script>

<section class="service-card card">
  <div class="section-heading">
    <div class="heading-icon" aria-hidden="true">↔</div>
    <div>
      <h2>本地桥接服务</h2>
      <p>仅监听 127.0.0.1，允许的网站需要单独配对。</p>
    </div>
    <span class="badge" class:green={desktop.snapshot?.running}>
      {desktop.snapshot?.running ? '运行中' : '未启动'}
    </span>
  </div>
  <div class="service-summary">
    <div>
      <span class="label">桥接地址</span>
      <code>
        ws://127.0.0.1:{desktop.snapshot?.running
          ? desktop.snapshot.port
          : desktop.port}/ws
      </code>
    </div>
    <div>
      <span class="label">可用模型服务</span>
      <strong>
        {desktop.enabledProviderCount}
        <span class="summary-unit">个</span>
      </strong>
    </div>
    <button
      class="primary"
      class:stop={desktop.snapshot?.running}
      disabled={desktop.busy || !desktop.available || !desktop.snapshot}
      onclick={() => desktop.toggleServer()}
    >
      {desktop.snapshot?.running ? '停止服务' : '启动服务'}
      <span aria-hidden="true">{desktop.snapshot?.running ? '■' : '→'}</span>
    </button>
  </div>
  <details class="connection-settings">
    <summary>监听端口与允许的网站</summary>
    <div class="settings-grid">
      <label>
        端口
        <input
          type="number"
          bind:value={desktop.port}
          min="1024"
          max="65535"
          required
          disabled={desktop.snapshot?.running || desktop.busy}
        />
        <small>默认 19661。停止服务后可修改。</small>
      </label>
      <label>
        允许的 Origin（每行一个）
        <textarea
          rows="3"
          bind:value={desktop.origins}
          disabled={desktop.snapshot?.running || desktop.busy}
          placeholder="https://your-note-site.example"
          spellcheck="false"
        ></textarea>
        <small>完整填写协议、主机和端口，不含路径。禁止通配符。</small>
      </label>
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
    {#if desktop.snapshot?.pairing && desktop.pairingSecondsRemaining > 0}
      <div
        class="pairing-code"
        aria-label={`配对码 ${desktop.snapshot.pairing.code}`}
      >
        {desktop.snapshot.pairing.code}
      </div>
      <p class="pairing-expiry">
        {desktop.pairingSecondsRemaining} 秒后失效 · 仅用于本次配对
      </p>
      <button
        class="secondary full-width"
        disabled={desktop.busy}
        onclick={() => desktop.openPairing()}
      >
        生成新的配对码
      </button>
    {:else}
      <div class="pairing-placeholder" aria-hidden="true">− − − − − −</div>
      <p class="pairing-expiry">启动服务后，生成一次性配对码</p>
      <button
        class="secondary full-width"
        disabled={desktop.busy || !desktop.snapshot?.running}
        onclick={() => desktop.openPairing()}
      >
        生成配对码
      </button>
    {/if}
    <p class="tip">配对后会记住授权，网站刷新可自动重连。</p>
  </div>
</section>

<section class="card">
  <div class="section-heading">
    <div>
      <h2>
        已授权的网站 <span class="inline-count">
          {desktop.snapshot?.authorizations.length ?? 0}
        </span>
      </h2>
      <p>离线网站也会保留。撤销授权会终止使用该授权的所有连接和请求。</p>
    </div>
  </div>
  {#if desktop.snapshot?.authorizations.length}
    <ul class="plain-list">
      {#each desktop.snapshot.authorizations as authorization (authorization.id)}
        <li class="connection-item">
          <span class="site-icon" aria-hidden="true">↗</span>
          <div>
            <strong>{authorization.origin}</strong>
            <small>
              授权于 {new Date(authorization.createdAt).toLocaleString('zh-CN')}
            </small>
            <small>
              最近连接 {new Date(authorization.lastConnectedAt).toLocaleString(
                'zh-CN',
              )}
            </small>
          </div>
          <span class="badge" class:green={authorization.connected}>
            {authorization.connected ? '已连接' : '离线'}
          </span>
          <button
            class="text-button danger-text"
            disabled={desktop.busy}
            onclick={() => desktop.revokeAuthorization(authorization.id)}
          >
            撤销授权
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="empty-inline">
      还没有授权的网站。在网站输入配对码即可开始文档问答。
    </div>
  {/if}
</section>
