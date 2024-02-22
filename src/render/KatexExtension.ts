import katex, {type KatexOptions} from 'katex'
import 'katex/dist/katex.css'
import { MarkedExtension, TokenizerAndRendererExtension } from 'marked'

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
            return `<span class="inline_tex tex" raw="${token.text}"></span>`
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
                console.log(match[0])
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
            console.log(token.text)
            return `<div class="line_tex tex" raw="${token.text}"></div>`
        }
    }
}
