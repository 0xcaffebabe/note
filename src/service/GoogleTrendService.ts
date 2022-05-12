import Cacheable from '@/decorator/Cacheable';
import Cache from '@/decorator/Cache'
import InterestOverTimeResult from '@/dto/google-trend/InterestOverTimeResult';
import axios from 'axios';
import InterestByRegionResult from '@/dto/google-trend/InterestByRegionResult';
import RelatedQueriesResult from '@/dto/google-trend/RelatedQueriesResult';
import RelatedTopicsResult from '@/dto/google-trend/RelatedTopicsResult';

const cache = Cache()
class GoogleTrendService implements Cacheable{

  private static instance: GoogleTrendService

  private constructor(){}

  name(): string {
    return 'google-trend-service'
  }

  public static newInstance(): GoogleTrendService {
    if (!this.instance) {
      this.instance = new GoogleTrendService()
    }
    return this.instance
  }

  @cache
  public async interestOverTime(kw: string): Promise<InterestOverTimeResult> {
    return (await axios.get(`https://google-trend.ismy.wang/interestOverTime?kw=${kw}`)).data
  }

  @cache
  public async interestByRegion(kw: string): Promise<InterestByRegionResult> {
    return (await axios.get(`https://google-trend.ismy.wang/interestByRegion?kw=${kw}`)).data
  }

  @cache
  public async relatedQueries(kw: string): Promise<RelatedQueriesResult> {
    return (await axios.get(`https://google-trend.ismy.wang/relatedQueries?kw=${kw}`)).data
  }

  @cache
  public async relatedTopics(kw: string): Promise<RelatedTopicsResult> {
    return (await axios.get(`https://google-trend.ismy.wang/relatedTopics?kw=${kw}`)).data
  }
}

export default GoogleTrendService.newInstance()
