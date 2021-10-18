// vuex.d.ts
import { Store } from 'vuex'
import Category from './dto/Category'
import { ComponentCustomProperties } from 'vue'

declare module '@vue/runtime-core' {
  // declare your own store states
  interface State {
    currentCategory: Category
  }

  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $store: Store<State>
  }
}