
class ConfigService {

  private static STORAGE_KEY: string = 'config-service::'

  public static get(key: string): any {
    const map = ConfigService.getConfigMap()
    return map.get(key)
  }

  public static set(key: string, val: any) {
    const map = ConfigService.getConfigMap()
    map.set(key, val)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(map)))
  }

  private static getConfigMap(): Map<string, any> {
    const raw = localStorage.getItem(this.STORAGE_KEY)
    if (!raw) {
      return new Map()
    }
    return new Map(Array.from(JSON.parse(raw)))
  }
}

export default ConfigService