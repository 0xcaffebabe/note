// 仅引入类型 katex运行时由DocPostRender按需动态加载
import {type KatexOptions} from 'katex'
import { MarkedExtension, TokenizerAndRendererExtension } from 'marked'

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export default function (options: KatexOptions = {}): MarkedExtension {
    return {
        extensions: [
            inlineKatex(options),
            blockKatex(options)
        ]
    }
}

function inlineKatex(options: KatexOptions): TokenizerAndRendererExtension {
    return {
        name: 'inlineKatex',
        level: 'inline',
        start(src: string) {
            return src.indexOf('$')
        },
        tokenizer(src: string, _tokens) {
            const match = src.match(/^\$+([^$\n]+?)\$+/)
            if (match) {
                return {
                    type: 'inlineKatex',
                    raw: match[0],
                    text: match[1].trim()
                }
            }
        },
        renderer(token) {
            return `<span class="inline_tex tex" raw="${escapeAttr(token.text)}"></span>`
        }
    }
}

function blockKatex(options: KatexOptions): TokenizerAndRendererExtension {
    return {
        name: 'blockKatex',
        level: 'block',
        start(src: string) {
            return src.indexOf('$$')
        },
        tokenizer(src: string, _tokens) {
            let match = src.match(/^\$\$+([^$]+?)\$\$/)
            if (match) {
                return {
                    type: 'blockKatex',
                    raw: match[0],
                    text: match[1].trim()
                }
            }
            match = src.match(/^\$\$+\n([^$]+?)\n\$\$/)
            if (match) {
                return {
                    type: 'blockKatex',
                    raw: match[0],
                    text: match[1].trim()
                }
            }
        },
        renderer(token) {
            return `<div class="line_tex tex" raw="${escapeAttr(token.text)}"></div>`
        }
    }
}
