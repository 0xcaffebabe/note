<script lang="ts">
  import { onMount } from 'svelte';
  import { TauriDesktopBridge } from './adapters/TauriDesktopBridge';
  import { DesktopController } from './application/DesktopController.svelte';
  import { ProviderCatalogController } from './application/ProviderCatalogController.svelte';
  import { ProviderEditorState } from './application/ProviderEditorState.svelte';
  import DesktopSidebar from './components/DesktopSidebar.svelte';
  import ProviderEditor from './components/ProviderEditor.svelte';
  import DeleteProviderDialog from './components/DeleteProviderDialog.svelte';
  import ConnectionView from './views/ConnectionView.svelte';
  import ProvidersView from './views/ProvidersView.svelte';
  import LogsView from './views/LogsView.svelte';
  import {
    desktopPages,
    type DesktopTab,
  } from './presentation/DesktopNavigation';

  const desktop = new DesktopController(new TauriDesktopBridge());
  const catalog = new ProviderCatalogController(desktop);
  const editor = new ProviderEditorState(desktop);
  let tab = $state<DesktopTab>('connection');
  let logSearch = $state('');
  let logLevel = $state('all');
  const page = $derived(desktopPages[tab]);

  onMount(() => desktop.start());
</script>

<svelte:head>
  <title>note-bridge · 本地模型桥接</title>
</svelte:head>

<div class="app-shell">
  <DesktopSidebar snapshot={desktop.snapshot} bind:tab />
  <main>
    <header class="page-header">
      <div>
        <p class="eyebrow">LOCAL FIRST · LOCAL CONTROL</p>
        <h1>{page.title}</h1>
        <p class="subtitle">{page.subtitle}</p>
      </div>
      <span class="badge local-badge">仅本机访问</span>
    </header>

    {#if !desktop.available}
      <div class="banner warning" role="status">
        <strong>请在 note-bridge 桌面应用中打开。</strong>
        浏览器预览无法访问本机配置或启动桥接。
      </div>
    {/if}
    {#if desktop.error}
      <div class="banner danger" role="alert">
        <span>{desktop.error}</span>
        <button aria-label="关闭错误提示" onclick={() => (desktop.error = '')}>
          ×
        </button>
      </div>
    {/if}
    {#if desktop.notice}
      <div class="banner success" role="status">
        <span>{desktop.notice}</span>
        <button aria-label="关闭提示" onclick={() => (desktop.notice = '')}>
          ×
        </button>
      </div>
    {/if}

    {#if tab === 'connection'}
      <ConnectionView {desktop} />
    {:else if tab === 'providers'}
      <ProvidersView {desktop} {catalog} {editor} />
    {:else}
      <LogsView {desktop} bind:search={logSearch} bind:level={logLevel} />
    {/if}

    <footer>
      本机凭据 · 显式配对 · 随时撤销
      <span>关闭窗口后仍可从系统托盘打开</span>
    </footer>
  </main>
</div>

{#if editor.opened}
  <ProviderEditor {desktop} {editor} />
{/if}
{#if catalog.deleteTarget}
  <DeleteProviderDialog {desktop} {catalog} />
{/if}
