# VUE

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

## vue-cli

Vue脚手架可以快速生成Vue项目基础的架构

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

### 配置

```js
// vue.config.js
module.exports = {
    devServer:{
        port:9001
    }
}
```

## 集成vue

- 单页面、多页面
  - vue.js
- 复杂单页面
  - vue-cli