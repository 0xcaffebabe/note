<script lang="ts">
  import type { DesktopController } from '../application/DesktopController.svelte';
  import type { ProviderCatalogController } from '../application/ProviderCatalogController.svelte';
  import { focusModal } from '../actions/focusModal';

  let {
    desktop,
    catalog,
  }: { desktop: DesktopController; catalog: ProviderCatalogController } =
    $props();
</script>

<div class="modal-backdrop" role="presentation">
  <div
    class="modal small-modal"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="delete-title"
    tabindex="-1"
    use:focusModal={{
      canClose: () => !desktop.busy,
      close: () => (catalog.deleteTarget = null),
    }}
  >
    <h2 id="delete-title">删除模型服务？</h2>
    <p>
      将删除「{catalog.deleteTarget?.name}」及其保存的凭据。需要时可重新添加。
    </p>
    {#if desktop.error}
      <div class="banner danger" role="alert">
        {desktop.error}
      </div>
    {/if}
    <div class="modal-actions">
      <button
        class="secondary"
        disabled={desktop.busy}
        onclick={() => (catalog.deleteTarget = null)}
      >
        取消
      </button>
      <button
        class="primary destructive"
        disabled={desktop.busy}
        onclick={() => catalog.removeProvider()}
      >
        删除服务
      </button>
    </div>
  </div>
</div>
