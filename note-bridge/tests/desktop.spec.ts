import { expect, test, type Page } from '@playwright/test';

// Test-only IPC fixture. Production has no mock transport or sample providers.
async function desktopFixture(page: Page, failSave = false) {
  await page.addInitScript(
    ({ failSave }) => {
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
          if (command === 'save_provider' && failSave)
            throw new Error('系统凭据库暂时不可用');
          if (command === 'save_logs') return '/test/note-bridge-logs.txt';
          return null;
        },
      };
    },
    { failSave },
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
