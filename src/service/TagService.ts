import Cacheable from "@/decorator/Cacheable";
import Cache from '@/decorator/Cache';
import api from "@/api";
import TagSumItem from "@/dto/tag/TagSumItem";
const cache = Cache();

class TagService implements Cacheable{
  private static instance: TagService
  private tagSumList: TagSumItem[] = [];
  private tagList: [string, string[]][] = [];
  private constructor(){
    this.init();
  }

  private async init(){
    this.tagList = await api.getTagMapping();
    this.tagSumList = this.tagList
                    .map(v => {return {tag: v[0], count: v[1].length}});
  }

  name(): string {
    return 'tag-service'
  }

  public static getInstance(): TagService {
    if (!this.instance) {
      this.instance = new TagService();
    }
    return this.instance;
  }

  /**
   * 获取全部概览标签列表
   *
   * @return {*}  {string[]}
   * @memberof TagService
   */
  @cache
  public getTagSumList(): TagSumItem[] {
    return JSON.parse(JSON.stringify(this.tagSumList));
  }

  @cache
  public getListByTag(tag: string): string[] {
    return this.tagList
            .filter(v => v[0] == tag)
            .map(v => v[1])
            .flatMap(v => v)
  }

}

export default TagService.getInstance()
