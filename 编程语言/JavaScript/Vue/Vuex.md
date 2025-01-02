# Vuex

Vuex是实现组件全局状态（数据）管理的一种机制，可以方便的实现组件之间的数据共享

![202002071127](/assets/202002071127.png)

## 使用vuex来管理全局状态

### 访问共享数据

```js
this.$store.state.count
```

```js
import { mapState } from 'vuex'
export default {
  data () { return {} },
  computed: {
    ...mapState(['count'])
  }
}
```

### 更新共享数据

- 向store触发一个事件

```js
import store from '@/store';

export default {
  name: 'info',
  store,
  methods: {
    add() {
      console.log('add');
      store.commit('add');
    },
  },
};
```

- vuex更新状态

```js
//...
export default new Vuex.Store({
  state: {
    count: 0
  },
  mutations: {
    add() {
      this.state.count++;
    },
  }
  // ...
});
```

- 传递参数

```js
this.$store.commit('add', 1)
```

```js
mutations: {
    add (state, step) {
      state.count += step
    }
}
```

```js
import { mapMutations } from 'vuex'

export default {
  ...
  methods: {
    ...mapMutations(['sub']),
    handleClick () {
      this.sub()
    }
  }
}
```

- 使用action异步更新数据

```js
actions: {
  addAsync (context) {
    setTimeout(() => {
      // action不能直接修改共享数据
      context.commit('add', 1)
    }, 1000)
  }
}
// 触发action
 this.$store.dispatch('addAsync')
// action同Mutation一样，也可以通过map引入vue实例
```

- about组件通过vuex来获取状态

```js
import store from '@/store';
  
export default {
  name: 'about',
  store,
  data() {
    return { count: store.state.count };
  },
};
```

### getter

```js
getters: {
    showNum (state) {
      return 'current val:' + state.count
    }
}
```

```html
<h2>{{$store.getters.showNum}}</h2>
```