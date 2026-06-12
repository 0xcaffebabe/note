// 运行: npx tsx src/test/UrlUtils.test.ts
import UrlUtils from "../util/UrlUtils";

console.log(UrlUtils.concatUrl('abcc/', '/fds', 'dsadas', 'dsadas'))

// Latin-1双重编码修复: '软件工程'的UTF-8字节被按Latin-1误读后的形态
const mojibake = Buffer.from('/软件工程/架构', 'utf8').toString('latin1')
const checks: [string, boolean][] = [
  ['乱码路径还原', UrlUtils.repairLatin1Mojibake(mojibake) == '/软件工程/架构'],
  ['正常中文不误伤', UrlUtils.repairLatin1Mojibake('/软件工程/架构') == null],
  ['纯ASCII不误伤', UrlUtils.repairLatin1Mojibake('/home.html') == null],
  ['真Latin-1文本不误伤', UrlUtils.repairLatin1Mojibake('café') == null],
  ['空串不误伤', UrlUtils.repairLatin1Mojibake('') == null],
]
let failed = false
for (const [name, pass] of checks) {
  console.log(name, pass ? 'PASS' : 'FAIL')
  failed ||= !pass
}
process.exit(failed ? 1 : 0)
