<script lang="ts">
  import type { Snapshot } from '../core/domain/BridgeSnapshot';
  import type { DesktopTab } from '../presentation/DesktopNavigation';

  let {
    snapshot,
    tab = $bindable(),
  }: {
    snapshot: Snapshot | null;
    tab: DesktopTab;
  } = $props();
</script>

<aside class="sidebar">
  <a
    class="brand"
    href="#connection"
    onclick={() => (tab = 'connection')}
    aria-label="note-bridge 首页"
  >
    <span class="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M5 18V6h3l8 12h3V6M8 6v12M16 6v12" />
      </svg>
    </span>
    <!-- prettier-ignore -->
    <span>note<span class="brand-light">-bridge</span><small>你的本地模型入口</small></span>
  </a>
  <nav aria-label="主导航">
    <button
      class:active={tab === 'connection'}
      onclick={() => (tab = 'connection')}
    >
      <span aria-hidden="true">◈</span>
      连接与配对
      <span class="nav-count">{snapshot?.authorizations.length ?? 0}</span>
    </button>
    <button
      class:active={tab === 'providers'}
      onclick={() => (tab = 'providers')}
    >
      <span aria-hidden="true">▦</span>
      模型服务
      <span class="nav-count">{snapshot?.providers.length ?? 0}</span>
    </button>
    <button class:active={tab === 'logs'} onclick={() => (tab = 'logs')}>
      <span aria-hidden="true">≡</span>
      运行日志
    </button>
  </nav>
  <div class="sidebar-bottom">
    <div class="local-note">
      <span class="status-dot" class:running={snapshot?.running}></span>
      <strong>{snapshot?.running ? '桥接服务运行中' : '桥接服务已停止'}</strong>
    </div>
    <p>
      凭据保存在本机。
      <br />
      网站通过配对调用模型。
    </p>
    <span class="version">note-bridge 0.2.0</span>
  </div>
</aside>
