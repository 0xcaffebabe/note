<script lang="ts">
  import type { DesktopController } from '../application/DesktopController.svelte';

  let {
    desktop,
    search = $bindable(''),
    level = $bindable('all'),
  }: {
    desktop: DesktopController;
    search?: string;
    level?: string;
  } = $props();

  const filteredLogs = $derived(
    (desktop.snapshot?.logs ?? [])
      .filter(
        (entry) =>
          (level === 'all' || entry.level === level) &&
          `${entry.message} ${entry.requestId ?? ''} ${entry.providerId ?? ''} ${entry.model ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
      .slice()
      .reverse(),
  );

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false });
  }
</script>

<section class="card logs-card">
  <div class="section-heading">
    <div>
      <h2>运行日志</h2>
      <p>显示连接、请求状态和耗时，便于定位问题。</p>
    </div>
    <div class="button-row">
      <button
        class="secondary compact"
        disabled={desktop.busy || !desktop.available}
        onclick={() => desktop.exportLogs()}
      >
        导出日志
      </button>
      <button
        class="text-button"
        disabled={desktop.busy || !desktop.snapshot?.logs.length}
        onclick={() => desktop.clearLogs()}
      >
        清空
      </button>
    </div>
  </div>
  <div class="log-filters">
    <label class="visually-hidden" for="log-search">搜索日志</label>
    <input
      id="log-search"
      type="search"
      bind:value={search}
      placeholder="搜索消息、请求 ID 或模型…"
    />
    <label class="visually-hidden" for="log-level">日志级别</label>
    <select id="log-level" bind:value={level}>
      <option value="all">全部级别</option>
      <option value="info">信息</option>
      <option value="warn">警告</option>
      <option value="error">错误</option>
    </select>
  </div>
  <div class="log-entries" aria-label="运行日志">
    {#each filteredLogs as entry}
      <article class="log-entry">
        <time datetime={new Date(entry.timestamp).toISOString()}>
          {formatTime(entry.timestamp)}
        </time>
        <span
          class="log-level"
          class:log-error={entry.level === 'error'}
          class:log-warn={entry.level === 'warn'}
        >
          {entry.level.toUpperCase()}
        </span>
        <div>
          <p>{entry.message}</p>
          {#if entry.requestId || entry.model || entry.durationMs !== undefined}
            <small>
              {entry.requestId ? `请求 ${entry.requestId}` : ''}{entry.model
                ? ` · ${entry.model}`
                : ''}{entry.durationMs !== undefined
                ? ` · ${entry.durationMs} ms`
                : ''}
            </small>
          {/if}
        </div>
      </article>
    {:else}
      <div class="empty-state">
        <span class="empty-symbol" aria-hidden="true">≡</span>
        <strong>暂无符合条件的日志</strong>
        <p>启动服务后，连接和请求状态会出现在这里。</p>
      </div>
    {/each}
  </div>
</section>
