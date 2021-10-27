import Category from '@/dto/Category'
import { createStore } from 'vuex'

export default function create(){
  const store = createStore({
    state () {
      return {
        currentCategory: new Category() as Category,
        currentSearchKw: '' as string
      }
    },
    mutations: {
      setCurrentCategory (state :any, category: Category) {
        state.currentCategory = category
      },
      setSearchKw(state: any, kw: string) {
        state.currentSearchKw = kw
      }
    }
  })
  return store
}