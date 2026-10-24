import { expect, test, type Page } from '@playwright/test';

// Test-only IPC fixture. Production has no mock transport or sample providers.
async function desktopFixture(
  page: Page,
  failSave = false,
  failModelFetch = false,
) {
  await page.addInitScript(
    ({ failSave, failModelFetch }) => {
      const state = {
        running: true,
        port: 19661,
        allowedOrigins: ['https://notes.example.test'],
        providers: [
          {
            id: 'provider-test',
            name: '测试模型',
            protocol: 'anthropic',
            baseUrl: 'https://api.example.test/v1',
            model: 'fixture-model',
            authKind: 'apiKey',
            enabled: true,
          },
        ],
        pairing: null as { code: string; expiresAt: number } | null,
        authorizations: [
          {
            id: 'authorization-online',
            origin: 'https://notes.example.test',
            createdAt: Date.now() - 86400000,
            lastConnectedAt: Date.now(),
            connected: true,
          },
          {
            id: 'authorization-offline',
            origin: 'https://offline.example.test',
            createdAt: Date.now() - 86400000,
            lastConnectedAt: Date.now() - 3600000,
            connected: false,
          },
        ],
        connections: [
          {
            id: 'connection-test',
            origin: 'https://notes.example.test',
            connectedAt: Date.now(),
          },
        ],
        logs: [
          { timestamp: Date.now(), level: 'info', message: '本机服务已启动' },
        ],
      };
      const calls: { command: string; args: Record<string, unknown> }[] = [];
      const fixtureWindow = window as unknown as {
        __TAURI_INTERNALS__: unknown;
        __testCalls: typeof calls;
        isTauri: boolean;
      };
      fixtureWindow.isTauri = true;
      fixtureWindow.__testCalls = calls;
      fixtureWindow.__TAURI_INTERNALS__ = {
        invoke: async (command: string, args: Record<string, unknown> = {}) => {
          if (command === 'get_snapshot') return structuredClone(state);
          calls.push({ command, args });
          if (command === 'open_pairing') {
            state.pairing = { code: '123456', expiresAt: Date.now() + 120000 };
            return structuredClone(state.pairing);
          }
          if (command === 'stop_bridge') {
            state.running = false;
            state.connections = [];
            state.authorizations.forEach((authorization) => {
              authorization.connected = false;
            });
          }
          if (command === 'revoke_authorization') {
            state.authorizations = state.authorizations.filter(
              (authorization) => authorization.id !== args.id,
            );
          }
          if (command === 'fetch_provider_models') {
            if (failModelFetch)
              throw new Error('当前服务不支持模型列表接口，可手动添加模型');
            return [
              { id: 'fixture-model', name: 'Existing', efforts: ['default'] },
              {
                id: 'custom/deep-model',
                name: '自定义推理模型',
                efforts: ['default', 'high', 'xhigh'],
                contextWindowTokens: 1_000_000,
                maxOutputTokens: 32_768,
              },
              { id: 'embedding-model', name: '向量模型', efforts: ['default'] },
            ];
          }
          if (command === 'save_provider' && failSave)
            throw new Error('系统凭据库暂时不可用');
          if (command === 'save_logs') return '/test/note-bridge-logs.txt';
          return null;
        },
      };
    },
    { failSave, failModelFetch },
  );
  await page.goto('/');
}

