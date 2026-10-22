import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

export default function AssetRecovery(): Plugin {
  return {
    name: 'asset-recovery',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [{
          tag: 'script',
          attrs: { id: 'asset-recovery' },
          children: readFileSync(new URL('../../web/assetRecovery.js', import.meta.url), 'utf8'),
          injectTo: 'head-prepend',
        }]
      },
    },
  }
}
