import { http } from '@/util/http'

class EnhancerService {
  private static instance: EnhancerService = new EnhancerService()

  private constructor(){}

  public static newInstance(){return EnhancerService.instance}

  public async openBook(bookName: string): Promise<boolean> {
    const data = await http(`http://127.0.0.1:12945/openPDF?name=${bookName}`).then(r => r.json())
    return data.success as boolean
  }
}

export default EnhancerService.newInstance()