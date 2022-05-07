import axios from "axios"

class EnhancerService {
  private static instance: EnhancerService = new EnhancerService()

  private constructor(){}

  public static newInstance(){return EnhancerService.instance}

  public async openBook(bookName: string): Promise<boolean> {
    const data = (await axios.get(`http://127.0.0.1:12945/openPDF?name=${bookName}`)).data
    return data.success as boolean
  }
}

export default EnhancerService.newInstance()