import Category from '@/dto/Category'
import { createStore } from 'vuex'

export default function create(){
  const store = createStore({
    state () {
      return {
        // 当前所在的章节目录
        currentCategory: new Category() as Category,
        // 当前所在的章节标题
        currentHeading: '' as string,
        currentSearchKw: '' as string
      }
    },
    mutations: {
      setCurrentCategory (state :any, category: Category) {
        state.currentCategory = category
      },
      setSearchKw(state: any, kw: string) {
        state.currentSearchKw = kw
      },
      setCurrentHeading(state: any, heading: string) {
        state.currentHeading = heading
      }
    }
  })
  return store
}