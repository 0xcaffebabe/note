import axios from "axios";

export default class BadgeService {

  public static async generate(name: string, value: string) :Promise<string> {
    try {
      return (await axios.get(`https://img.shields.io/badge/${encodeURI(name)}-${encodeURI(value)}-blue`)).data
    }catch(err) {
      console.error("徽章生成异常", err)
      return ''
    }
  }
}