
export default class BadgeService {

  public static async generate(name: string, value: string) :Promise<string> {
    try {
      return fetch(`https://img.shields.io/badge/${encodeURI(name)}-${encodeURI(value)}-blue`).then(r => r.text())
    }catch(err) {
      console.error("徽章生成异常", err)
      return ''
    }
  }
}