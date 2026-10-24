// Stage the fixed Node runtime for Tauri's sidecar bundler. No user-installed Node is needed at runtime.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = '26.12.1';
const target =
  process.env.TAURI_ENV_TARGET_TRIPLE ||
  process.env.CARGO_BUILD_TARGET ||
  {
    darwin: { arm64: 'aarch64-apple-darwin', x64: 'x86_64-apple-darwin' },
    win32: { x64: 'x86_64-pc-windows-msvc' },
    linux: {
      x64: 'x86_64-unknown-linux-gnu',
      arm64: 'aarch64-unknown-linux-gnu',
    },
  }[process.platform]?.[process.arch];
const platforms = {
  'aarch64-apple-darwin': ['darwin', 'arm64'],
  'x86_64-apple-darwin': ['darwin', 'x64'],
  'x86_64-pc-windows-msvc': ['win', 'x64'],
  'x86_64-unknown-linux-gnu': ['linux', 'x64'],
  'aarch64-unknown-linux-gnu': ['linux', 'arm64'],
};
if (!target || !platforms[target]) {
  throw new Error('Unsupported sidecar target');
}
const [platform, arch] = platforms[target];
const directory = `node-v${version}-${platform}-${arch}`;
const archiveName = `${directory}.${platform === 'win' ? 'zip' : 'tar.gz'}`;
const cache = join(tmpdir(), 'note-bridge-node', version);
await mkdir(cache, { recursive: true });
const archive = join(cache, archiveName);
/** 下载固定版本的发布资源；每次尝试有独立超时，失败时保留最后的异常。 */
const fetchRetry = async (url) => {
  let failure;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      return response;
    } catch (error) {
      failure = error;
    }
  }
  throw failure;
};
const checksums = await (
  await fetchRetry(`https://nodejs.org/dist/v${version}/SHASUMS256.txt`)
).text();
const expected = checksums
  .split('\n')
  .map((line) => line.trim().split(/\s+/))
  .find(([, name]) => name === archiveName)?.[0];
if (!expected || !/^[a-f0-9]{64}$/.test(expected)) {
  throw new Error('Node release checksum missing');
}
const hashFile = async (path) =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
if ((await hashFile(archive).catch(() => null)) !== expected) {
  await pipeline(
    Readable.fromWeb(
      (await fetchRetry(`https://nodejs.org/dist/v${version}/${archiveName}`))
        .body,
    ),
    createWriteStream(`${archive}.part`),
  );
  if ((await hashFile(`${archive}.part`)) !== expected) {
    throw new Error('Node archive checksum mismatch');
  }
  await copyFile(`${archive}.part`, archive);
  await rm(`${archive}.part`);
}
const extraction = join(cache, 'extract', target);
await mkdir(extraction, { recursive: true });
// Windows tar.exe reads zip; BSD/GNU tar reads the other platforms' gzip archives.
const extract = spawnSync('tar', ['-xf', archive, '-C', extraction], {
  stdio: 'inherit',
});
if (extract.status !== 0) {
  throw new Error('Node extraction failed');
}
const binary = join(
  extraction,
  directory,
  ...(platform === 'win' ? ['node.exe'] : ['bin', 'node']),
);
const destination = join(
  root,
  'src-tauri',
  'binaries',
  `note-agent-node-${target}${platform === 'win' ? '.exe' : ''}`,
);
await mkdir(dirname(destination), { recursive: true });
await copyFile(binary, destination);
if (platform !== 'win') {
  await chmod(destination, 0o755);
}
await writeFile(
  join(root, 'agent', 'dist', 'runtime-build.json'),
  JSON.stringify({ nodeVersion: version, target, archiveSha256: expected }) +
    '\n',
);
console.log(`Staged Node ${version} for ${target}`);
