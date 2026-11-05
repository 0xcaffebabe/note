<script lang="ts">
  import type { ProviderEditorState } from '../application/ProviderEditorState.svelte';
  import {
    defaultOutputTokens,
    modelBudgetError,
  } from '../core/domain/ProviderDraft';
  import { effortNames, explicitEfforts } from '../presentation/ProviderLabels';

  let { editor, busy }: { editor: ProviderEditorState; busy: boolean } =
    $props();
</script>

<section class="model-editor" aria-labelledby="model-list-heading">
  <div class="section-heading">
    <div>
      <h3 id="model-list-heading">模型列表</h3>
      <p>支持自定义 ID 与显示名称，保存后同步到网站。</p>
    </div>
    <button
      type="button"
      class="secondary compact"
      disabled={busy || editor.models.length >= 200}
      onclick={() => editor.addModel()}
    >
      手动添加模型
    </button>
  </div>
  <button
    type="button"
    class="secondary compact"
    disabled={busy || !editor.canFetchModels}
    onclick={() => editor.fetchModels()}
  >
    {editor.fetchingModels ? '正在获取…' : '从 API 获取模型'}
  </button>
  <p class="tip">
    {editor.canFetchModels
      ? '查询当前服务的模型列表，不生成回答。接口不可用时仍可手动添加。'
      : '先保存 API 地址、协议与凭据，再获取该服务的模型列表。'}
  </p>
  {#if editor.validFetched}
    <div class="model-fetch-results">
      <label>
        筛选模型
        <input
          type="search"
          bind:value={editor.modelSearch}
          placeholder="搜索名称或 ID"
        />
      </label>
      <div class="model-candidates" aria-label="可添加的模型">
        {#each editor.filteredModels as model (model.id)}
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:group={editor.selectedModels}
              value={model.id}
              disabled={busy ||
                editor.models.some((item) => item.id === model.id)}
            />
            <span>
              {model.name}
              <small>
                {model.id}{editor.models.some((item) => item.id === model.id)
                  ? ' · 已添加'
                  : ''}
              </small>
            </span>
          </label>
        {:else}
          <p class="tip">
            {editor.fetchedModels.length
              ? '没有匹配的模型'
              : '服务未返回模型，可手动添加'}
          </p>
        {/each}
      </div>
      <button
        type="button"
        class="secondary compact"
        disabled={busy || !editor.selectedModels.length}
        onclick={() => editor.addSelectedModels()}
      >
        添加所选模型{editor.selectedModels.length
          ? ` (${editor.selectedModels.length})`
          : ''}
      </button>
    </div>
  {/if}
  <div class="model-rows">
    {#each editor.models as model, index}
      <fieldset class="model-row" disabled={busy}>
        <legend>
          模型 {index + 1}{editor.draft.model === model.id ? ' · 默认' : ''}
        </legend>
        <div class="two-column form-columns">
          <label>
            模型 ID
            <input
              aria-label={`模型 ${index + 1} ID`}
              value={model.id}
              oninput={(event) =>
                editor.updateModelId(index, event.currentTarget.value)}
              required
              maxlength="256"
              spellcheck="false"
            />
          </label>
          <label>
            显示名称
            <input
              aria-label={`模型 ${index + 1} 显示名称`}
              bind:value={model.name}
              maxlength="120"
              placeholder="留空使用模型 ID"
            />
          </label>
        </div>
        <div class="two-column form-columns">
          <label>
            上下文预算（tokens）
            <input
              aria-label={`模型 ${index + 1} 上下文预算（tokens）`}
              type="number"
              bind:value={model.contextWindowTokens}
              min="16384"
              max="2000000"
              step="1"
              placeholder="1000000"
            />
          </label>
          <label>
            输出预算（tokens）
            <input
              aria-label={`模型 ${index + 1} 输出预算（tokens）`}
              type="number"
              bind:value={model.maxOutputTokens}
              min="256"
              max="65536"
              step="1"
              placeholder={String(defaultOutputTokens(model))}
            />
          </label>
        </div>
        <p class="tip model-budget-hint">
          按当前服务的模型能力配置。留空采用 1,000,000 tokens 上下文、16,384
          tokens 输出；较小上下文的默认输出不超过其一半。
        </p>
        {#if modelBudgetError(model)}
          <p class="tip danger-text" role="alert">
            {modelBudgetError(model)}
          </p>
        {/if}
        <details class="model-efforts">
          <summary>
            支持的思考强度 · {model.efforts
              .map((effort) => effortNames[effort])
              .join(' / ')}
          </summary>
          <p class="tip">按当前服务的实际能力配置；未声明时只使用默认强度。</p>
          <div class="effort-options">
            {#each explicitEfforts as effort}
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  aria-label={`模型 ${index + 1} ${effortNames[effort]}强度`}
                  checked={model.efforts.includes(effort)}
                  onchange={(event) =>
                    editor.toggleEffort(
                      index,
                      effort,
                      event.currentTarget.checked,
                    )}
                />
                {effortNames[effort]}
              </label>
            {/each}
          </div>
        </details>
        <div class="model-row-actions">
          <button
            type="button"
            class="text-button"
            disabled={!model.id.trim() || editor.draft.model === model.id}
            onclick={() => (editor.draft.model = model.id)}
          >
            设为默认
          </button>
          <button
            type="button"
            class="text-button danger-text"
            aria-label={`删除模型 ${index + 1}`}
            onclick={() => editor.removeModel(index)}
          >
            删除
          </button>
        </div>
      </fieldset>
    {:else}
      <p class="tip">默认模型会自动加入列表；也可添加更多模型。</p>
    {/each}
  </div>
</section>
