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
        pairing: null,
        pendingPairings: [
          {
            id: 'pair-test',
            origin: 'https://notes.example.test',
            expiresAt: Date.now() + 60000,
          },
        ],
        connections: [],
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
          if (command === 'approve_pairing') state.pendingPairings = [];
          if (command === 'stop_bridge') state.running = false;
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

test('requires an explicit approval of the full website origin', async ({
  page,
}) => {
  await desktopFixture(page);
  await expect(
    page.getByRole('heading', { name: '连接你的知识与模型' }),
  ).toBeVisible();
  await expect(
    page.getByText('ws://127.0.0.1:19661/ws', { exact: true }),
  ).toBeVisible();
  const request = page.locator('.pending-item');
  await expect(
    request.getByText('https://notes.example.test', { exact: true }),
  ).toBeVisible();
  const calls = () =>
    page.evaluate(
      () => (window as unknown as { __testCalls: unknown[] }).__testCalls,
    );
  expect(await calls()).toEqual([]);
  await test.info().attach('note-bridge-connection', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await request.getByRole('button', { name: '批准', exact: true }).click();
  await expect.poll(calls).toContainEqual({
    command: 'approve_pairing',
    args: { id: 'pair-test', allow: true },
  });
  await expect(page.getByText('等待网站发起连接')).toBeVisible();
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
