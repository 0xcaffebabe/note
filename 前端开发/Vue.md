# vue

## 两种视图模式

### MVP

![202002051355](/assets/202002051355.jpg)

- 与MVC不同的是，MVP中的M与V没有直接交互

### MVVM

![批注 2020-02-05 140125](/assets/批注%202020-02-05%20140125.png)

## vue实例

每个 Vue 应用都是通过用 Vue 函数创建一个新的 Vue 实例开始的

```js
var vm = new Vue({
  // 选项
})
```

```
根实例
└─ TodoList
   ├─ TodoItem
   │  ├─ DeleteTodoButton
   │  └─ EditTodoButton
   └─ TodoListFooter
      ├─ ClearTodosButton
      └─ TodoListStatistics
```

### 实例生命周期

![202002051607](/assets/202002051607.png)

## 数据渲染

### 插值表达式

```javascript
{{ number + 1 }}
{{ ok ? 'YES' : 'NO' }}
```

```html
<div v-text="message"></div><!--会进行HTML转义-->
<div v-html="message"></div>
<!-- 完整语法 -->
<a v-bind:href="url">...</a>
<!-- 缩写 -->
<a :href="url">...</a>
```

### 输入绑定

```html
<input type="text" v-model="user.password"><br/>
```

### 列表渲染

```html
<li v-for="(value,index) in arr">{{value}} and {{index}}</li>
```

### 条件渲染

```html
<span v-if="flag">传智播客</span>
<span v-show="flag">itcast</span>
```

### 样式绑定

- 绑定class

```html
<!-- 当isActive为true时，这个标签就会增加active这个类，反之会删除active这个类 -->
<h2 :class="{ 'active': isActive }">home</h2>
<h2 :class="{ active: isActive }">home</h2>
```

**数组语法**

```html
<div v-bind:class="[activeClass, errorClass]"></div>
```
```js
data: {
  activeClass: 'active',
  errorClass: 'text-danger'
}
```

渲染为

```html
<div class="active text-danger"></div>
```

- 绑定style

拼接字符串

```html
<div v-bind:style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
```

```js
data: {
  activeColor: 'red',
  fontSize: 30
}
```

样式对象

```html
<div v-bind:style="styleObject"></div>
```
data: {
  styleObject: {
    color: 'red',
    fontSize: '13px'
  }
}
```js

```

## 属性

### 计算属性

```js
new Vue({
   el:"#app",
   data:{
       msg:"123",
       birthday:158536
   }
   ,
    computed:{
       birth(){
           return new Date(this.birthday);
       }
    }
});
```

- 与方法的区别

>不同的是计算属性是基于它们的响应式依赖进行缓存的。只在相关响应式依赖发生改变时它们才会重新求值

**getter与setter**

```js
// ...
computed: {
  fullName: {
    // getter
    get: function () {
      return this.firstName + ' ' + this.lastName
    },
    // setter
    set: function (newValue) {
      var names = newValue.split(' ')
      this.firstName = names[0]
      this.lastName = names[names.length - 1]
    }
  }
}
// ...
```

### 侦听属性

```js
var vm = new Vue({
  el: '#demo',
  data: {
    firstName: 'Foo',
    lastName: 'Bar',
    fullName: 'Foo Bar'
  },
  watch: {
    // 当firstName属性发生改变，该方法会被调用
    firstName: function (val) {
      this.fullName = val + ' ' + this.lastName
    },
    lastName: function (val) {
      this.fullName = this.firstName + ' ' + val
    }
  }
})
```

## 常用系统指令

### v-on事件绑定

- v-on:click

```html
<button v-on:click="fun('这是使用vue绑定的点击事件')">vue的onclick</button>
```

```javascript
new Vue({
    el:"#app",
    data:{
        message:"hello world"//model
    },
    methods:{
        fun:function(msg){
            //alert(msg);
            this.message = msg;
        }
    }
});
```

- v-on:keydown

```html
<input type="text" v-on:keydown="fun($event)">
```

- v-on:mouseover

```html
<div @mouseover="fun1" id="div">
    <textarea @mouseover="fun2($event)">这是一个文件域</textarea>
</div>
```

`@mouseover == v-on:mouseover`

- 事件修饰符

```html
<!-- 阻止单击事件继续传播 -->
<a v-on:click.stop="doThis"></a>

<!-- 提交事件不再重载页面 -->
<form v-on:submit.prevent="onSubmit"></form>

<!-- 修饰符可以串联 -->
<a v-on:click.stop.prevent="doThat"></a>

<!-- 只有修饰符 -->
<form v-on:submit.prevent></form>

<!-- 添加事件监听器时使用事件捕获模式 -->
<!-- 即元素自身触发的事件先在此处理，然后才交由内部元素进行处理 -->
<div v-on:click.capture="doThis">...</div>

<!-- 只当在 event.target 是当前元素自身时触发处理函数 -->
<!-- 即事件不是从内部元素触发的 -->
<div v-on:click.self="doThat">...</div>
```

- 按键修饰符

`.enter` `.tab` `.delete` ( "删除" 和 "退格" ) `.esc` `.space` `.up` `.down` `.left` `.right` `.ctrl` `.alt` `.shift` `.meta`


# AJAX

- axios

```javascript
var that = this;
axios.get("/user/list")
    .then(function (r) {
        that.userList = r.data;
    })
    .catch(function(error){
        console.error(error);
    })
```

```js
var that = this;
axios.post("/user/"+this.user.id,this.user)
    .then(function (res) {
        alert(res.data);
        that.findAll();

    })
    .catch(function (reason) {
        console.error(reason);
    })
```

# 组件化

## 前端组件化

利用组件化开发，拆分功能，封装组件，单独维护

```js
// 定义一个名为 button-counter 的全局组件
Vue.component('button-counter', {
    data: function () {
        return {
            count: 0
        }
    },
    template: '<button v-on:click="count++">You clicked me {{ count }} times.</button>'
});
new Vue({ el: '#app' });
```
```html
<div id="app">
    <!-- 使用自定义组件 -->
    <button-counter></button-counter>
</div>
```

## 父子组件通信

```js
const introduce = {
    template:'<h1 @click="fun()">{{msg}}</h1>',
    methods: {
        fun() {
            // 触发上一层事件
           this.$emit('delete');
        }
    },
    props:['msg']
}
new Vue({
    el: '#app'
    ,
    data:{
        msg:'大家好，我是渣渣辉'
    }
    ,
    methods: {
        handleDelete() {
            // delete son
        }
    }
    ,
    components:{
        introduce
    }

});
```
```html
<div id="app">
    <introduce :msg="msg" @delete="handleDelete"></introduce>
</div>
```

## 组件化带来的问题

- 组件状态管理(vuex)
- 多组件混合使用(vue-router)
- 组件间的合作(props,emit/on,bus)

## vue-router

- 引入vue组件

```js
import Info from '../views/Info.vue';
```

- 在router中添加

```js
const routes = [
  //...
  {
    path: '/info',
    name: 'info',
    component: Info,
  },
];
```

## vuex

使用vuex来管理全局状态

- info组件向vuex发起请求

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
      console.log('vuex add');
    },
  }
  // ...
});
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

## vue-cli

### 安装

```shell
npm install -g @vue/cli
```

### 创建项目

```shell
vue create project-name
```

### 工程结构

![批注 2020-02-05 095145](/assets/批注%202020-02-05%20095145.png)

## 集成vue

- 单页面、多页面
  - vue.js
- 复杂单页面
  - vue-cli

