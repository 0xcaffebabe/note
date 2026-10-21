import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const projectRoot = fileURLToPath(new URL('../../../../', import.meta.url))
// nodejieba 延迟加载原生模块；只 import/require 并不能检出 GLIBC 不兼容。
const probeScript = `const text = '南京市长江大桥';
const words = require('nodejieba').cut(text);
if (!Array.isArray(words) || words.join('') !== text || !words.includes('长江大桥')) {
  throw new Error('nodejieba dictionary smoke test failed');
}`

export function ensureJieba(platform = process.platform, run = spawnSync) {
  if (platform !== 'linux') return

  const probe = () => run(process.execPath, ['-e', probeScript], { cwd: projectRoot, encoding: 'utf8' })
  const initial = probe()
  if (initial.status === 0) return

  console.warn('[nodejieba] Linux 原生模块不可用，尝试从源码重新编译。')
  console.warn(initial.error?.message || initial.stderr)
  const npmCli = process.env.npm_execpath
  if (!npmCli) {
    throw new Error('请通过 npm run postinstall 运行原生模块检查。')
  }
  const rebuilt = run(process.execPath, [npmCli, 'rebuild', 'nodejieba'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, npm_config_build_from_source: 'true' },
  })
  if (rebuilt.status !== 0) {
    throw new Error('nodejieba 源码编译失败；Linux 构建需要 Python 3、make 和 C++ 编译器。', { cause: rebuilt.error })
  }
  const verified = probe()
  if (verified.status !== 0) {
    throw new Error('nodejieba 重新编译后仍无法分词。', { cause: verified.error || new Error(verified.stderr) })
  }
  console.log('[nodejieba] 本机源码编译及分词验证通过。')
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    ensureJieba()
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}
