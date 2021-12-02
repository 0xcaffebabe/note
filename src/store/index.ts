import Category from '@/dto/Category'
import { createStore } from 'vuex'

const cateListKey='system::currentCategoryList';

export default function create(){
  const store = createStore({
    state () {
      return {
        // 当前所在的章节目录
        currentCategory: new Category() as Category,
        currentCategoryList: [] as string[],
        isDarkMode: false,
        // 当前所在的章节标题
        currentHeading: '' as string,
        currentSearchKw: '' as string
      }
    },
    mutations: {
      setCurrentCategory (state :any, category: Category) {
        state.currentCategory = category;
        const cateList :string[]= state.currentCategoryList;
        if (cateList.indexOf(category.link) == -1) {
          cateList.push(category.link)
        }
        localStorage.setItem(cateListKey, JSON.stringify(cateList));
      },
      removeFromCategoryList(state: any, link: string) {
        const cateList :string[]= state.currentCategoryList;
        const index = cateList.indexOf(link);
        if (index != -1) {
          cateList.splice(index, 1);
        }
        localStorage.setItem(cateListKey, JSON.stringify(cateList));
      },
      removeFromCategoryListExcept(state: any, link: string) {
        const cateList :string[]= state.currentCategoryList;
        const index = cateList.indexOf(link);
        if (index != -1) {
          state.currentCategoryList = cateList.splice(index, 1);
        }
        localStorage.setItem(cateListKey, JSON.stringify(cateList));
      },
      setSearchKw(state: any, kw: string) {
        state.currentSearchKw = kw
      },
      setCurrentHeading(state: any, heading: string) {
        state.currentHeading = heading
      },
      setCurrentCategoryList(state: any, cateList: string[]) {
        state.currentCategoryList = cateList
      },
      setIsDarkMode(state: any, dark: boolean) {
        state.isDarkMode = dark;
      }
    }
  })
  return store
}