import Category from '@/dto/Category'
import { createStore } from 'vuex'

export default function create(){
  const store = createStore({
    state () {
      return {
        currentCategory: new Category() as Category
      }
    },
    mutations: {
      setCurrentCategory (state :any, category: Category) {
        state.currentCategory = category
      }
    }
  })
  return store
}