
import BadgeService from '../build/BadgeService'
import fs from 'fs'


async function main(){
  fs.writeFileSync('dist/wordCountBadge.svg', await BadgeService.generate("字数", "1,059,115"))
}

main()