test('generates a short-lived pairing code without a desktop approval step', async ({
  page,
}) => {
  await desktopFixture(page);
  await expect(
    page.getByRole('heading', { name: '连接你的知识与模型' }),
  ).toBeVisible();
  await expect(
    page.getByText('ws://127.0.0.1:19661/ws', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '批准', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '确认连接请求' })).toHaveCount(
    0,
  );
  const calls = () =>
    page.evaluate(
      () => (window as unknown as { __testCalls: unknown[] }).__testCalls,
    );
  expect(await calls()).toEqual([]);
  await page.getByRole('button', { name: '生成配对码', exact: true }).click();
  await expect.poll(calls).toEqual([{ command: 'open_pairing', args: {} }]);
  await expect(page.getByLabel('配对码 123456')).toBeVisible();
  await expect(page.getByText(/秒后失效 · 仅用于本次配对/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: '生成新的配对码' }),
  ).toBeVisible();
  await test.info().attach('note-bridge-connection', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

test('editing with a blank credential preserves the saved key', async ({
  page,
}) => {
  await desktopFixture(page);
  await page.getByRole('button', { name: '模型服务' }).click();
  await page.getByRole('button', { name: '编辑', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByPlaceholder('留空以保留已有凭据')).toHaveValue('');
  await test.info().attach('note-bridge-provider-editor', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await dialog.getByLabel('服务名称').fill('已编辑模型');
  await dialog.getByRole('button', { name: '保存服务' }).click();
  await expect(dialog).not.toBeVisible();
  const input = await page.evaluate(
    () =>
      (
        window as unknown as {
          __testCalls: {
            command: string;
            args: { input?: Record<string, unknown> };
          }[];
        }
      ).__testCalls.find((call) => call.command === 'save_provider')?.args
        .input,
  );
  expect(input?.name).toBe('已编辑模型');
  expect(input?.id).toBe('provider-test');
  expect(input?.apiKey).toBeUndefined();
});

test('failed saves clear a newly typed key and keep the error visible in the dialog', async ({
  page,
}) => {
  await desktopFixture(page, true);
  await page.getByRole('button', { name: '模型服务' }).click();
  await page.getByRole('button', { name: '编辑', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByPlaceholder('留空以保留已有凭据')
    .fill('test-only-never-a-real-key');
  await dialog.getByRole('button', { name: '保存服务' }).click();
  await expect(dialog.getByRole('alert')).toContainText('系统凭据库暂时不可用');
  await expect(dialog.getByPlaceholder('留空以保留已有凭据')).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('export shows the selected destination and logs remain filterable', async ({
  page,
}) => {
  await desktopFixture(page);
  await page.getByRole('button', { name: '运行日志' }).click();
  await page.getByRole('button', { name: '导出日志' }).click();
  await expect(page.getByRole('status')).toContainText(
    '/test/note-bridge-logs.txt',
  );
  await page.getByRole('searchbox').fill('不存在的日志');
  await expect(page.getByText('暂无符合条件的日志')).toBeVisible();
});

test('a normal browser preview cannot expose desktop controls', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText(
    '请在 note-bridge 桌面应用中打开',
  );
  await expect(page.getByRole('button', { name: '启动服务' })).toBeDisabled();
  await page.getByRole('button', { name: '模型服务' }).click();
  await expect(page.getByRole('button', { name: '添加服务' })).toBeDisabled();
});

test('remembered websites show online and offline states and can be revoked offline', async ({
  page,
}) => {
  await desktopFixture(page);
  const online = page.locator('.connection-item').filter({
    hasText: 'https://notes.example.test',
  });
  const offline = page.locator('.connection-item').filter({
    hasText: 'https://offline.example.test',
  });
  await expect(online.getByText('已连接', { exact: true })).toHaveClass(
    /green/,
  );
  await expect(offline.getByText('离线', { exact: true })).not.toHaveClass(
    /green/,
  );
  await expect(offline).toContainText('最近连接');
  await test.info().attach('note-bridge-remembered-websites', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await offline.getByRole('button', { name: '撤销授权' }).click();
  await expect(offline).toHaveCount(0);
  await expect(online).toBeVisible();
  await expect(page.getByRole('status')).toContainText('再次连接需要重新配对');
  expect(
    await page.evaluate(
      () => (window as unknown as { __testCalls: unknown[] }).__testCalls,
    ),
  ).toContainEqual({
    command: 'revoke_authorization',
    args: { id: 'authorization-offline' },
  });
});

test('stopping the service retains remembered websites and renders them offline', async ({
  page,
}) => {
  await desktopFixture(page);
  await page.getByRole('button', { name: '停止服务' }).click();
  await expect(page.getByRole('button', { name: '启动服务' })).toBeVisible();
  const websites = page.locator('.connection-item');
  await expect(websites).toHaveCount(2);
  await expect(websites.getByText('离线', { exact: true })).toHaveCount(2);
  await expect(websites.getByText('已连接', { exact: true })).toHaveCount(0);
});

test('model catalog can fetch selected custom models, keep overrides and save actual IDs', async ({
  page,
}) => {
  await desktopFixture(page);
  await page.getByRole('button', { name: '模型服务' }).click();
  await page.getByRole('button', { name: '编辑', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('模型 1 显示名称', { exact: true })
    .fill('我的默认模型');
  await dialog.getByLabel('模型 1 上下文预算（tokens）').fill('200000');
  await dialog.getByLabel('模型 1 输出预算（tokens）').fill('32768');
  await dialog.getByRole('button', { name: '从 API 获取模型' }).click();
  await dialog.getByRole('checkbox', { name: /自定义推理模型/ }).check();
  await dialog
    .getByRole('button', { name: '添加所选模型 (1)', exact: true })
    .click();
  await expect(dialog.getByLabel('模型 2 ID', { exact: true })).toHaveValue(
    'custom/deep-model',
  );
  await expect(dialog.getByLabel('模型 2 上下文预算（tokens）')).toHaveValue(
    '1000000',
  );
  await expect(dialog.getByLabel('模型 2 输出预算（tokens）')).toHaveValue(
    '32768',
  );
  await expect(
    dialog.getByLabel('模型 1 显示名称', { exact: true }),
  ).toHaveValue('我的默认模型');
  await dialog
    .getByRole('button', { name: '设为默认', exact: true })
    .nth(1)
    .click();
  await dialog.getByRole('button', { name: '手动添加模型' }).click();
  await dialog
    .getByLabel('模型 3 ID', { exact: true })
    .fill('gateway/private-model');
  await dialog.getByLabel('模型 3 显示名称', { exact: true }).fill('私有模型');
  await dialog
    .locator('.model-row')
    .nth(2)
    .getByText('支持的思考强度', { exact: false })
    .click();
  await dialog
    .getByRole('checkbox', { name: '模型 3 高强度', exact: true })
    .check();
  await dialog
    .getByLabel('API 基础地址')
    .fill('https://changed.example.test/v1');
  await expect(
    dialog.getByRole('button', { name: '从 API 获取模型' }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole('button', { name: /添加所选模型/ }),
  ).toHaveCount(0);
  await dialog.getByLabel('API 基础地址').fill('https://api.example.test/v1');
  await test.info().attach('note-bridge-multiple-models', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await dialog.getByRole('button', { name: '保存服务' }).click();
  await expect(dialog).not.toBeVisible();
  const input = await page.evaluate(
    () =>
      (
        window as unknown as {
          __testCalls: {
            command: string;
            args: { input?: Record<string, unknown> };
          }[];
        }
      ).__testCalls.find((call) => call.command === 'save_provider')?.args
        .input,
  );
  expect(input).toMatchObject({
    model: 'custom/deep-model',
    models: [
      {
        id: 'fixture-model',
        name: '我的默认模型',
        efforts: ['default', 'low', 'medium', 'high'],
        contextWindowTokens: 200_000,
        maxOutputTokens: 32_768,
      },
      {
        id: 'custom/deep-model',
        name: '自定义推理模型',
        efforts: ['default', 'high', 'xhigh'],
        contextWindowTokens: 1_000_000,
        maxOutputTokens: 32_768,
      },
      {
        id: 'gateway/private-model',
        name: '私有模型',
        efforts: ['default', 'high'],
      },
    ],
  });
  expect(JSON.stringify(input)).not.toContain('embedding-model');
});

test('model fetch failure preserves editable custom models', async ({
  page,
}) => {
  await desktopFixture(page, false, true);
  await page.getByRole('button', { name: '模型服务' }).click();
  await page.getByRole('button', { name: '编辑', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '从 API 获取模型' }).click();
  await expect(dialog.getByRole('alert')).toContainText('可手动添加模型');
  await expect(dialog.getByLabel('模型 1 ID', { exact: true })).toHaveValue(
    'fixture-model',
  );
  await dialog.getByRole('button', { name: '手动添加模型' }).click();
  await dialog.getByLabel('模型 2 ID', { exact: true }).fill('private-model');
  const renamed = 'private/' + 'x'.repeat(122);
  await dialog.getByLabel('模型 1 ID', { exact: true }).fill(renamed);
  await dialog.getByLabel('模型 1 显示名称', { exact: true }).fill('');
  await expect(dialog.getByLabel('默认模型标识')).toHaveValue(renamed);
  await dialog.getByRole('button', { name: '保存服务' }).click();
  await expect(dialog).not.toBeVisible();
  const input = await page.evaluate(
    () =>
      (
        window as unknown as {
          __testCalls: {
            command: string;
            args: { input?: Record<string, unknown> };
          }[];
        }
      ).__testCalls.find((call) => call.command === 'save_provider')?.args
        .input,
  );
  expect(input).toMatchObject({
    model: renamed,
    models: [
      { id: renamed, name: renamed.slice(0, 120) },
      { id: 'private-model' },
    ],
  });
  expect(JSON.stringify(input)).not.toContain('fixture-model');
});

test('model budgets validate small windows and cleared fields retain adaptive defaults', async ({
  page,
}) => {
  await desktopFixture(page);
  await page.getByRole('button', { name: '模型服务' }).click();
  await page.getByRole('button', { name: '编辑', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const context = dialog.getByLabel('模型 1 上下文预算（tokens）');
  const output = dialog.getByLabel('模型 1 输出预算（tokens）');
  await expect(context).toHaveAttribute('placeholder', '1000000');
  await expect(output).toHaveAttribute('placeholder', '16384');
  const screenshot = test.info().outputPath('model-context-budget.png');
  await dialog.locator('.model-row').first().screenshot({ path: screenshot });
  await test.info().attach('model-context-budget', { path: screenshot, contentType: 'image/png' });
  await context.fill('16384');
  await expect(output).toHaveAttribute('placeholder', '8192');
  await output.fill('16384');
  await expect(dialog.getByRole('alert')).toContainText(
    '不能超过上下文预算的一半',
  );
  await dialog.getByRole('button', { name: '保存服务' }).click();
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __testCalls: { command: string }[] }
      ).__testCalls.some((call) => call.command === 'save_provider'),
    ),
  ).toBe(false);
  await output.fill('');
  await dialog.getByRole('button', { name: '保存服务' }).click();
  await expect(dialog).not.toBeVisible();
  const models = await page.evaluate(
    () =>
      (
        window as unknown as {
          __testCalls: {
            command: string;
            args: { input?: { models: Record<string, unknown>[] } };
          }[];
        }
      ).__testCalls.find((call) => call.command === 'save_provider')?.args.input
        ?.models,
  );
  expect(models?.[0].contextWindowTokens).toBe(16_384);
  expect(models?.[0].maxOutputTokens ?? undefined).toBeUndefined();
});
