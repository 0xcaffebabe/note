// Run against `cargo run -p bridge-core --example browser_probe` only.
// An isolated browser visits the public site; every model request stays on loopback.
import { chromium } from '@playwright/test';

const code = process.argv[2];
if (!/^\d{6}$/.test(code || '')) {
  throw new Error('Pass the test fixture pairing code as the first argument');
}
const origin = 'https://note.ismy.wang';
const grant = process.argv.includes('--grant-local-network');
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  if (grant) {
    await context.grantPermissions(['local-network-access'], { origin });
  }
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /WebSocket|network|content security|mixed content/i.test(message.text())
    ) {
      errors.push(message.text().slice(0, 800));
    }
  });
  const response = await page.goto(origin, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  const result = await page.evaluate(async (pairingCode) => {
    return await new Promise((resolve) => {
      let socket;
      const events = [];
      let answer = '';
      const finish = (value) => {
        clearTimeout(timer);
        socket?.close();
        resolve({ ...value, events, answer });
      };
      const timer = setTimeout(
        () => finish({ ok: false, reason: 'timeout' }),
        20000,
      );
      try {
        socket = new WebSocket('ws://127.0.0.1:19661/ws');
      } catch (error) {
        finish({ ok: false, reason: String(error) });
        return;
      }
      socket.onopen = () =>
        socket.send(JSON.stringify({ v: 2, type: 'pair', code: pairingCode }));
      socket.onerror = () => finish({ ok: false, reason: 'websocket_error' });
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        events.push(message.type);
        if (message.type === 'auth.ok') {
          socket.send(
            JSON.stringify({
              v: 2,
              type: 'request',
              id: 'browser-probe',
              method: 'sessions.list',
              params: {},
            }),
          );
        } else if (
          message.type === 'response' &&
          message.id === 'browser-probe'
        ) {
          finish({ ok: !message.error, reason: message.error?.code });
        } else if (message.type === 'error') {
          finish({ ok: false, reason: message.code });
        }
      };
    });
  }, code);
  console.log(
    JSON.stringify(
      {
        browser: await browser.version(),
        origin: new URL(page.url()).origin,
        status: response?.status(),
        csp: response?.headers()['content-security-policy'] || null,
        permissionGranted: grant,
        ...result,
        errors,
      },
      null,
      2,
    ),
  );
  if (!result.ok) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
